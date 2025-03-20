#!/bin/bash

# EternalFile Deployment Script
# This script builds and deploys the EternalFile application

set -e  # Exit on any error

# Print colored messages
function print_message() {
  echo -e "\033[1;36m>> $1\033[0m"
}

function print_error() {
  echo -e "\033[1;31m>> ERROR: $1\033[0m"
}

function print_success() {
  echo -e "\033[1;32m>> SUCCESS: $1\033[0m"
}

# Check required tools
print_message "Checking required tools..."
if ! command -v docker >/dev/null 2>&1; then
  print_error "Docker is not installed. Please install Docker first."
  exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
  print_error "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Check if .env.production files exist for both client and server
if [ ! -f "./client/.env.production" ]; then
  print_error "Client .env.production file is missing. Please create it from the example file."
  exit 1
fi

if [ ! -f "./server/.env.production" ]; then
  print_error "Server .env.production file is missing. Please create it from the example file."
  exit 1
fi

# Stop and remove existing containers
print_message "Stopping existing containers..."
docker-compose down || true

# Build the containers
print_message "Building Docker containers..."
docker-compose build

# Start the application
print_message "Starting the application..."
docker-compose up -d

# Check if containers are running
print_message "Checking container status..."
sleep 5  # Give containers some time to start up

if docker-compose ps | grep -q "Up"; then
  print_success "Application started successfully!"
  print_message "You can access the application at: http://localhost:3004"
  print_message "Server API is available at: http://localhost:5001/api"
else
  print_error "Failed to start containers. Please check logs using 'docker-compose logs'."
  exit 1
fi

# Print logs for debugging
print_message "Showing recent logs:"
docker-compose logs --tail=20

print_message "Deployment completed!"
print_message "To view logs in real-time, run: docker-compose logs -f"
print_message "To stop the application, run: docker-compose down" 