#!/bin/bash

# sleep 5

# cd backend
# echo "herrrrrrrrrrrrrrr\n"


python3.10 manage.py createsuperuser --username=reda --password=123


python3.10 manage.py makemigrations
python3.10 manage.py migrate
python3.10 manage.py collectstatic --noinput

# Trap SIGTERM and SIGINT and call the on_exit function

# python3.11 manage.py collectstatic
# python3.10 manage.py runserver 0.0.0.0:8000
daphne -b 0.0.0.0 -p 8001 backend.asgi:application
# exec python manage.py runserver 0.0.0.0:800