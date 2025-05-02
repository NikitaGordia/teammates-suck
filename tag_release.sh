#!/bin/bash

# Script to create a Git tag based on BUILD_TAG from .env file

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Extract BUILD_TAG from .env file
BUILD_TAG=$(grep "BUILD_TAG=" .env | cut -d '=' -f2)

# Check if BUILD_TAG was found
if [ -z "$BUILD_TAG" ]; then
    echo "Error: BUILD_TAG not found in .env file"
    exit 1
fi

echo "Found BUILD_TAG: $BUILD_TAG"

# Check if tag already exists
if git rev-parse "$BUILD_TAG" >/dev/null 2>&1; then
    echo "Warning: Tag $BUILD_TAG already exists"
    
    # Ask user if they want to force update the tag
    read -p "Do you want to force update the tag? (y/n): " choice
    if [ "$choice" != "y" ]; then
        echo "Operation cancelled"
        exit 0
    fi
    
    # Force update the tag
    echo "Force updating tag $BUILD_TAG"
    git tag -d "$BUILD_TAG"
fi

# Create the tag
echo "Creating Git tag: $BUILD_TAG"
git tag "$BUILD_TAG"

echo "Tag $BUILD_TAG created successfully"

# Uncomment the following line to push the tag to the remote repository
# echo "Pushing tag to remote repository..."
# git push origin "$BUILD_TAG"

echo "Done!"
