#!/bin/bash
set -e

echo "======== Installing NGINX ========"

sudo yum update -y
sudo amazon-linux-extras enable nginx1
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx