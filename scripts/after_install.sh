#!/bin/bash
set -e

echo "======== [AfterInstall] Set ownership ========"

cd /var/www/html

# Set correct permissions
sudo chown -R ec2-user:ec2-user /var/www/html