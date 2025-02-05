from django.urls import path
from .srcs.consumer import PongConsumer
from .srcs.consumer import ChatConsumer
# from .srcs.consumer import GameChatConsumer

websocket_urlpatterns = [
    path('ws/pong/', PongConsumer.as_asgi()),
    path('ws/chat/', ChatConsumer.as_asgi()),
    # path('chat/', GameChatConsumer.as_asgi()),
]
