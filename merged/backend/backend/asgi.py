"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from django.urls import path
# from channels.auth import AuthMiddlewareStack
# from Ping.urls import websocket_urlpatterns
# from Ping.routing import websocket_urlpatterns as ping_websocket_urlpatterns
# from chat.routing import websocket_urlpatterns_chat

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# # Combine WebSocket URL patterns
# websocket_urlpatterns = ping_websocket_urlpatterns + websocket_urlpatterns_chat

# application = ProtocolTypeRouter({
#     "http": get_asgi_application(),
#     "websocket": AuthMiddlewareStack(
#         URLRouter(websocket_urlpatterns)
#     ),
# })

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
