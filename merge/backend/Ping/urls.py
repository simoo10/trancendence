from django.urls import path
from . import views
# from .srcs.consumer import PongConsumer


urlpatterns = [
    path('', views.home, name='home'),
    path('ping/', views.ping, name='ping'),
    path('test/', views.test, name='test'),
    path('update-keys/', views.update_keys, name='update_keys'),
    path('initialize-game/', views.initialize_game, name='initialize_game'),
    path('update-game/', views.update_game, name='update_game'),
    path('resize-game/', views.resize_game, name='resize_game'),
    path('untitled.obj', views.obj, name='obj'),
    path('untitled.mtl', views.mtl, name='mtl'),
    path('droid_serif_bold.typeface.json', views.typeface, name='typeface'),
    path('concrete.glb', views.glb1, name='glb1'),
    path('game/', views.game, name='game'),
    path('LocalAi/' , views.LocalAi, name='LocalAi'),
    path('localMultiplayer/' , views.localMultiplayer, name='localMultiplayer'),
    path('onlineMultiplayer/' , views.onlineMultiplayer, name='onlineMultiplayer'),
    path('tournament/' , views.tournament, name='tournament'),
    path('localBot/' , views.localBot, name='localBot'),
    
    path('login/' , views.login, name='login'),

    path('game2/', views.game2, name='game2'),
    path('test/', views.test, name='test'),
    # path('signup/' , views.signup, name='signup'),
    # path('logout/' , views.logout, name='logout'),
    # path('gameover/' , views.gameover, name='gameover'),
    # path('leaderboard/' , views.leaderboard, name='leaderboard'),

    path('api/player-stats/<str:username>/', views.get_player_stats, 
         name='player_stats'),

]

# websocket_urlpatterns = [
#     path('ping/ws/pong/', PongConsumer.as_asgi()),
# ]