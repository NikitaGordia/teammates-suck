#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# Set ownership of the volume mount point (/app/data) to appuser
# Use -R to ensure subdirectories/files created later might also inherit correctly,
# though file system specifics can vary. Primarily fixes the top-level directory.
echo "Fixing permissions for /app/data..."
chown -R appuser:appuser /app/data

# Execute the command provided as arguments (CMD from Dockerfile or docker run)
# Use 'gosu' to drop privileges from root to 'appuser' before executing the command
echo "Executing command as appuser: $@"
exec gosu appuser "$@"