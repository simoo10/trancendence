import json
from django.http import JsonResponse
from .setup import game_instance, initialize_game, update_game
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
def update_keys(request):
    global game_instance
    if game_instance is None:
        return JsonResponse({'error': 'Game not initialized. Please initialize the game first.'})
    if request.method == 'POST':
        # Get the key states from the request
        key_states = json.loads(request.body)
        print (key_states)
        # Update the game keys
        #game_instance.keys.update(key_states)

        # Return the updated game state
        return JsonResponse(game_instance.to_dict())
