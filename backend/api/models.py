from django.db import models

class Intra42User(models.Model):
    intra_id = models.IntegerField(unique=True)  # Unique ID from Intra42
    login = models.CharField(max_length=1000, unique=True)  # User's login name
    email = models.EmailField(unique=True)  # User's email
    first_name = models.CharField(max_length=1000, blank=True, null=True)  # First name
    last_name = models.CharField(max_length=1000, blank=True, null=True)  # Last name
    image = models.URLField(max_length=10000,blank=True, null=True)  # URL to profile picture
    # access_token = models.TextField(blank=True, null=True)  # Store the access token for API calls
    # refresh_token = models.TextField(null=True, blank=True)  # Optional: Refresh token
    #kind = models.CharField(max_length=1000)  # User kind or role

    def __str__(self):
        return self.login



#id,email,login,last_name,usual_full_name,url,phone,displayname:reda bouissali
# #kind:student,image:{'link': 'https://cdn.intra.42.fr/users/a3eeff3cb3803a74a575bce46cb21021/rbouissa.JPG', 'versions': {'large': 'https://cdn.intra.42.fr/users/36321d78d5c54ac008580c633a958b92/large_rbouissa.JPG', 'medium': 'https://cdn.intra.42.fr/users/2d908253b509b03c0e33b1c3050e226e/medium_rbouissa.JPG', 'small': 'https://cdn.intra.42.fr/users/54c3150e5b52ef6bf9212d37fdc87313/small_rbouissa.JPG',
# #pool_month,pool_year,Wallet: 145,created_at,updated_at,correction_point