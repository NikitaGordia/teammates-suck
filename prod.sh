#!/bin/bash

# Stop any running containers
echo "Stopping any running containers..."
docker-compose -f docker-compose.prod.yml down

# Remove any existing images to ensure a clean build
echo "Removing existing production images..."
docker rmi -f team-balancer-frontend-prod team-balancer-backend-prod 2>/dev/null || true

# Build and start the containers in detached mode
echo "Building and starting production containers..."
docker-compose -f docker-compose.prod.yml up --build -d

echo "Production deployment complete!"
echo "Frontend is available at: http://localhost"
echo "Backend is available at: http://localhost:5050"
