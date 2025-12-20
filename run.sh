#!/bin/bash
set -e

echo "Starting Card Editor..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed."
    exit 1
fi

# Build Frontend
echo "Building Frontend..."
if command -v npm &> /dev/null; then
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "Warning: npm not found. Skipping frontend build."
fi

# Install Dependencies
echo "Installing dependencies..."
if [ -f "poetry.lock" ] && command -v poetry &> /dev/null; then
    echo "Using Poetry..."
    poetry install
else
    echo "Using pip..."
    pip install django pymongo dnspython
fi

# Migrations
echo "Applying migrations..."
python3 manage.py migrate

# Init Data
echo "Initializing default session..."
# We ignore error here in case Mongo is not ready yet, but it's better to fail fast if critical.
# However, init_data might fail if data exists (the command handles it gracefully).
python3 manage.py init_data

# Start Server
echo "Starting Django server..."
echo "Open http://127.0.0.1:8000 in your browser."
python3 manage.py runserver
