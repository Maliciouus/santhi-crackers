#!/bin/bash
echo "Starting application..."
cd /home/ec2-user/app
pm2 stop all || true
pm2 start index.js --name SANTHI-CRACKERS