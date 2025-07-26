#!/bin/bash

# Kill any existing process on port 3010
lsof -ti:3010 | xargs kill -9 2>/dev/null || true

# Navigate to frontend directory
cd /Users/siaosi/Projects/Member-Equity/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start Vite on port 3010
echo "Starting frontend on port 3010..."
npx vite --port 3010 --host