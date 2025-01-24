from django.contrib.auth.models import AbstractUser
from django.db import models

class Intra42User(AbstractUser):
    intra_id = models.CharField(null=True ,max_length=101)
    login = models.CharField(max_length=100, unique=True)  # User's login name
    email = models.EmailField(unique=True)  # User's email
    image = models.URLField(max_length=10000, blank=True, null=True)  # Profile picture URL
    username = None
    password = models.CharField(max_length=128, blank=True, null=True)  # Optional password field
    first_name = models.CharField(max_length=100, blank=True, null=True, default='')  # Set a default value
    last_name = models.CharField(max_length=100, blank=True, null=True, default='')  # Set a default value
    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['email']
    # def __str__(self):
    #     return self.login


#id,email,login,last_name,usual_full_name,url,phone,displayname:reda bouissali
# #kind:student,image:{'link': 'https://cdn.intra.42.fr/users/a3eeff3cb3803a74a575bce46cb21021/rbouissa.JPG', 'versions': {'large': 'https://cdn.intra.42.fr/users/36321d78d5c54ac008580c633a958b92/large_rbouissa.JPG', 'medium': 'https://cdn.intra.42.fr/users/2d908253b509b03c0e33b1c3050e226e/medium_rbouissa.JPG', 'small': 'https://cdn.intra.42.fr/users/54c3150e5b52ef6bf9212d37fdc87313/small_rbouissa.JPG',
# #pool_month,pool_year,Wallet: 145,created_at,updated_at,correction_point