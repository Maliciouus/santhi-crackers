#!/bin/bash
set -e

echo "======== [BeforeInstall] ========"

# Clean old deployment
sudo rm -rf /var/www/html/*

# Recreate folder and fix permissions
sudo mkdir -p /var/www/html
sudo chown ec2-user:ec2-user /var/www/html
sudo chmod -R 755 /var/www/html