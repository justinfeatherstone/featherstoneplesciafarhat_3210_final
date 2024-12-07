#!/bin/bash

echo "Starting Git LFS setup script..."

# Check if script is run with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "Please run this script with sudo privileges"
    exit 1
fi

# Function to check if a command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo "✓ $1 completed successfully"
    else
        echo "✗ Error during $1"
        exit 1
    fi
}

# Update package lists
echo "Updating package lists..."
apt-get update
check_status "Package list update"

# Install curl if not present
echo "Installing curl..."
apt-get install -y curl
check_status "Curl installation"

# Add Git LFS repository
echo "Adding Git LFS repository..."
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash
check_status "Adding Git LFS repository"

# Install Git LFS
echo "Installing Git LFS..."
apt-get install -y git-lfs
check_status "Git LFS installation"

# Initialize Git LFS
echo "Initializing Git LFS..."
# Switch to the user who ran sudo
REAL_USER=$(who am i | awk '{print $1}')
su - $REAL_USER -c "cd $(pwd) && git lfs install"
check_status "Git LFS initialization"

# Pull LFS files
echo "Pulling LFS files..."
su - $REAL_USER -c "cd $(pwd) && git lfs pull"
check_status "Git LFS pull"

echo "✅ Git LFS setup completed successfully!"
echo "You can now use Git LFS in your repository." 