#!/bin/bash
set -e

echo "======== [Start] Serving app.html using Bun + PM2 ========"

cd /var/www/html

pm2 stop all || true
pm2 start src/index.ts --interpreter bun --name app.html
pm2 save