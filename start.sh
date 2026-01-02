#!/bin/bash
# Startup script for Clipping App
# This script starts the application and keeps it running

cd "$(dirname "$0")"

echo "🚀 Starting Clipping App..."
echo "📅 Scheduler configured for:"
echo "   - Scraper: 07:00 AM (Mon-Fri)"
echo "   - Email:   07:55 AM (Mon-Fri)"
echo ""

# Check if already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Application already running on port 3000"
    echo "To stop it: kill \$(lsof -Pi :3000 -sTCP:LISTEN -t)"
    exit 1
fi

# Start the application
echo "Starting server..."
node index.js

# If the script reaches here, the app crashed
echo "❌ Application stopped unexpectedly"
