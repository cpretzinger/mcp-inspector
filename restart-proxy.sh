#!/bin/bash

# Kill any existing inspector proxy processes
echo "Stopping any existing inspector proxy processes..."
pkill -f "node inspector-proxy.js" || true

# Wait a moment for processes to terminate
sleep 1

# Start the inspector proxy
echo "Starting inspector proxy on port 6277..."
node inspector-proxy.js