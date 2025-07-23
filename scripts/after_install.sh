#!/bin/bash
set -e

echo "======== Installing PM2 ========"

sudo yum update -y
sudo amazon-linux-extras enable nginx1
sudo yum install -y Pm2
sudo systemctl start pm2
sudo systemctl enable pm2