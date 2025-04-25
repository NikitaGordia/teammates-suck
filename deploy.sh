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

# Copy the remote deployment script to the VPS
echo "Copying remote deployment script to VPS..."
scp "remote_deploy.sh" "${SSH_USER}@${VPS_ADDRESS}:${REMOTE_PATH}/remote_deploy.sh"
if [ $? -ne 0 ]; then
  echo "Error: Failed to copy remote_deploy.sh to VPS."
  exit 1
fi

# Make the script executable on the remote server
ssh "${SSH_USER}@${VPS_ADDRESS}" "chmod +x ${REMOTE_PATH}/remote_deploy.sh"
if [ $? -ne 0 ]; then
  echo "Error: Failed to make remote_deploy.sh executable on VPS."
  exit 1
fi

# Execute the remote deployment script
echo "Running remote deployment script on VPS..."
ssh "${SSH_USER}@${VPS_ADDRESS}" "${REMOTE_PATH}/remote_deploy.sh ${REMOTE_PATH}"

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