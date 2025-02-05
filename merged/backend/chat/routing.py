from django.urls import path
from .srcs.consumer import GameChatConsumer

websocket_urlpatterns_chat = [
    path('chat/', GameChatConsumer.as_asgi()),
]