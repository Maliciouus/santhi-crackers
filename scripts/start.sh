#!/bin/bash
set -e

echo "======== [Install] Setting up environment ========"

# Update packages
sudo yum update -y

# Install Node.js (if not already installed)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# ✅ Install PM2 globally
sudo npm install -g pm2