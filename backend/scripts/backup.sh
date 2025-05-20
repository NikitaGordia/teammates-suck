#!/bin/bash

# --- Configuration ---
MAIN_BACKUP_DIR="data/backup" # Main directory for all backups

# --- Date and Timestamp Configuration ---
TODAYS_DATE=$(date +"%Y-%m-%d") # Format: YYYY-MM-DD for the folder name
CURRENT_TIME=$(date +"%H%M%S") # Format: HHMMSS for the file name

# --- Dynamic Backup Path Construction ---
# Creates a date-specific subdirectory within the main backup directory
DATE_SPECIFIC_BACKUP_DIR="${MAIN_BACKUP_DIR}/${TODAYS_DATE}"
BACKUP_FILE="${DATE_SPECIFIC_BACKUP_DIR}/db_backup_${CURRENT_TIME}.sqlite"

# --- Main Script ---

# Check if the source database file exists
if [ ! -f "$DB_PATH" ]; then
  echo "Error: Database file '$DB_PATH' not found."
  exit 1
fi

# Create the date-specific backup directory if it doesn't exist
# The -p flag creates parent directories as needed (e.g., MAIN_BACKUP_DIR if it's also new)
mkdir -p "$DATE_SPECIFIC_BACKUP_DIR"
if [ $? -ne 0 ]; then
  echo "Error: Could not create backup directory '$DATE_SPECIFIC_BACKUP_DIR'."
  exit 1
fi

# Create the backup
echo "Backing up '$DB_PATH' to '$BACKUP_FILE'..."
cp "$DB_PATH" "$BACKUP_FILE"

# Check if the backup was successful
if [ $? -eq 0 ]; then
  echo "Backup successful! ✨"
  echo "Backup created at: $BACKUP_FILE"
else
  echo "Error: Backup failed. 😟"
  exit 1
fi

exit 0