from django.contrib import admin

# Register your models here.

from .models import Intra42User

@admin.register(Intra42User)
class apiIntra42UserAdmin(admin.ModelAdmin):
    list_display = ('intra_id', 'login', 'email','first_name','last_name','image')
