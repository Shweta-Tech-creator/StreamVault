#!/bin/bash

# StreamVault AWS EC2 Deployment Script

echo "Updating package repository..."
sudo dnf update -y || sudo apt-get update -y

echo "Installing Git..."
sudo dnf install git -y || sudo apt-get install git -y

echo "Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install nodejs -y || sudo apt-get install nodejs -y

echo "Installing PM2 Globally..."
sudo npm install -g pm2

echo "Installing Node.js dependencies..."
npm install --production

echo "Checking for .env file..."
if [ ! -f .env ]; then
  echo "⚠️  WARNING: .env file is missing! Please create it before starting."
  cp .env.example .env
  echo "Created default .env from template. Configure it with your Amazon RDS details."
fi

echo "Starting StreamVault Server using PM2..."
pm2 restart streamvault || pm2 start server.js --name "streamvault"
pm2 save

echo "Setting up Port 80 redirection to 3000..."
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000

echo "Deployment Completed Successfully!"