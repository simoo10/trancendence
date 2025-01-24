import uuid
import math
from typing import Dict, List, Optional
from dataclasses import dataclass




class Tournament:
    def __init__(self, num_players: int, is_online: bool, name: str):
        self.num_players = num_players
        self.is_online = is_online
        self.players: List[str] = []
        self.players_back: List[str] = []
        self.matches: Dict[str, dict] = {}
        self.bracket: List[List[dict]] = []
        self.current_round = 0
        self.tournament_id = str(uuid.uuid4())
        self.winners: Dict[str, str] = {}
        self.status = "waiting"
        self.active_matches: Dict[str, str] = {}  # match_id -> room_name
        self.active_round = 0
        self.name = name
        self.round = 0
        self.player_number = 1
        self.bay_winner = None
        self.players_left_pending = []
        self.start_new_round = False

    def add_player(self, channel_name: str, pong) -> bool:
        if len(self.players) < self.num_players and channel_name not in self.players:
            self.players.append(channel_name)
            self.players_back.append(pong)
            if self.is_full():
                self._create_bracket()
                self.status = "in_progress"
            return True
        return False

    def is_full(self) -> bool:
        return len(self.players) == self.num_players

    def is_empty(self) -> bool:
        return len(self.players) == 0

    def _handle_player_forfeit(self, channel_name: str):
        for round_idx, round_matches in enumerate(self.bracket):
            for match_idx, match in enumerate(round_matches):
                if (match["player1"] == channel_name or match["player2"] == channel_name) and match["winner"] == channel_name:
                    print (f"\n\n {channel_name} forfeited = {match}\n\n")
                    if round_idx == len(self.bracket) - 1:
                        return None  # Final match
                    
                    # Calculate next match position
                    next_round_idx = round_idx + 1
                    next_match_idx = match_idx // 2
                    next_match = self.bracket[next_round_idx][next_match_idx]
                    next_match["status"] = "completed"
                    print (f"match id = ", next_match["match_id"])
                    # print (f"\n\n {next_round_idx} {next_match_idx} 1--next = {next_match}\n\n")
        
        # Find all active matches with this player and handle forfeits
        for match in self.matches.values():
            if match["status"] == "pending" and (match["player1"] == channel_name or match["player2"] == channel_name):
                winner = match["player2"] if match["player1"] == channel_name else match["player1"]
                match["status"] = "completed"
                match["winner"] = winner
                self.winners[match["match_id"]] = winner


        # for br in self.bracket:
        #     for match in br:   
        #         # Calculate next match position
        #         if (match["player1"] == channel_name or match["player2"] == channel_name):
        #             # winner = match["player2"] if match["player1"] == channel_name else match["player1"]
        #             match["status"] = "completed"
        #             # if winner:
        #             #     match["winner"] = winner
        #             #     self.winners[match["match_id"]] = winner
        #             # else:
        #             #     match["winner"] = "win"
        #             #     match["name"] = match["name1"]
        #             #     match["player1"] = None
        #             #     match["player2"] = None
        #             #     match["name1"] = ""
        #             #     match["name2"] = ""
        #             print (f"here del = {match}")

    def remove_player(self, channel_name: str, pong):
        print ("remove player :", pong)
        if channel_name in self.players:
            self.players.remove(channel_name)
            self.players_back.remove(pong)
            if self.status == "in_progress":
                self._handle_player_forfeit(pong)
    
    def _create_bracket(self):
        # Calculate number of rounds needed
        num_rounds = math.ceil(math.log2(self.num_players))
        
        # Initialize bracket
        self.bracket = []
        remaining_players = self.players_back.copy()
        
        # Create first round with byes if necessary
        first_round = []
        matches_needed = 2 ** num_rounds
        byes = matches_needed - self.num_players
        
        for i in range(0, len(remaining_players), 2):
            if i + 1 < len(remaining_players) and i % 2 == 0:
                match_id = str(uuid.uuid4())
                match = {
                    "match_id": match_id,
                    "player1": remaining_players[i],
                    "name1": remaining_players[i].channel_name,
                    "player2": remaining_players[i + 1],
                    "name2": remaining_players[i + 1].channel_name,
                    "status": "pending",
                    "winner": None,
                    "name": ""
                }
                first_round.append(match)
                self.matches[match_id] = match
            elif (i + 1 == len(remaining_players)):
                # Handle bye
                match_id = str(uuid.uuid4())
                match = {
                    "match_id": match_id,
                    "player1": remaining_players[i],
                    "name1": remaining_players[i].channel_name,
                    "player2": None,
                    "name2": "",
                    "status": "completed",
                    "winner": remaining_players[i],
                    "name": remaining_players[i].channel_name
                }
                first_round.append(match)
                self.matches[match_id] = match
                self.winners[match_id] = remaining_players[i]
                print ("1-winners : ", self.winners)
        
        self.bracket.append(first_round)
        print ("\n\n1-first_round : ", first_round, "\n\n")
        
        # Create subsequent rounds
        for round_num in range(1, num_rounds):
            round_matches = []
            num_matches = 2 ** (num_rounds - round_num - 1)
            for _ in range(num_matches):
                match_id = str(uuid.uuid4())
                match = {
                    "match_id": match_id,
                    "player1": None,
                    "name1": "",
                    "player2": None,
                    "name2": "",
                    "status": "pending",
                    "winner": None,
                    "name": ""
                }
                round_matches.append(match)
                self.matches[match_id] = match
            self.bracket.append(round_matches)
            print ("\n\n1-round_matches : ", round_matches, "\n\n")
            
    
    def record_winner(self, match_id: str, winner_channel: str) -> Optional[dict]:

        # print ("-------match_id = ", match_id, self.matches, "\n-------------------")
        if match_id not in self.matches:
            return None
        if winner_channel not in self.players_back:
            return None
        
        match = self.matches[match_id]
        # print ("2-match = ", match)

        # if match["status"] == "completed":
        #     return None
        
        match["status"] = "completed"
        match["winner"] = winner_channel
        match["name"] = winner_channel.channel_name
        self.winners[match_id] = winner_channel
        
        # Update next round if necessary
        next_match = self._update_next_match(match_id)

        # if (next_match and (next_match["player1"] is None or next_match["player2"] is None)):
        #     self.bay_winner = next_match["player1"] if next_match["player1"] else next_match["player2"]
        #     self.bay_winner.match = next_match
        
        # Check if tournament is complete
        if len(self.bracket[-1]) == 1 and self.bracket[-1][0]["status"] == "completed":
            self.status = "completed"
        
        return next_match
    
    def _update_next_match(self, completed_match_id: str) -> Optional[dict]:
        # Find the round and position of the completed match

        for round_idx, round_matches in enumerate(self.bracket):
            for match_idx, match in enumerate(round_matches):
                if match["match_id"] == completed_match_id:
                    if round_idx == len(self.bracket) - 1:
                        return None  # Final match
                    
                    # Calculate next match position
                    next_round_idx = round_idx + 1
                    next_match_idx = match_idx // 2
                    next_match = self.bracket[next_round_idx][next_match_idx]
                    if next_match["player1"] not in self.players_back:
                        next_match["player1"] = None
                    # Update next match with winner
                    if next_match["player1"] is None:
                        next_match["player1"] = self.winners[completed_match_id]
                        next_match["name1"] = self.winners[completed_match_id].channel_name
                    elif next_match["player2"] is None and self.winners[completed_match_id] != next_match["player1"]:
                        next_match["player2"] = self.winners[completed_match_id]
                        next_match["name2"] = self.winners[completed_match_id].channel_name
                                        
                    # Check if this is the last match in the round
                    is_last_match = next_match == self.bracket[next_round_idx][-1]
                    remaining_matches = len([m for m in self.bracket[round_idx] if m["status"] != "completed"])
                    
                    # Return the match if:
                    # 1. Both players are set, OR
                    # 2. It's the last match in the round and we have one player and no more matches pending
                    if (next_match["player1"] is not None and next_match["player2"] is not None) or next_match["status"] == "completed":
                        if next_match["status"] == "completed":
                            next_match["winner"] = next_match["player1"] if next_match["player2"] is None else next_match["player1"]
                            next_match['name'] = next_match["winner"].channel_name
                            self.winners[next_match["match_id"]] = next_match["winner"]
                        return next_match
                    elif is_last_match and remaining_matches == 0 and next_round_idx != len(self.bracket) - 1:
                        # If this is the last match and only one player is set, they automatically win
                        winner = next_match["player1"] or next_match["player2"]
                        if winner:
                            next_match["status"] = "completed"
                            next_match["winner"] = winner
                            self.winners[next_match["match_id"]] = winner
                            # Recursively update the next round
                            # return self._update_next_match(next_match["match_id"])
                        return next_match
                    
        return None

    def _update_next_match2(self, completed_match_id: str) -> Optional[List[dict]]:
        # Find the round and position of the completed match
        next_matches = []
        completed_round_idx = None
        
        # First find which round the completed match is in
        for round_idx, round_matches in enumerate(self.bracket):
            for match_idx, match in enumerate(round_matches):
                if match["match_id"] == completed_match_id:
                    if round_idx == len(self.bracket) - 1:
                        return None  # Final match
                    completed_round_idx = round_idx
                    break
            if completed_round_idx is not None:
                break
        
        if completed_round_idx is None:
            return None
            
        next_round_idx = completed_round_idx + 1
        next_round = self.bracket[next_round_idx]
        
        # Update all potential next matches in the round
        for match_idx, next_match in enumerate(next_round):
            # Find which matches from the previous round feed into this match
            prev_match_indices = [match_idx * 2, match_idx * 2 + 1]
            prev_matches = []
            
            # Get the previous matches that feed into this next match
            # for prev_idx in prev_match_indices:
            #     if prev_idx < len(self.bracket[completed_round_idx]):
            #         prev_matches.append(self.bracket[completed_round_idx][prev_idx])
            
            # # Update next match with winners from completed matches
            # for prev_match in prev_matches:
                # if prev_match["status"] == "completed" and prev_match["winner"]:
            if next_match["player1"] is None:
                next_match["player1"] = self.winners[completed_match_id]
                next_match["name1"] = self.winners[completed_match_id].channel_name
            elif next_match["player2"] is None:
                next_match["player2"] = self.winners[completed_match_id]
                next_match["name2"] = self.winners[completed_match_id].channel_name
            
            # Check if this match is ready or needs special handling
            is_last_match = next_match == next_round[-1]
            remaining_matches = len([m for m in self.bracket[completed_round_idx] if m["status"] != "completed"])
            
            if next_match["player1"] is not None and next_match["player2"] is not None:
                next_matches.append(next_match)
            elif is_last_match and remaining_matches == 0:
                # Handle the case where there's only one player (bye situation)
                winner = next_match["player1"] or next_match["player2"]
                if winner:
                    next_match["status"] = "completed"
                    next_match["winner"] = winner
                    self.winners[next_match["match_id"]] = winner
                    # Add any subsequent matches that might be affected
                    # subsequent_matches = self._update_next_match(next_match["match_id"])
                    # if subsequent_matches:
                    #     next_matches.extend(subsequent_matches)
                next_matches.append(next_match)
        
        return next_matches if next_matches else None
    
    def get_display_data(self) -> dict:
        """
        Returns a JSON-serializable dictionary containing tournament information.
        """
        def serialize_value(v):
            """Helper function to serialize values"""
            if v is None:
                return ""
            # Check if object has a channel_name attribute (like PongConsumer)
            elif hasattr(v, 'channel_name'):
                return str(v.channel_name)
            # Check if object has __dict__ but is not a basic type
            elif hasattr(v, '__dict__') and not isinstance(v, (str, int, float, bool, dict, list)):
                return str(v)
            return v

        # Collect basic tournament info
        tournament_info = {
            "tournament_id": self.tournament_id,
            "name": self.name,
            "status": self.status,
            "total_players": self.num_players,
            "current_players": len(self.players),
            "is_online": self.is_online,
            "current_round": self.current_round,
        }
        
        # Format player information - only include serializable data
        players_info = {
            "registered": [str(player) for player in self.players],  # Convert to strings
            "total_needed": self.num_players,
            "spots_left": self.num_players - len(self.players)
        }
        
        # Format bracket information - ensure all data is serializable
        bracket_info = []
        for round_idx, round_matches in enumerate(self.bracket):
            round_data = {
                "round_number": round_idx + 1,
                "matches": []
            }
            
            for match in round_matches:
                match_data = {
                    "match_id": match["match_id"],
                    "player1": serialize_value(match["name1"]),
                    "player2": serialize_value(match["name2"]),
                    "status": match["status"],
                    "winner": serialize_value(match["name"]),
                    "is_active": match["match_id"] in self.active_matches,
                    "room_name": self.active_matches.get(match["match_id"])
                }
                round_data["matches"].append(match_data)
                
            bracket_info.append(round_data)
        
        # Collect match history - ensure winners are serializable
        match_history = {
            match_id: {
                "winner": serialize_value(self.matches[match_id]["name"]),
                "match_details": {
                    k: serialize_value(v)
                    for k, v in self.matches[match_id].items()
                }
            }
            for match_id, winner in self.winners.items()
        }
        
        # Combine all information
        display_data = {
            "tournament": tournament_info,
            "players": players_info,
            "bracket": bracket_info,
            "match_history": match_history,
            "active_matches": self.active_matches,
            "active_round": self.active_round
        }
        
        return display_data
        
class TournamentManager:
    def __init__(self):
        self.tournaments: Dict[str, Tournament] = {}  # tournament_id -> Tournament
        self.player_tournaments: Dict[str, str] = {}  # channel_name -> tournament_id
        self.open_tournaments: Dict[str, Tournament] = {}  # Tournaments still accepting players

    def create_tournament(self, num_players: int, is_online: bool, creator_channel: str, name: str) -> Tournament:
        tournament = Tournament(num_players, is_online, name)
        self.tournaments[tournament.tournament_id] = tournament
        self.open_tournaments[tournament.tournament_id] = tournament
        self.player_tournaments[creator_channel] = tournament.tournament_id
        return tournament

    def get_tournament(self, tournament_id: str) -> Optional[Tournament]:
        return self.tournaments.get(tournament_id)

    def get_player_tournament(self, channel_name: str) -> Optional[Tournament]:
        tournament_id = self.player_tournaments.get(channel_name)
        if tournament_id:
            return self.tournaments.get(tournament_id)
        return None

    def add_player_to_tournament(self, tournament_id: str, channel_name: str, pong) -> bool:
        tournament = self.tournaments.get(tournament_id)
        if tournament and tournament.add_player(channel_name, pong):
            self.player_tournaments[channel_name] = tournament_id
            if tournament.is_full():
                self.open_tournaments.pop(tournament_id, None)
            return True
        return False

    def remove_player(self, channel_name: str, pong) -> Optional[Tournament]:
        tournament_id = self.player_tournaments.pop(channel_name, None)
        if tournament_id:
            tournament = self.tournaments.get(tournament_id)
            if tournament:                
                tournament.remove_player(channel_name, pong)
                if tournament.is_empty():
                    self.tournaments.pop(tournament_id, None)
                    self.open_tournaments.pop(tournament_id, None)
                return tournament
        return None

    def get_open_tournaments(self) -> List[Dict]:
        return [
            {
                "tournament_id": t_id,
                "name": t.name,
                "num_players": t.num_players,
                "current_players": len(t.players),
                "is_online": t.is_online
            }
            for t_id, t in self.open_tournaments.items()
        ]