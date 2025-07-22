#!/bin/bash
set -e

echo "======== [BeforeInstall] Starting ========"

# Stop NGINX gracefully if running
if systemctl is-active --quiet nginx; then
  echo "Stopping NGINX..."
  sudo systemctl stop nginx
fi

# Clean old frontend files
echo "Cleaning /var/www/html..."
rm -rf /var/www/html/* || true

# Recreate web directory
echo "Creating /var/www/html..."
mkdir -p /var/www/html

# Set ownership and permissions
chown -R ec2-user:ec2-user /var/www/html
chmod -R 755 /var/www/html

echo "======== [BeforeInstall] Done ========"
