#!/bin/bash

echo "🚀 Starting Voice Scam Shield Frontend..."

# Navigate to frontend directory
cd voice-scam-detector-frontend

# Check if Python is available for simple HTTP server
if command -v python3 &> /dev/null; then
    echo "🌐 Starting frontend on http://localhost:8080"
    echo "📱 Open this URL in your browser to use the webapp"
    echo ""
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "🌐 Starting frontend on http://localhost:8080"
    echo "📱 Open this URL in your browser to use the webapp"
    echo ""
    python -m http.server 8080
else
    echo "❌ Python not found. Please install Python or use another web server."
    echo "Alternative: Use 'npx serve .' if you have Node.js installed"
    exit 1
fi