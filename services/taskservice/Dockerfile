FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose Django port
EXPOSE 8002

# Run Django development server
CMD ["sh", "-c", "python manage.py makemigrations && python manage.py migrate && python manage.py init_collections && python manage.py runserver 0.0.0.0:8002"]

