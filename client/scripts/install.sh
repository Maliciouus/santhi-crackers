#!/bin/bash
echo "Installing dependencies..."
cd /home/ec2-user/app
bun install -g pm2
bun install