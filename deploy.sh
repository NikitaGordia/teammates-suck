#!/bin/bash

# --- Configuration Files ---
LOCAL_COMPOSE_FILE="docker-compose.yml"
LOCAL_ENV_FILE=".env"
# --- End Configuration Files ---

# Check if local .env file exists before trying to source it
if [ ! -f "$LOCAL_ENV_FILE" ]; then
  echo "Error: Environment file '$LOCAL_ENV_FILE' not found locally."
  echo "This file should contain SSH_USER, VPS_ADDRESS, REMOTE_PATH, REGISTRY_URL, and other necessary variables."
  exit 1
fi

# Source the local .env file to get configuration variables
# Use set -a to export all variables read from .env
echo "Reading configuration from ${LOCAL_ENV_FILE}..."
set -a
source "$LOCAL_ENV_FILE"
set +a

# Validate required variables from .env
if [ -z "$SSH_USER" ] || [ -z "$VPS_ADDRESS" ] || [ -z "$REMOTE_PATH" ] || [ -z "$REGISTRY_URL" ]; then
  echo "Error: One or more required variables (SSH_USER, VPS_ADDRESS, REMOTE_PATH, REGISTRY_URL) are not defined in '$LOCAL_ENV_FILE'."
  exit 1
fi

# --- Deployment Start ---
echo "--- Starting Deployment ---"
echo "Using Build Tag: ${BUILD_TAG}"
echo "Target VPS: ${SSH_USER}@${VPS_ADDRESS}"
echo "Target Directory: ${REMOTE_PATH}"
echo "Registry URL (from .env): ${REGISTRY_URL}"

# Check if local compose file exists
if [ ! -f "$LOCAL_COMPOSE_FILE" ]; then
  echo "Error: Docker compose file '$LOCAL_COMPOSE_FILE' not found locally."
  exit 1
fi

echo "Expected images:"
echo "  - ${REGISTRY_URL}/teammates-suck-backend:${BUILD_TAG}"
echo "  - ${REGISTRY_URL}/teammates-suck-frontend:${BUILD_TAG}"


# Create a temporary .env file for deployment that includes the BUILD_TAG
# This ensures docker-compose on the remote server has access to the variable
# It copies the *original* .env content and adds/updates BUILD_TAG
TEMP_ENV_FILE=".env_deploy_temp"
echo "Creating temporary .env file for deployment..."
cp "$LOCAL_ENV_FILE" "$TEMP_ENV_FILE"
# Add BUILD_TAG if it's not already present or update it
# Use grep -q to check existence, sed to update/add
if grep -q "^BUILD_TAG=" "$TEMP_ENV_FILE"; then
  # Use a different delimiter for sed in case BUILD_TAG contains slashes
  sed -i.bak "s|^BUILD_TAG=.*|BUILD_TAG=${BUILD_TAG}|" "$TEMP_ENV_FILE" # Update existing
else
  echo "" >> "$TEMP_ENV_FILE" # Add newline for separation
  echo "BUILD_TAG=${BUILD_TAG}" >> "$TEMP_ENV_FILE" # Add new
fi
# Clean up backup file created by sed -i on macOS, Linux sed might not create it without suffix
rm -f "${TEMP_ENV_FILE}.bak"

echo "Transferring files to VPS..."

# Create remote directory if it doesn't exist using variables from .env
ssh "${SSH_USER}@${VPS_ADDRESS}" "mkdir -p ${REMOTE_PATH}"
if [ $? -ne 0 ]; then
  echo "Error: Failed to create remote directory ${REMOTE_PATH} via SSH."
  rm "$TEMP_ENV_FILE" # Clean up temp file
  exit 1
fi

# Securely copy the compose file and the temporary .env file (renaming it to .env on remote)
scp "$LOCAL_COMPOSE_FILE" "${SSH_USER}@${VPS_ADDRESS}:${REMOTE_PATH}/docker-compose.yml"
if [ $? -ne 0 ]; then
  echo "Error: Failed to copy ${LOCAL_COMPOSE_FILE} to VPS."
  rm "$TEMP_ENV_FILE" # Clean up temp file
  exit 1
fi

scp "$TEMP_ENV_FILE" "${SSH_USER}@${VPS_ADDRESS}:${REMOTE_PATH}/.env"
if [ $? -ne 0 ]; then
  echo "Error: Failed to copy temporary .env file to VPS."
  rm "$TEMP_ENV_FILE" # Clean up temp file
  exit 1
fi

# Clean up the local temporary .env file
echo "Cleaning up temporary local file..."
rm "$TEMP_ENV_FILE"

echo "Executing commands on VPS..."

# Connect via SSH and run the deployment commands
# REMOTE_PATH variable is now available inside the heredoc because it was exported via 'set -a'
ssh "${SSH_USER}@${VPS_ADDRESS}" << EOF
  echo "Changing directory to ${REMOTE_PATH}..."
  cd "${REMOTE_PATH}" || exit 1 # Exit if cd fails

  echo "Checking required variables in remote .env..."
  # Temporarily source .env again on remote to check essential vars for compose
  source .env
  if [ -z "\$REGISTRY_URL" ] || [ -z "\$BUILD_TAG" ]; then
      echo "Error: REGISTRY_URL or BUILD_TAG missing in the .env file on the VPS."
      exit 1
  fi
  echo "Remote .env check: REGISTRY_URL=\${REGISTRY_URL}, BUILD_TAG=\${BUILD_TAG}" # Show variables loaded on remote

  echo "Attempting to log in to Docker registry (if needed)..."
  # Basic check - full automation might require credential helpers or manual login
  if ! docker info 2>/dev/null | grep -q "Username:"; then
     # Note: REGISTRY_URL is available here because we sourced .env above
     echo "WARNING: Not logged into Docker registry \${REGISTRY_URL}. Pulling images might fail if they are private."
     echo "Consider running 'docker login \${REGISTRY_URL}' on the VPS manually if pulls fail."
  fi

  echo "Pulling the latest images with tag ${BUILD_TAG}..."
  # docker-compose will read the .env file in the current directory (${REMOTE_PATH})
  # for REGISTRY_URL, BUILD_TAG, and service environment variables
  if ! docker compose pull; then
    echo "Error pulling Docker images. Check registry access (\${REGISTRY_URL}), image tags, and VPS network."
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

EOF # End of SSH commands heredoc

# Check the exit status of the SSH command block
if [ $? -ne 0 ]; then
  echo "Error: SSH command execution failed on the VPS."
  exit 1
fi

# Use VPS_ADDRESS from .env in the final success message
echo "--- Deployment Successful ---"
echo "Application deployed to ${SSH_USER}@${VPS_ADDRESS}:${REMOTE_PATH}"
echo "Services should be running with tag ${BUILD_TAG}."
echo "Frontend might be accessible at http://${VPS_ADDRESS}"
echo "Backend might be accessible at http://${VPS_ADDRESS}:5050 (if firewall allows)"

exit 0