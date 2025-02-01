# from channels.generic.websocket import AsyncWebsocketConsumer
# import asyncio
# import json
# import uuid
# from django.core.serializers.json import DjangoJSONEncoder

# from asgiref.sync import sync_to_async

# from django.utils import timezone

# active_chats = {}
# active_users = {}

# class GameChatConsumer(AsyncWebsocketConsumer):
#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         self.room_name = None
#         self.current_user = None
#         self.friend_user = None

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
#         self.username = self.scope["user"].username  # Assuming user authentication
#         from chat.models import OnlineUser
#         await sync_to_async(OnlineUser.objects.update_or_create)(
#             username=self.username, defaults={"last_active": timezone.now()}
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         # Leave room group
#         print ("disconnect for ", self.username, self.room_name)
#         if hasattr(self, 'room_name'):
#             await self.channel_layer.group_discard(
#                 self.room_name,
#                 self.channel_name
#             )
#         from chat.models import OnlineUser
#         await sync_to_async(OnlineUser.objects.filter(username=self.username).delete)()

#     async def receive(self, text_data):
#         # Parse incoming message
#         try:
#             data = json.loads(text_data)
#             message_type = data.get('type')
            
#             if message_type == 'init':
#                 # Handle initialization
#                 self.current_user = data['from']
#                 self.friend_user = data['to']

#                 active_users[self.current_user] = self
#                 # Create a unique room name for this chat pair
#                 users = sorted([self.current_user, self.friend_user])
#                 self.room_name = f"chat_{users[0]}_{users[1]}"

#                 print ("room_ame : ", self.room_name)

#                 # Fetch previous messages
#                 from chat.models import ChannelMessage
#                 messages = await sync_to_async(list)(
#                     ChannelMessage.objects.filter(channel_name=self.room_name).order_by("timestamp")
#                 )

#                 # Send previous messages to the client
#                 await self.send(text_data=json.dumps({
#                     "type": "previous_messages",
#                     "messages": [
#                         {"sender": msg.sender, "message": msg.message, "timestamp": msg.timestamp.isoformat()}
#                         for msg in messages
#                     ],
#                 }))

#                 # Join room
#                 await self.channel_layer.group_add(
#                     self.room_name,
#                     self.channel_name
#                 )
            
#             elif message_type == 'message':
#                 # Handle chat message
#                 from chat.models import ChannelMessage
#                 await sync_to_async(ChannelMessage.objects.create)(
#                     channel_name=self.room_name,
#                     sender=data["from"],
#                     message=data["message"],
#                 )
#                 # await self.channel_layer.group_send(
#                 #     self.room_name,
#                 #     {
#                 #         'type': 'chat_message',
#                 #         'message': data['message'],
#                 #         'from': data['from'],
#                 #         'to': data['to']
#                 #     }
#                 # )
#                 await self.channel_layer.send (active_users.get(data['to'], active_users[self.current_user]).channel_name, {
#                     'type': 'chat_message',
#                     'message': data['message'],
#                     'from': data['from'],
#                     'to': data['to']
#                 })
        
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


from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import json
from django.utils import timezone
from asgiref.sync import sync_to_async

# Store all active users and their socket connections
active_users = {}
active_chats = {}

class GameChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None
        self.current_user = None
        self.friend_user = None
        self.is_standby = False
        self.current_chats = []

    async def connect(self):
        self.username = self.scope["user"].username
        from chat.models import OnlineUser
        await sync_to_async(OnlineUser.objects.update_or_create)(
            username=self.username,
            defaults={"last_active": timezone.now()}
        )
        await self.accept()

    async def disconnect(self, close_code):
        print ("disconnect for ", self.current_user, self.current_chats)
        for target in self.current_chats:
            print ("send close to ", target.current_user)
            await target.send(text_data=json.dumps({
                'type': 'close',
                'from': target.current_user
            }))
        if self.current_user in active_users:
            del active_users[self.current_user]
        
        if hasattr(self, 'room_name') and self.room_name:
            await self.channel_layer.group_discard(
                self.room_name,
                self.channel_name
            )
        
        from chat.models import OnlineUser
        await sync_to_async(OnlineUser.objects.filter(username=self.username).delete)()

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'standby':
                # Register this connection as a standby socket
                self.current_user = data['username']
                self.is_standby = True
                active_users[self.current_user] = self
                print(f"User {self.current_user} registered in standby mode")

            elif message_type == 'request':
                # Handle chat request
                target_user = active_users.get(data['to'])
                if target_user:
                    await target_user.send(text_data=json.dumps({
                        'type': 'request',
                        'from': data['from']
                    }))
                else:
                    # Inform requester that user is offline
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'User {data["to"]} is offline'
                    }))

            elif message_type == 'game_invite':
                # Handle chat request
                target_user = active_users.get(data['to'])
                if target_user:
                    await target_user.send(text_data=json.dumps({
                        'type': 'game_invite',
                        'from': data['from']
                    }))
                else:
                    # Inform requester that user is offline
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'User {data["to"]} is offline'
                    }))
            
            elif message_type == 'game_response':
                # Handle response to chat request
                target_user = active_users.get(data['to'])
                if target_user:
                    await target_user.send(text_data=json.dumps({
                        'type': 'game_response',
                        'from': data['from'],
                        'accepted': data['accepted']
                    }))
                else:
                    # Inform requester that user is offline
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'User {data["to"]} is offline'
                    }))
            
            elif message_type == 'acceptedChat':
                # Handle chat request
                target_user = active_users.get(data['by'])
                self.current_chats.append(target_user)
                
            elif message_type == 'response':
                # Handle response to chat request
                target_user = active_users.get(data['to'])
                if target_user:
                    await target_user.send(text_data=json.dumps({
                        'type': 'response',
                        'from': data['from'],
                        'accepted': data['accepted']
                    }))

                    if data['accepted']:
                        # If accepted, set up the chat room
                        self.friend_user = data['to']
                        users = sorted([self.current_user, self.friend_user])
                        self.room_name = f"chat_{users[0]}_{users[1]}"

                        self.current_chats.append(target_user)
                        
                        # Join room
                        await self.channel_layer.group_add(
                            self.room_name,
                            self.channel_name
                        )

                        # Fetch and send previous messages
                        from chat.models import ChannelMessage
                        messages = await sync_to_async(list)(
                            ChannelMessage.objects.filter(channel_name=self.room_name).order_by("timestamp")
                        )
                        
                        await self.send(text_data=json.dumps({
                            "type": "previous_messages",
                            "messages": [
                                {
                                    "sender": msg.sender,
                                    "message": msg.message,
                                    "timestamp": msg.timestamp.isoformat()
                                }
                                for msg in messages
                            ],
                        }))

                        await target_user.send(text_data=json.dumps({
                            'type': 'previous_messages',
                            'messages': [
                                {
                                    "sender": msg.sender,
                                    "message": msg.message,
                                    "timestamp": msg.timestamp.isoformat()
                                }
                                for msg in messages
                            ],
                        }))
                        # send it to whole room
                        # await self.channel_layer.group_send(
                        #     self.room_name,
                        #     {
                        #         "type": "previous_messages",
                        #         "messages": [
                        #             {
                        #                 "sender": msg.sender,
                        #                 "message": msg.message,
                        #                 "timestamp": msg.timestamp.isoformat()
                        #             }
                        #             for msg in messages
                        #         ],
                        #     }
                        # )
            

            elif message_type == 'message':
                # Store message in database
                print ( "chats : ", [username for username in self.current_chats])
                from chat.models import ChannelMessage
                self.friend_user = data['to']
                users = sorted([self.current_user, self.friend_user])
                self.room_name = f"chat_{users[0]}_{users[1]}"
                        
                await sync_to_async(ChannelMessage.objects.create)(
                    channel_name=self.room_name,
                    sender=data["from"],
                    message=data["message"],
                )

                # Send message to recipient
                target_user = active_users.get(data['to'])
                if target_user:
                    await target_user.send(text_data=json.dumps({
                        'type': 'message',
                        'message': data['message'],
                        'from': data['from'],
                        'to': data['to']
                    }))
                else:
                    # Message couldn't be delivered
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'User {data["to"]} is offline'
                    }))
            
            elif message_type == 'close':
                # Close chat
                target_user = active_users.get(data['to'])

                self.friend_user = data['to']
                users = sorted([self.current_user, self.friend_user])
                self.room_name = f"chat_{users[0]}_{users[1]}"

                if target_user in self.current_chats: self.current_chats.remove(target_user)
                
                if target_user:
                    await target_user.send(text_data=json.dumps({
                        'type': 'close',
                        'from': data['from']
                    }))
                    await self.channel_layer.group_discard(
                        self.room_name,
                        self.channel_name
                    )
                else:
                    # Inform requester that user is offline
                    await self.send(text_data=json.dumps({
                        'type': 'error',
                        'message': f'User {data["to"]} is offline'
                    }))

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid message format'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))
        
        # handler for previous messages
    async def previous_messages(self, event):
        await self.send(text_data=json.dumps({
            "type": "previous_messages",
            "messages": event["messages"]
        }))