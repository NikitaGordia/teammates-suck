#!/bin/bash

# This script is executed on the remote server to deploy the application
# It should be called from the main deploy.sh script

# The REMOTE_PATH should be passed as an argument or set in the environment
if [ -n "$1" ]; then
  REMOTE_PATH="$1"
else
  # If not passed as argument, try to use from environment
  if [ -z "$REMOTE_PATH" ]; then
    echo "Error: REMOTE_PATH not provided as argument or environment variable."
    exit 1
  fi
fi

echo "Changing directory to ${REMOTE_PATH}..."
cd "${REMOTE_PATH}" || exit 1 # Exit if cd fails

echo "Checking required variables in remote .env..."
# Temporarily source .env again on remote to check essential vars for compose
source .env
if [ -z "$REGISTRY_URL" ] || [ -z "$BUILD_TAG" ]; then
    echo "Error: REGISTRY_URL or BUILD_TAG missing in the .env file on the VPS."
    exit 1
fi
echo "Remote .env check: REGISTRY_URL=${REGISTRY_URL}, BUILD_TAG=${BUILD_TAG}" # Show variables loaded on remote

echo "Attempting to log in to Docker registry (if needed)..."
# Basic check - full automation might require credential helpers or manual login
if ! docker info 2>/dev/null | grep -q "Username:"; then
   # Note: REGISTRY_URL is available here because we sourced .env above
   echo "WARNING: Not logged into Docker registry ${REGISTRY_URL}. Pulling images might fail if they are private."
   echo "Consider running 'docker login ${REGISTRY_URL}' on the VPS manually if pulls fail."
fi

echo "Pulling the latest images with tag ${BUILD_TAG}..."
# docker-compose will read the .env file in the current directory (${REMOTE_PATH})
# for REGISTRY_URL, BUILD_TAG, and service environment variables
if ! docker compose pull; then
  echo "Error pulling Docker images. Check registry access (${REGISTRY_URL}), image tags, and VPS network."
  exit 1
fi

echo "Stopping and removing existing containers (if any)..."
docker compose down

echo "Starting new containers in detached mode..."
if ! docker compose up -d; then
  echo "Error starting Docker containers with docker compose."
  # You might want to check logs here, e.g., docker compose logs
  exit 1
fi

echo "Deployment steps on VPS completed successfully."

# Optional: Clean up unused Docker resources
echo "Cleaning up unused Docker resources..."
docker system prune -af
d