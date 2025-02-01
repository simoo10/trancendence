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



from django.http import JsonResponse
from django.db.models import Count, Case, When, F, FloatField
from Ping.models import GameScore
from django.db.models.functions import Round

def get_player_stats(request, username):
    # Get all games for the player
    games = GameScore.objects.filter(
        player1_username=username) | GameScore.objects.filter(
        player2_username=username
    ).order_by('-created_at')

    # Calculate win rate with corrected logic
    stats = games.aggregate(
        total_games=Count('id'),
        # Count wins when player is player1 OR player2
        wins=Count(Case(
            # When player is player1, check if player1_score is greater
            When(player1_username=username, 
                 player1_score__gt=F('player2_score'), 
                 then=1),
            # When player is player2, check if player2_score is greater
            When(player2_username=username, 
                 player2_score__gt=F('player1_score'), 
                 then=1),
        )),
        # Count tournament games
        tournament_games=Count(Case(
            When(game_type='tournament', then=1)
        )),
        # Count tournament wins with the same logic as above
        tournament_wins=Count(Case(
            When(game_type='tournament', 
                 player1_username=username,
                 player1_score__gt=F('player2_score'), 
                 then=1),
            When(game_type='tournament', 
                 player2_username=username,
                 player2_score__gt=F('player1_score'), 
                 then=1),
        ))
    )
    
    # Calculate win rates
    total_games = stats['total_games']
    if total_games > 0:
        stats['overall_win_rate'] = round((stats['wins'] / total_games) * 100, 2)
    else:
        stats['overall_win_rate'] = 0

    tournament_games = stats['tournament_games']
    if tournament_games > 0:
        stats['tournament_win_rate'] = round(
            (stats['tournament_wins'] / tournament_games) * 100, 2)
    else:
        stats['tournament_win_rate'] = 0

    # Get recent matches with corrected logic
    recent_matches = []
    for game in games[:10]:  # Last 10 games
        # Determine if the current user is player1 or player2
        is_player1 = game.player1_username == username
        
        match_data = {
            'date': game.created_at.strftime('%Y-%m-%d %H:%M'),
            # If current user is player1, opponent is player2, and vice versa
            'opponent': game.player2_username if is_player1 else game.player1_username,
            # Get correct scores based on player position
            'player_score': game.player1_score if is_player1 else game.player2_score,
            'opponent_score': game.player2_score if is_player1 else game.player1_score,
            # Determine if won based on player position and scores
            'won': (is_player1 and game.player1_score > game.player2_score) or
                  (not is_player1 and game.player2_score > game.player1_score),
            'game_type': game.game_type,
            'tournament_id': game.tournament_id,
            # Add these fields for debugging
            'debug_info': {
                'is_player1': is_player1,
                'actual_player1': game.player1_username,
                'actual_player2': game.player2_username,
                'actual_score1': game.player1_score,
                'actual_score2': game.player2_score
            }
        }
        recent_matches.append(match_data)

    # Add debug information to help track the issue
    stats['debug_info'] = {
        'total_games_player1': games.filter(player1_username=username).count(),
        'total_games_player2': games.filter(player2_username=username).count(),
        'sample_game_ids': list(games.values_list('id', flat=True)[:5])
    }

    return JsonResponse({
        'stats': stats,
        'recent_matches': recent_matches
    })

# import srcs.setup as setup
# import srcs.keys as keys

