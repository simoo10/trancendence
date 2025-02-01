from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
import jwt
import datetime
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
import jwt
import datetime
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import time
from django.http import JsonResponse
from rest_framework.views import APIView
import uuid
from django.http import HttpResponseRedirect
import requests
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework.views import APIView
import requests
from django.http import JsonResponse
from rest_framework.views import APIView
from .models import Intra42User
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Intra42User  # Import your custom user model
from .serializers import LoginSerializer
from django.contrib.auth.hashers import make_password  # For password hashing\
from .models import Intra42User  # Import your custom user model
from rest_framework.permissions import AllowAny
from .serializers import Intra42UserSerializer  # Import the serializer
from rest_framework import status


class SampleAPI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        data = {'message': 'Hello from Django backend'}
        return Response(data, status=status.HTTP_200_OK)
    def post(self,request):
        data = {'message': 'Hello from Django backend'}
        return Response(data, status=status.HTTP_200_OK)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import Intra42UserSerializer

class Signup(APIView):
    permission_classes = [AllowAny]  # Allow anyone to access this endpoint

    def post(self, request):
        # Get the data from the frontend request
        data = request.data

        # Initialize the serializer with the incoming data
        serializer = Intra42UserSerializer(data=data)

        # Check if the data is valid
        if serializer.is_valid():
            # Save the new user and return success message
            user = serializer.save()
            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)

        # If data is invalid, return the error details
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)




class Login(APIView):
    permission_classes = [AllowAny]  # Allow anyone to access this endpoint

    print ("Login APIView reached")  # Debug

    def post(self, request):
        # Deserialize the incoming data using the LoginSerializer
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():  # Check if data is valid
            login = serializer.validated_data['login']
            password = serializer.validated_data['password']

            print ("1-login: ", login, "password:", password)  # Debug

            # Authenticate the user
            user = authenticate(request, login=login, password=password)

            print ("user: ", user) # Debug
            if user is not None:
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                response = JsonResponse({
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'message': 'Login successful',
                }, status=status.HTTP_200_OK)
                set_secure_cookie(response, {'access': str(refresh.access_token), 'refresh': refresh})
                print ("logging in: ",response)  # Debug
                return response
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
      

class loginwith42(APIView):
    permission_classes = [AllowAny]
    """
    Generates the Intra42 OAuth URL and sends it to the frontend.
    """
    def get(self, request):
        # Step 1: Retrieve Client ID from settings
        client_id = settings.OAUTH_42_CLIENT_ID

        # Step 2: Define the Redirect URI
        redirect_uri = "http://localhost:8080/dashboard"

        # Step 3: Generate a random state string
        state = str(uuid.uuid4())  # Unique identifier for CSRF protection
        request.session['oauth_state'] = state  # Save state in the session for later validation

        # Step 4: Construct the Intra42 Authorization URL
        auth_url = (
            f"https://api.intra.42.fr/oauth/authorize?"
            f"client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
            f"&scope=public"
            f"&state={state}"
        )
        print("\n\n\n", auth_url, '\n\n\n')
        # Step 5: Return the URL as a JSON response
        return JsonResponse({"url": auth_url})
    



def fetch_intra42_user_info(access_token):
    url = "https://api.intra.42.fr/v2/me"
    headers = {
        "Authorization": f"Bearer {access_token}",
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()  # User profile data
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None




class Intra42Callback(APIView):
    permission_classes = [AllowAny] 
    print('vvvvvvvvvvvvvvvvvvvvvv\n\n\n\n\n')
    def get(self, request):
        print("Debug: Callback handler reached.")
        code = request.GET.get('code')
        try:
            # Exchange the code for tokens
            token_url = "https://api.intra.42.fr/oauth/token"
            token_data = {
                "grant_type": "authorization_code",
                "client_id": settings.OAUTH_42_CLIENT_ID,
                "client_secret": settings.OAUTH_42_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.OAUTH_42_REDIRECT_URI,
            }
            token_response = requests.post(token_url, data=token_data)
            token_response.raise_for_status()
            tokens = token_response.json()

            # Fetch user info using access token
            access_token = tokens['access_token']
            user_info_url = "https://api.intra.42.fr/v2/me"
            user_info_headers = {
                "Authorization": f"Bearer {access_token}",
            } 
            user_info_response = requests.get(user_info_url, headers=user_info_headers)
            user_info_response.raise_for_status()
            user_data = user_info_response.json()


            user = Intra42User.objects.filter(intra_id=user_data['id']).first()
            if user:
                refresh = RefreshToken.for_user(user)
            else:
                user = Intra42User(intra_id=user_data['id'], login=user_data['login'],first_name=user_data['first_name'],last_name=user_data['last_name'],email=user_data['email'],image=user_data['image'])#picture=picture
                user.save()
                refresh = RefreshToken.for_user(user)
            print("User saved:", refresh.access_token)
            print("User saved:", str(refresh))
            responsee = JsonResponse({
            'message': 'Data received successfully',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'url' : "http://localhost:8080/dashboard"
            })

            set_secure_cookie(responsee, {'access': str(refresh.access_token), 'refresh': refresh})
            print('\n\n\n', responsee, '\n\n\n')
            return responsee
        except requests.RequestException as err:
            return JsonResponse({"error": str(err)}, status=500)

def set_secure_cookie(response, param):
    response.set_cookie(
        'access_token',
        str(param['access']),
        secure=True,
        samesite='None'
    )
    response.set_cookie(
        'refresh_token',
        str(param['refresh']),
        httponly=True,
        secure=True,
        samesite='None'
    )
    return response

def print_access_token_lifetime():
    access_token_lifetime = settings.SIMPLE_JWT.get("ACCESS_TOKEN_LIFETIME")
    if access_token_lifetime:
        print(f"Access Token Lifetime: {access_token_lifetime.total_seconds()} seconds")
    else:
        print("Access Token Lifetime is not set.")

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import OutstandingToken, BlacklistedToken
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Blacklist all tokens for the user
            tokens = OutstandingToken.objects.filter(user=request.user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
            
            # Clear cookies (if set by the server)
            response = Response({"message": "Logged out successfully"})
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class data_user(APIView):
    print ("data_user APIView reached")  # Debug
    permission_classes = [IsAuthenticated]
    print("i'm here\n\n\n\m")
    def get(self, request):
        user = request.user  # This will be the authenticated Intra42User
        print("2-user: ", user)
        user_data = {
            "login": user.login,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "image": user.image,
        }
        return Response(user_data)


#this for logout views

# class logoutV(CreateAPIView):
#     serializer_class = logoutS

#     def post(self, request):
#         logout(request)
#         response = JsonResponse({'message': 'User logged out successfully'}, status=status.HTTP_200_OK)
#         response.delete_cookie('refresh_token', samesite='None')
#         response.delete_cookie('access_token', samesite='None')
#         return response

# from rest_framework.generics import DestroyAPIView

# class delete_cookies(DestroyAPIView):
#     def destroy(self, request, *args, **kwargs):
#         try:
#             response = JsonResponse({'message': 'Cookies deleted successfully'}, status=200)
#             response.delete_cookie('refresh_token', samesite='None')
#             response.delete_cookie('access_token', samesite='None')
#         except Exception as e:
#             return Response({'error': str(e)}, status=400)
#         return response
# from django.contrib.auth import logout

# class logoutS(serializers.ModelSerializer):
#     class Meta:
#         model = user_pro
#         fields = []