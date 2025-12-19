#!/bin/bash
set -e

echo "Logging into Docker..."
echo "dckr_pat_QdBDB82Cy_p0Ci_VzZhmidEe2_Q" | docker login -u lotargo --password-stdin

echo "Starting MongoDB..."
docker pull mongo:latest

# Check if container is running
if [ ! "$(docker ps -q -f name=mongodb)" ]; then
    if [ "$(docker ps -aq -f name=mongodb)" ]; then
        echo "Removing stopped mongodb container..."
        docker rm mongodb
    fi
    echo "Running mongodb container..."
    docker run -d --name mongodb -p 27017:27017 mongo:latest
else
    echo "MongoDB is already running."
fi

echo "Installing dependencies..."
if command -v poetry &> /dev/null; then
    poetry install
else
    echo "Poetry not found. Please install poetry."
    exit 1
fi

echo "Infrastructure setup complete."
