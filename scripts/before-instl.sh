#!/bin/bash
set -e

echo "======== [BeforeInstall] ========"
sudo systemctl stop nginx || true
rm -rf /var/www/html/build || true
mkdir -p /var/www/html
chown ec2-user:ec2-user /var/www/html
chmod -R 755 /var/www/html