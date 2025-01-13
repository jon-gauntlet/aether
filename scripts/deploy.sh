#!/bin/bash

# Fast deployment script with protection
set -e

# Load environment variables
source .env.production

# Validate environment
if [ -z "$VITE_FIREBASE_API_KEY" ] || [ -z "$VITE_FIREBASE_PROJECT_ID" ] || [ -z "$VITE_FIREBASE_APP_ID" ]; then
  echo "❌ Missing required Firebase environment variables"
  exit 1
fi

# Build with protection
echo "🛡️ Building with protection..."
VITE_APP_ENV=production npm run build

# Deploy to Vercel using existing project config
echo "🚀 Deploying to Vercel..."
vercel deploy --prod --yes

echo "✅ Deployment complete" 