#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting complete verification process..."

# Make scripts executable
chmod +x scripts/verify-supabase.sh
chmod +x scripts/verify-tests.sh

# Run Supabase verification
echo "Running Supabase verification..."
./scripts/verify-supabase.sh

# Run test verification
echo "Running test verification..."
./scripts/verify-tests.sh

# Run linting
echo "Running linting..."
cd frontend && npm run lint

# Run build
echo "Running build..."
npm run build

# Run E2E tests if they exist
if [ -f "cypress.config.js" ]; then
    echo "Running E2E tests..."
    npm run test:e2e
fi

# Check environment variables
echo "Checking environment variables..."
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${RED}Missing environment variables${NC}"
    exit 1
fi

# Verify database connection
echo "Verifying database connection..."
curl http://localhost:54321/rest/v1/health-check

echo -e "${GREEN}All verifications completed successfully!${NC}"

# Print next steps
echo "
Next steps:
1. Check the frontend at: http://localhost:5173
2. Access Supabase Studio at: http://localhost:54323
3. API is available at: http://localhost:54321
" 