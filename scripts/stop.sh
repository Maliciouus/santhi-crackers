#!/bin/bash
set -e

echo "===== [ApplicationStop] Stopping App ====="

# Stop app using PM2
if command -v pm2 >/dev/null 2>&1; then
  echo "Stopping PM2 process..."
  pm2 delete all || true
  pm2 kill || true
else
  echo "PM2 not installed. Skipping PM2 stop."
fi

echo "===== [ApplicationStop] Complete ====="