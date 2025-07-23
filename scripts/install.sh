#!/bin/bash
set -e

echo "======== [AfterInstall] Starting ========"

# Restart NGINX after deployment
echo "Starting NGINX..."
sudo systemctl start nginx

echo "======== [AfterInstall] Done ========"
