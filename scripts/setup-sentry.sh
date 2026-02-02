#!/bin/bash

# Sentry Quick Setup Script
# This script helps you set up Sentry error tracking for Titan Fleet

set -e

echo "🚀 Titan Fleet - Sentry Setup"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

echo "📋 Step 1: Create Sentry Account"
echo "--------------------------------"
echo "1. Go to https://sentry.io/signup/"
echo "2. Sign up for a free account (10,000 errors/month)"
echo "3. Create an organization (e.g., 'Titan Fleet')"
echo ""
read -p "Press Enter when you've created your account..."

echo ""
echo "📋 Step 2: Create Backend Project"
echo "--------------------------------"
echo "1. In Sentry dashboard, click 'Create Project'"
echo "2. Select platform: 'Node.js'"
echo "3. Set alert frequency: 'Alert me on every new issue'"
echo "4. Name your project: 'titan-fleet-backend'"
echo "5. Copy the DSN (looks like: https://xxxxx@o123456.ingest.sentry.io/7890123)"
echo ""
read -p "Enter your BACKEND DSN: " BACKEND_DSN

if [ -z "$BACKEND_DSN" ]; then
    echo "❌ Error: Backend DSN cannot be empty"
    exit 1
fi

echo ""
echo "📋 Step 3: Create Frontend Project"
echo "--------------------------------"
echo "1. Click 'Create Project' again"
echo "2. Select platform: 'React'"
echo "3. Set alert frequency: 'Alert me on every new issue'"
echo "4. Name your project: 'titan-fleet-frontend'"
echo "5. Copy the DSN"
echo ""
read -p "Enter your FRONTEND DSN: " FRONTEND_DSN

if [ -z "$FRONTEND_DSN" ]; then
    echo "❌ Error: Frontend DSN cannot be empty"
    exit 1
fi

echo ""
echo "📋 Step 4: Updating Environment Variables"
echo "--------------------------------"

# Check if DSNs already exist in .env
if grep -q "SENTRY_DSN=" .env; then
    # Update existing
    sed -i "s|SENTRY_DSN=.*|SENTRY_DSN=$BACKEND_DSN|" .env
else
    # Add new
    echo "SENTRY_DSN=$BACKEND_DSN" >> .env
fi

if grep -q "VITE_SENTRY_DSN=" .env; then
    # Update existing
    sed -i "s|VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=$FRONTEND_DSN|" .env
else
    # Add new
    echo "VITE_SENTRY_DSN=$FRONTEND_DSN" >> .env
fi

echo "✅ Environment variables updated in .env"
echo ""

echo "📋 Step 5: Testing Sentry Integration"
echo "--------------------------------"
echo "Restarting server to apply changes..."
echo ""

# Kill existing server if running
pkill -f "node.*server" || true
pkill -f "vite" || true

echo "Starting server in background..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

echo ""
echo "Testing backend error tracking..."
curl -s http://localhost:3000/api/test-sentry || echo "Backend endpoint not available yet"

echo ""
echo "Testing frontend error tracking..."
echo "Open http://localhost:3000 in your browser and check the console"

echo ""
echo "✅ Sentry Setup Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Check your Sentry dashboard at https://sentry.io"
echo "2. Verify you see test errors in both projects"
echo "3. Configure alert rules in Sentry settings"
echo "4. Set up integrations (Slack, email, etc.)"
echo ""
echo "📊 View your projects:"
echo "   Backend:  https://sentry.io/organizations/YOUR-ORG/projects/titan-fleet-backend/"
echo "   Frontend: https://sentry.io/organizations/YOUR-ORG/projects/titan-fleet-frontend/"
echo ""
echo "🔒 Security Note:"
echo "   Never commit .env file to Git!"
echo "   Add .env to .gitignore if not already there"
echo ""

# Ensure .env is in .gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
fi

echo "Done! 🎉"
