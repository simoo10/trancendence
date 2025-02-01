from channels.generic.websocket import AsyncWebsocketConsumer
from .setup2 import Game, Demonsions
import asyncio
import json
import uuid
from .Tournament import Tournament
from .Tournament import TournamentManager
from django.core.serializers.json import DjangoJSONEncoder
from asgiref.sync import sync_to_async


import logging

# Configure logging
logging.basicConfig(
    filename='replay_debug.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

active_users = []
active_games = {}
lobby = []  # Fixed typo from 'looby'
friend_looby = {}

class PongConsumer(AsyncWebsocketConsumer):
    tournament_manager = TournamentManager()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.for_lobby = None  # Fixed naming convention
        self.room_group_name = None
        self.room_name = None
        self.game = None
        self.opponent_channel = None
        self.type = None
        self.done = False
        self.trnmt = False
        self.tournament = None
        self.tournament_room = None
        self.dem = {}
        self.match = None
        self.player = ""
        self.username = ""
        self.opponentUsername = ""

    async def connect(self):
        self.for_lobby = [self.channel_name, self]
        await self.accept()

    # now handling when a player leave the tournament it gets deleted
    async def disconnect(self, close_code):
        print ("websocket disconnected")
        # Handle tournament disconnection
        if self.trnmt:
            if self.player == "player1":
                self.game.player1.score = -1
                # self.tournament.active_round -= 1
                # await self.handle_tournament_match_complete(None)
            elif self.player == "player2":
                self.game.player2.score = -1
            # await self.handle_tournament_match_complete(self)
            tournament = self.tournament_manager.remove_player(self.channel_name, self)
            if tournament:
                # print ("delete = ", tournament.players)
                await self.channel_layer.group_send(
                    f"tournament_{tournament.tournament_id}",
                    {
                        "type": "player_left_tournament",
                        "channel_name": self.channel_name
                    }
                )
            else :
                self.tournament.remove_player(self.channel_name, self)

        # Handle game disconnection
        if self.room_name in active_games:
            # print ("removing form active_games>>", active_games[self.room_name].online)
            if active_games[self.room_name].online:
                if self.player == "player1":
                    self.game.player1.score = -1
                elif self.player == "player2":
                    self.game.player2.score = -1
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "game_over",
                        "winner": "You won! Opponent disconnected.",
                        "message": "You won! Opponent disconnected.",
                        "player1": {
                            "score": self.game.player1.score
                        },
                        "player2": {
                            "score": self.game.player2.score
                        },
                    }
                )
                # if self.username in active_users:
                #     active_users.remove(self.username)
            # del active_games[self.room_name]
        if self.username in active_users:
            active_users.remove(self.username)

        # Handle lobby cleanup
        if self.for_lobby in lobby:
            lobby.remove(self.for_lobby)
            
        if self.room_group_name:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type", None)
        self.type = message_type
        self.dem = data.get('demonsions', {})

        if message_type != "game": self.username = data.get('username', "")

        self.friend = data.get('friend', None)

        if self.friend:
            self.looby_name = self.username + "_" + self.friend if self.username < self.friend else self.friend + "_" + self.username
            # friend_looby[self.looby_name] = []
            # friend_looby.get(self.looby_name, []).append(self.for_lobby)
        if message_type in ["AiOpenent", "BotOpenent", "LocalMultiplayerOpenent"]:
            await self.handle_single_player_game(message_type, data)
        elif message_type == "OnlineMultiplayerOpenent":
            if self.username not in active_users:
                print ("--active_users--", self.username)
                lobby.append(self.for_lobby) if self.friend is None else friend_looby.setdefault(self.looby_name, []).append(self.for_lobby)
                await self.handle_online_multiplayer(lobby if self.friend is None else friend_looby.get(self.looby_name, []), self.dem, self.friend)
                print ("2---active_users--", self.username)
            else :
                await self.send(text_data=json.dumps({
                    "type": "failed",
                    "title": "game creation failed",
                    "reason": "Player is already in an existing online game"
                }))
        elif message_type == "create_tournament":
            await self.handle_create_tournament(data) if self.username not in active_users else await self.send(text_data=json.dumps({
                "type": "failed",
                "title": "tournament creation failed",
                "reason": "Player is already in an existing online game"
            }))
        elif message_type == "join_tournament":
            await self.handle_join_tournament(data) if self.username not in active_users else await self.send(text_data=json.dumps({
                "type": "failed",
                "title": "tournament join failed",
                "reason": "Player is already in an existing online game"
            }))
        elif message_type == "list_tournaments":
            await self.handle_list_tournaments()
        elif message_type == "tournament_match_complete":
            await self.handle_tournament_match_complete(None)
        elif message_type == "game":
            if self.game and data.get("keys"):
                self.game.keys = data["keys"]

    async def handle_single_player_game(self, game_type, data):
        self.room_name = str(uuid.uuid4())
        self.room_group_name = f"pong_{self.room_name}"

        dimensions = Demonsions()
        dimensions.from_dict(data.get('demonsions', {}))

        player_types = {
            "AiOpenent": ["Player1", "AI"],
            "BotOpenent": ["Player1", "Bot"],
            "LocalMultiplayerOpenent": ["Player1", "Player2"]
        }

        self.game = Game(dimensions, player_types[game_type])
        active_games[self.room_name] = self.game
        self.game.username = "Blue"
        self.game.opponentUsername = "Red"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        opp = player_types[game_type][1]
        user = self.username
        print ("opp = ", opp, "user = ", user)
        if opp == "Player2":
            opp = "Red"
            user = "Blue"
            print ("2-opp = ", opp, "user = ", user)
        

        await self.send(text_data=json.dumps({
            "type": "game_start",
            "state": "Match starting!",
            "Iam": "Blue",
            "player": "player1",
            "opp": opp,
            "username": user,
            "tournament": self.trnmt
        }))

        asyncio.create_task(self.run_game())

    async def run_game(self):

        # First, send countdown signals
        for count in range(3, 0, -1):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "countdown_state",
                    "count": count,
                    "username": self.username,
                    "opp": self.opponentUsername
                }
            )
            await asyncio.sleep(1)
        
        # Send "GO!" message
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "countdown_state",
                "count": "GO!",
                "username": self.username,
                "opp": self.opponentUsername
            }
        )
        await asyncio.sleep(0.5)  # Short pause after "GO!"

        while self.room_name in active_games and not self.done:
            # print ("loop")
            self.game.update(self.game.keys)
            # =if self.game.Train == False:
            await self.channel_layer.group_send(
                self.room_group_name,
                self.game.get_state()
            )
            if self.done == True and self.game.Train == True:
                self.done = False
                self.game.first = True
            if self.game.Train == False:
                await asyncio.sleep(0.016)  # 60 FPS
        winner = [self.game.player1, "player1"] if self.game.player1.score > self.game.player2.score else [self.game.player2, "player2"]
        # self.game.resetGame()
        # print ("game done 1--", winner[1], self.trnmt)
        # if self.trnmt:
        #     self.tournament.active_round -= 1
        #     print ("active_round: ", self.tournament.active_round)
        #     while (self.tournament.active_round > 0):
        #         await self.channel_layer.group_send(
        #             self.room_group_name,
        #             {
        #                 "type": "game_over",
        #                 "winner": "You won! wait for the round to finish to proceed." if self.player == winner[1] else "You Lost, just scram"
        #             }
        #         )
        #         await asyncio.sleep(0.016)  # 60 FPS
        #     await asyncio.sleep(0.5)  # 60 FPS

        #     await self.handle_tournament_match_complete(None)
        return winner

    async def  handle_online_multiplayer(self, looby, dem, friend):
        # looby.append(self.for_lobby)        
        if len(looby) > 1:
            player1 = looby.pop(0)
            player2 = looby.pop(0)
            print ("--------------------starting game_creation")
            
            player1[1].room_name = str(uuid.uuid4())
            player1[1].room_group_name = f"pong_{player1[1].room_name}"
            player1[1].player = "player1"
            
            
            player2[1].room_name = player1[1].room_name
            player2[1].room_group_name = player1[1].room_group_name
            player2[1].player = "player2"

            dimensions = Demonsions()
            dimensions.from_dict(dem)

            player1[1].game = Game(dimensions, ["Player1", "Player2"])
            active_games[player1[1].room_name] = player1[1].game
            player1[1].game = player1[1].game
            player2[1].game = player1[1].game
            player1[1].game.online = True
            player1[1].done = False
            player2[1].done = False

            # player[1].opponent_username = player2[1].username
            # player2[1].opponent_username = player1[1].username

            print ( "username1 =", player1[1].username, "username2 =", player2[1].username)

            player1[1].game.username = player1[1].username
            player1[1].opponentUsername = player2[1].username
            player1[1].game.opponentUsername = player2[1].username

            print ( "username1 =", player1[1].game.username, "username2 =", player1[1].game.opponentUsername)


            # player2[1].game.username = player2[1].username
            # player2[1].opponentUsername = player1[1].username
            # player2[1].game.opponentUsername = player1[1].game.username

            # Add both players to the group
            for player in [player1, player2]:
                await player1[1].channel_layer.group_add(
                    player1[1].room_group_name,
                    player[0]
                )

            # Notify players
            print ("---------------------game_created ")
            await player1[1].channel_layer.send(player1[0], {
                "type": "game_start",
                "state": "Match found! You are Player 1 (Blue).",
                "Iam": "Blue",
                "player": "player1",
                "opp": player2[1].username,
                "username": player1[1].username,
                "tournament": player1[1].trnmt
            })
            await player1[1].channel_layer.send(player2[0], {
                "type": "game_start",
                "state": "Match found! You are Player 2 (RED).",
                "Iam": "RED",
                "player": "player2",
                "opp": player1[1].username,
                "username": player2[1].username,
                "tournament": player2[1].trnmt
            })
            print ("room_name: " , player1[1].room_name)
            asyncio.create_task(player1[1].run_game())
            if self.trnmt == False: active_users.append(self.username)
            return player1[1].room_name
        else:
            await self.send(text_data=json.dumps({"type": "waiting"}))
            if self.trnmt == False: active_users.append(self.username)
        return None

    async def game_state(self, event):
        # print("received game state")
        # Send the game state to the frontend
        await self.send(text_data=json.dumps(event))

    async def game_start(self, event):
        # print ("2222222222---------------------game_created ")
        await self.send(text_data=json.dumps(event))
    
    async def game_over(self, event):
        # print("received game over, ", self.trnmt, " ", self)
        self.done = True
        # Send the game over message to the frontend
        # await self.send(text_data=json.dumps(event))
        print ("user = ", self.username, "opp = ", self.opponentUsername)
        if self.room_name in active_games and self.opponentUsername != "":
            print ("delete : ", self.room_name)
            if active_games[self.room_name].online and self.trnmt is False:
                # print ("delete from active_users : ", active_users)
                print (f"delete from {active_users} : ", self.username, flush=True)
                if self.username in active_users:
                    print (f"delete me from {active_users} : ", self.username, flush=True)
                    active_users.remove(self.username)
                if self.opponentUsername in active_users:
                    print (f"delete opp from {active_users} : ", self.opponentUsername, flush=True)
                    active_users.remove(self.opponentUsername)
            
            if self.game.online:
                # Create database record

                from Ping.models import GameScore

                await sync_to_async(GameScore.objects.update_or_create) (
                    room_name=self.room_name,
                    player1_username=self.game.username,
                    player2_username=self.game.opponentUsername,
                    player1_score=self.game.player1.score,
                    player2_score=self.game.player2.score,
                    winner=self.game.username if self.game.player1.score > self.game.player2.score else self.game.opponentUsername,
                    game_type='tournament' if self.trnmt else 'regular',
                    tournament_id=self.tournament.tournament_id if self.trnmt else None
                )

                game_score = {
                    "room_name": self.room_name,
                    "player1_username": self.game.username,
                    "player2_username": self.game.opponentUsername,
                    "player1_score": self.game.player1.score,
                    "player2_score": self.game.player2.score,
                    "winner": self.game.username if self.game.player1.score > self.game.player2.score else self.game.opponentUsername,
                    "game_type": 'tournament' if self.trnmt else 'regular',
                    "tournament_id": self.tournament.tournament_id if self.trnmt else None
                }


                print ("game_score created : " , game_score)

            del active_games[self.room_name]
        if self.trnmt:
            if self.tournament:
                winner = [self.game.player1, "player1"] if self.game.player1.score > self.game.player2.score else [self.game.player2, "player2"]
                loser = [self.game.player1, "player1"] if self.game.player1.score < self.game.player2.score else [self.game.player2, "player2"]
                await self.send(text_data=json.dumps({
                    "type": "game_over",
                    "winner": "player1" if self.game.player1.score > self.game.player2.score else "player2",
                    "player1": {
                        "score": self.game.player1.score
                    },
                    "player2": {
                        "score": self.game.player2.score
                    },
                    "winner_username": winner[0].username,
                    "loser_username": loser[0].username,
                    "winner_score": winner[0].score,
                    "loser_score": loser[0].score,
                    "match_id": self.match["match_id"],
                    "message": "You won! wait for the round to finish to proceed." if self.player == winner[1] else "You Lost, just scram"
                }))
            winner = [self.game.player1, "player1"] if self.game.player1.score > self.game.player2.score else [self.game.player2, "player2"]
            if self.player == winner[1]:
                self.tournament.active_round -= 1
                # print ("winner = ", self.player , " : " , winner[1], self.trnmt)
                # print ("active_round: ", self.tournament.active_round,  " > match", self.match)
                # display_data = self.tournament.get_display_data()

                # print ("\n\n\ndisplay_data = ", display_data , "\n\n\n")
                await self.handle_tournament_update()

                # while (self.tournament.active_round > 0):
                #     await asyncio.sleep(0.2)  # 60 FPS
                #     try:
                #     except Exception as e:
                #         print(f"Error during handle_tournament_update: {e}")
                await asyncio.sleep(0.5)  # 60 FPS

                await self.handle_tournament_match_complete(None)
            else:
                print ("sending tournament info to loser: ", self)

                if self.username in active_users:
                    active_users.remove(self.username)
                # while (self.tournament):
                # try:
                await self.handle_tournament_update()
                # except Exception as e:
                #     print(f"Error during handle_tournament_update for loser: {e}")
                await asyncio.sleep(0.2)  # 60 FPS
                    # await self.handle_tournament_match_complete()
        else:
            await self.send(text_data=json.dumps(event))



    #################################################
    ############ Tournament Functions ###############
    #################################################

    # async def receive(self, text_data):
    #     data = json.loads(text_data)
    #     text_data = data.get("type", None)
        
    #     if text_data == "create_tournament":
    #         await self.handle_create_tournament(data)
    #     elif text_data == "join_tournament":
    #         await self.handle_join_tournament(data)
    #     elif text_data == "tournament_match_complete":
    #         await self.handle_tournament_match_complete(data)
    #     else:
    #         # Handle existing game types...
    #         pass

    async def handle_create_tournament(self, data):
        if self.trnmt:
            await self.send(text_data=json.dumps({
                "type": "failed",
                "title": "tournament creation failed",
                "reason": "Player is already in an existing tournament"
            }))
            return None
        num_players = data.get("num_players", 4)
        is_online = data.get("is_online", False)
        self.trnmt = True
        
        tournament = self.tournament_manager.create_tournament(
            num_players, is_online, self.channel_name, data.get("name", "default")
        )
        self.tournament = tournament
        self.tournament_manager.add_player_to_tournament(
            tournament.tournament_id, self.channel_name, self
        )
        # Add creator to tournament group
        await self.channel_layer.group_add(
            f"tournament_{tournament.tournament_id}",
            self.channel_name
        )
        
        await self.send(text_data=json.dumps({
            "type": "tournament_created",
            "name": tournament.name,
            "tournament_id": tournament.tournament_id,
            "players_needed": num_players - 1,
            "is_online": is_online
        }))
        active_users.append(self.username)

    async def handle_join_tournament(self, data):
        if self.trnmt:
            print ("player already in tournament")
            await self.send(text_data=json.dumps({
                "type": "failed",
                "title": "tournament join failed",
                "reason": "Player is already in an existing tournament"
            }))
            return None
        tournament_id = data.get("tournament_id")
        success = self.tournament_manager.add_player_to_tournament(
            tournament_id, self.channel_name, self
        )
        
        if success:
            active_users.append(self.username)
            self.trnmt = True
            tournament = self.tournament_manager.get_tournament(tournament_id)
            self.tournament = tournament
            await self.channel_layer.group_add(
                f"tournament_{tournament_id}",
                self.channel_name
            )
            
            if tournament.status == "in_progress":
                # print ("1-starting the matches: ", tournament.bracket)
                await self.channel_layer.group_send(
                    f"tournament_{tournament_id}",
                    {
                        "type": "tournament_start",
                        "bracket": "tournament.bracket"
                    }
                )
                # Start first round matches
                print ("starting the matches")
                await self.start_tournament_matches(tournament.bracket[0], tournament)
            else:
                await self.send(text_data=json.dumps({
                    "type": "tournament_joined",
                    "tournament_id": tournament_id
                    # "username": self.username,
                }))
        else:
            await self.send(text_data=json.dumps({
                "type": "failed",
                "title": "tournament join failed",
                "reason": "Tournament full or not found"
            }))

    async def handle_list_tournaments(self):
        open_tournaments = self.tournament_manager.get_open_tournaments()
        await self.send(text_data=json.dumps({
            "type": "tournament_list",
            "tournaments": open_tournaments
        }))

    async def start_tournament_matches(self, matches, tournament):
        for match in matches:
            if match["player1"] and match["player2"] and match["status"] == "pending":
                looby = []
                looby.append([match["player1"].channel_name, match["player1"]])
                looby.append([match["player2"].channel_name, match["player2"]])

                # try:
                room_name = await self.handle_online_multiplayer(looby, self.dem, None)
                # print("handle_online_multiplayer executed successfully!")
                # except Exception as e:
                #     print(f"Error in handle_online_multiplayer: {e}")
                
                tournament.active_matches[match["match_id"]] = room_name
                tournament.active_round += 1
                match["player1"].match = match
                match["player2"].match = match
                print (tournament.active_round, "start match: ", match["match_id"], ", at: ", room_name)
            if (match["player1"] or match["player2"]) and (match["player1"] is None or match["player2"] is None) and self.tournament.status != "completed":
                winner = match["player1"] if match["player1"] is not None else match["player2"]
                if winner == self:
                    winner.match = match
                    await winner.handle_tournament_match_complete(winner)
        # while True:
        #     if self.active_round == 0:
        #         break
        #     await asyncio.sleep(1)

            

                # room_name = str(uuid.uuid4())
                # room_group_name = f"pong_{room_name}"
                
                # # Store the active match room
                
                # game = Game(tournament.demonsions, ["Player1", "Player2"])
                # active_games[room_name] = game
                
                # await self.channel_layer.group_add(room_group_name, match["player1"])
                # await self.channel_layer.group_add(room_group_name, match["player2"])
                
                # await self.channel_layer.group_send(
                #     room_group_name,
                #     {
                #         "type": "match_start",
                #         "match_id": match["match_id"],
                #         "room_name": room_name
                #     }
                # )
    #here needs to handle odd winers in the next matches
    async def handle_tournament_match_complete(self, winner):
        while (self.tournament.active_round > 0):
            await asyncio.sleep(0.2)  # 60 FPS
        await asyncio.sleep(0.5)
        if self not in self.tournament.players_back:
            return None
        # if self.tournament.start_new_round == False:
        #     self.tournament.players_left_pending
        # self.tournament.start_new_round = True
        # match_id = data.get("match_id")
        # winner_channel = data.get("winner_channel")
        match_id = self.match["match_id"]
        if winner == None:
            winner = self.match["player1"] if self.game.player1.score > self.game.player2.score else self.match["player2"]
        winner_channel = winner.channel_name
        
        if self.tournament:
            next_matches = []
            next_matches.append(self.tournament.record_winner(match_id, winner))
            # if self.tournament.bay_winner:
            #     print ("self.tournament.bay_winner.match = ", self.tournament.bay_winner.match )

            #     next_matches.append(self.tournament.record_winner(self.tournament.bay_winner.match["match_id"], self.tournament.bay_winner))
            #     self.tournament.bay_winner = None
            if next_matches:
                for next_match in next_matches:
                    # Start next match if both players are ready
                    if next_match:
                        if next_match["player1"] and next_match["player2"]:
                            await self.start_tournament_matches([next_match], self.tournament)
                        elif self.tournament.active_round == 0 or next_match["status"] == "completed":
                            await self.start_tournament_matches([next_match], self.tournament)

            if self.tournament.status == "completed":
                display_data = self.tournament.get_display_data()
                print (f"{self.channel_name} winner = ", self.tournament.bracket[-1][0]["winner"])
                await self.channel_layer.group_send(
                    f"tournament_{self.tournament.tournament_id}",
                    {
                        "type": "tournament_complete",
                        "winner": str(self.tournament.bracket[-1][0]["winner"]),
                        "display_data": display_data
                    }
                )
                return None
            if (self.match["player1"] is None or self.match["player2"] is None) and self.tournament.status != "completed":
                # while (self.tournament.active_round == 0):
                #     await asyncio.sleep(0.2)  # 60 FPS
                await self.handle_tournament_match_complete(self)


    async def tournament_start(self, event):
        await self.send(text_data=json.dumps(event))

    async def match_start(self, event):
        await self.send(text_data=json.dumps(event))

    async def tournament_complete(self, event):
        await self.send(text_data=json.dumps(event))
    
    async def player_left_tournament(self, event):
        """
        Handle a player leaving the tournament.
        """
        # Example: Broadcast or process player leaving logic
        tournament_id = event.get("tournament_id", "Unknown")
        player_id = event.get("player_id", "Unknown")
        print(f"Player {player_id} left tournament {tournament_id}")
        
        # Example: Send a response back to the frontend if needed
        await self.send(text_data=json.dumps({
            "type": "player_left_tournament_ack",
            "tournament_id": tournament_id,
            "player_id": player_id,
        }))

    async def countdown_state(self, event):
        # Send countdown to the frontend
        await self.send(text_data=json.dumps({
            "type": "countdown",
            "count": event["count"]
        }))

    async def handle_tournament_update(self):
        """Send tournament display data to all players in the tournament."""
        if self.tournament:
            # try:
            display_data = self.tournament.get_display_data()
            
            # # Verify the data is JSON serializable before sending
            # try:
            #     json.dumps(display_data, cls=DjangoJSONEncoder)
            # except TypeError as e:
            #     print(f"Tournament data serialization error: {e}")
            #     return
                
            await self.channel_layer.send(
                self.channel_name,
                {
                    "type": "tournament_update",
                    "display_data": display_data
                }
            )
            # except Exception as e:
            #     print(f"Error in handle_tournament_update: {e}")

    async def send_tournament_update(self, event):
        """Send tournament update to the websocket."""
        await self.send(text_data=json.dumps({
            "type": "tournament_update",
            "display_data": event["display_data"]
        }))
    
    async def tournament_update(self, event):
        """Send tournament update to the websocket."""
        await self.send(text_data=json.dumps(event))



# Chat Consumer
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Extract username from query parameters or authentication
        self.username = self.scope['url_route']['kwargs'].get('username')
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave any chat rooms the user was in
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name, 
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'start_chat':
            await self.handle_start_chat(data)
        elif message_type == 'send_message':
            await self.handle_send_message(data)

    async def handle_start_chat(self, data):
        friend_username = data.get('friend_username')
        
        # Create unique room name by sorting usernames
        usernames = sorted([self.username, friend_username])
        room_name = f"{usernames[0]}_{usernames[1]}"
        
        # Add both users to the room group
        await self.channel_layer.group_add(room_name, self.channel_name)
        self.room_group_name = room_name

        await self.send(text_data=json.dumps({
            'type': 'chat_started',
            'room_name': room_name
        }))

    async def handle_send_message(self, data):
        message = data.get('message')
        
        # Send message to the room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.username
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
            'sender': event['sender']
        }))

    
# class GameChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # Extract users from URL routing
#         # self.user1 = self.scope['url_route']['kwargs']['user1']
#         # self.user2 = self.scope['url_route']['kwargs']['user2']
        
#         # # Create a unique room name
#         # self.room_name = f'chat_{sorted([self.user1, self.user2])[0]}_{sorted([self.user1, self.user2])[1]}'
        
#         # # Join room group
#         # await self.channel_layer.group_add(
#         #     self.room_name,
#         #     self.channel_name
#         # )
        
#         await self.accept()

#     async def disconnect(self, close_code):
#         # Leave room group
#         if hasattr(self, 'room_name'):
#             await self.channel_layer.group_discard(
#                 self.room_name,
#                 self.channel_name
#             )

#     async def receive(self, text_data):
#         # Parse incoming message
#         try:
#             data = json.loads(text_data)
#             message_type = data.get('type')
            
#             if message_type == 'init':
#                 # Handle initialization
#                 self.current_user = data['from']
#                 self.friend_user = data['to']
#                 # Create a unique room name for this chat pair
#                 users = sorted([self.current_user, self.friend_user])
#                 self.room_name = f"chat_{users[0]}_{users[1]}"
#                 # Join room
#                 await self.channel_layer.group_add(
#                     self.room_name,
#                     self.channel_name
#                 )
            
#             elif message_type == 'message':
#                 # Handle chat message
#                 await self.channel_layer.group_send(
#                     self.room_name,
#                     {
#                         'type': 'chat_message',
#                         'message': data['message'],
#                         'from': data['from'],
#                         'to': data['to']
#                     }
#                 )
        
#         except json.JSONDecodeError:
#             await self.send(text_data=json.dumps({
#                 'error': 'Invalid message format'
#             }))
        
#         # # Validate message
#         # if not message or not sender or not recipient:
#         # #     return
        
#         # # Send message to room group
#         # await self.channel_layer.group_send(
#         #     self.room_name,
#         #     {
#         #         'type': 'chat_message',
#         #         'message': message,
#         #         'sender': sender
#         #     }
#         # )

#     # async def chat_message(self, event):
#     #     # Send message to WebSocket
#     #     await self.send(text_data=json.dumps({
#     #         'message': event['message'],
#     #         'sender': event['sender']
#     #     }))
#     async def chat_message(self, event):
#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({
#             'message': event['message'],
#             'from': event['from'],
#             'to': event['to']
#         }))