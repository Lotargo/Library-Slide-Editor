#!/bin/bash
set -e

# Detect if we need sudo
if [ "$(id -u)" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

echo "Checking Docker environment..."
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    exit 1
fi

if ! $SUDO docker info &> /dev/null; then
    echo "Error: Docker daemon is not running."
    exit 1
fi

echo "Logging into Docker..."
# If login is required for private images, rely on local docker config or pass credentials securely via environment variables.
# e.g., echo "$DOCKER_PAT" | $SUDO docker login -u "$DOCKER_USER" --password-stdin

echo "Starting MongoDB..."
$SUDO docker pull mongo:latest

# Check if container exists
if $SUDO docker container inspect dj_cards_mongo &> /dev/null; then
    echo "Container 'dj_cards_mongo' exists. Checking status..."
    IS_RUNNING=$($SUDO docker container inspect -f '{{.State.Running}}' dj_cards_mongo)

    if [ "$IS_RUNNING" == "true" ]; then
        echo "MongoDB is already running."
    else
        echo "MongoDB is stopped. Starting it..."
        $SUDO docker start dj_cards_mongo
    fi
else
    echo "Container 'dj_cards_mongo' does not exist. Creating new one..."
    $SUDO docker run -d --name dj_cards_mongo -p 27017:27017 mongo:latest
fi

echo "Waiting for MongoDB to accept connections..."
sleep 5

echo "Installing dependencies..."
if command -v poetry &> /dev/null; then
    poetry install
else
    echo "Poetry not found. Please install poetry."
fi

echo "Infrastructure setup complete."
