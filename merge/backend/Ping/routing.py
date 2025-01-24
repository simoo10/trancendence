from django.urls import path
from .srcs.consumer import PongConsumer

websocket_urlpatterns = [
    path('ws/pong/', PongConsumer.as_asgi()),
    path('ws/chat/', PongConsumer.as_asgi()),
]
