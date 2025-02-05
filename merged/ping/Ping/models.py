from django.db import models
from django.utils import timezone

class GameScore(models.Model):
    room_name = models.CharField(max_length=255)
    player1_username = models.CharField(max_length=255)
    player2_username = models.CharField(max_length=255)
    player1_score = models.IntegerField()
    player2_score = models.IntegerField()
    winner = models.CharField(max_length=255)
    game_type = models.CharField(max_length=50)  # 'tournament' or 'regular'
    tournament_id = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    transaction_hash = models.CharField(max_length=255, null=True, blank=True)  # Ethereum transaction hash
    
    class Meta:
        db_table = 'game_scores'