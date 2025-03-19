#!/bin/bash

# Kill processes using ports 3001, 3004, 5001
echo "Killing processes on ports 3001, 3004, and 5001..."

# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No process on port 3001"

# Find and kill process on port 3004
lsof -ti:3004 | xargs kill -9 2>/dev/null || echo "No process on port 3004"

# Find and kill process on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || echo "No process on port 5001"

echo "Done!" 