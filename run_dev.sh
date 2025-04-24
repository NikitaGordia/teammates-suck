#!/bin/bash

# Stop any running containers
echo "Stopping any running containers..."
docker-compose -f docker-compose.dev.yml down

# Remove any existing images to ensure a clean build
echo "Removing existing development images..."
docker rmi -f team-balancer-frontend-dev team-balancer-backend-dev 2>/dev/null || true

# Build and start the containers
echo "Building and starting containers..."
docker-compose -f docker-compose.dev.yml up --build

# This script will keep running until you press Ctrl+C
# When you do, it will automatically stop the containers
