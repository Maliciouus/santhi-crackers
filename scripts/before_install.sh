#!/bin/bash
set -e

echo "======== [BeforeInstall] ========"

sudo systemctl stop nginx || true

sudo rm -rf /var/www/html/ || true

sudo mkdir -p /var/www/html
sudo chown ec2-user:ec2-user /var/www/html
sudo chmod -R 755 /var/www/html