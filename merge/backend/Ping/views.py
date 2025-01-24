from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import render
from .srcs.setup import game_instance, initialize_game, update_game, resize_game
from .srcs.keys import update_keys

# Create your views here.

def home(request):
    return HttpResponse("Welcome to my PingPong backend!")

def ping(request):
    return render(request, 'ping.html')

def test(request):
    return render(request, 'index.html')

def obj(request):
    return render(request, 'obj/untitled.obj')

def mtl(request):
    return render(request, 'obj/untitled.mtl')

def typeface(request):
    return render(request, 'obj/droid_serif_bold.typeface.json')

def glb1(request):
    return render(request, 'obj/consrete.glb')

def game(request):
    return render(request, 'landing.html')

def LocalAi(request):
    return render(request, 'LocalAi.html')

def localMultiplayer(request):
    return render(request, 'localMultiplayer.html')

def onlineMultiplayer(request):
    return render(request, 'onlineMultiplayer.html')

def tournament(request):
    # permission_classes = [IsAuthenticated]
    return render(request, 'tournament.html')

def localBot(request):
    return render(request, 'localBot.html')

def login(request):
    return render(request, 'login.html')

def game2(request):
    return render(request, 'landingPong.html')

def test(request):
    return render(request, 'test.html')

# import srcs.setup as setup
# import srcs.keys as keys

