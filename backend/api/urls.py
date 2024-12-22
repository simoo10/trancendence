from django.urls import path
#from .views import SampleAPI
from .views import (
    Signup,
    Login,
    loginwith42,
    Intra42Callback,
    # intra42_login,
)
urlpatterns = [
    # path('sample/', SampleAPI.as_view(), name='sample_api'),
    path('signup/', Signup.as_view(), name='signup'),
    path('login/',Login.as_view(),name='login'),
    path('login_with_42/',loginwith42.as_view(),name='login_with_42'),
    path('intra42callback/',Intra42Callback.as_view(),name='Intra42Callback'),
    # path('auth_42_callback/', intra42_login.as_view(), name='intra42_login'),
]