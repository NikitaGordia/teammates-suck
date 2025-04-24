#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Source environment variables (needs REGISTRY_URL)
if [ ! -f ".env" ]; then
  echo "Error: .env file not found. It should contain REGISTRY_URL."
  exit 1
fi
set -a
source ".env"
set +a
if [ -z "$REGISTRY_URL" ]; then
  echo "Error: REGISTRY_URL is not set in the .env file."
  exit 1
fi

echo "--- Building and Pushing Multi-Arch Images using Docker Compose ---"
echo "Using Build Tag: ${BUILD_TAG}"
echo "Using Registry: ${REGISTRY_URL}"
echo "Platforms specified in docker-compose.yml will be used."
echo ""
echo "INFO: Ensure Docker Engine with BuildKit and Docker Compose v2.x are used."
echo "INFO: Ensure you are logged into the registry: ${REGISTRY_URL}"
echo "      Run 'docker login ${REGISTRY_URL}' (or relevant login command) if needed."
echo "-------------------------------------------------"

# Build the images for the platforms specified in docker-compose.yml
# The --push flag builds AND pushes the multi-arch images correctly
echo "Building and pushing images via Docker Compose..."
docker compose -f docker-compose.yml build --push
# Alternatively, build first then push:
# echo "Building images via Docker Compose..."
# docker compose -f docker-compose.yml build
# echo "Pushing images via Docker Compose..."
# docker compose -f docker-compose.yml push


# 'set -e' ensures script exits if compose fails
echo "-------------------------------------------------"
echo "Docker Compose build and push completed!"
echo "Images should be available in ${REGISTRY_URL} with tag ${BUILD_TAG} for the specified platforms."
echo "-------------------------------------------------"

exit 0