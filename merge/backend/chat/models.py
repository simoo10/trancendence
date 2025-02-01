from django.db import models

class OnlineUser(models.Model):
    username = models.CharField(max_length=100, unique=True)
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username

class ChannelMessage(models.Model):
    channel_name = models.CharField(max_length=200)
    sender = models.CharField(max_length=100)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} in {self.channel_name} at {self.timestamp}"