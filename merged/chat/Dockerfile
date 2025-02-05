# Backend Dockerfile in ./backend
FROM python:3.10

# Set working directory inside the container
WORKDIR /app

# Copy all files into the container
COPY . /app/
RUN pip install --upgrade pip
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings
# Copy the shell script to /bin and make it executable
COPY script.sh /bin/script.sh
RUN chmod +x /bin/script.sh

# Run script.sh (assuming script.sh starts Django or waits for the database)
ENTRYPOINT ["script.sh"]
