from django.contrib import admin
from .models import OnlineUser, ChannelMessage

@admin.register(OnlineUser)
class OnlineUserAdmin(admin.ModelAdmin):
    list_display = ("username", "last_active")

@admin.register(ChannelMessage)
class ChannelMessageAdmin(admin.ModelAdmin):
    list_display = ("channel_name", "sender", "message", "timestamp")
    list_filter = ("channel_name", "timestamp")
    search_fields = ("sender", "channel_name", "message")
