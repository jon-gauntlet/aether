#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting Supabase verification process..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Installing Supabase CLI..."
    # Clean up any existing files or directories
    rm -rf supabase
    curl -s -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
    sudo mv supabase /usr/local/bin/supabase
else
    echo "Supabase CLI already installed"
fi

# Initialize Supabase project if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    supabase init
fi

# Start local Supabase instance
echo "Starting local Supabase instance..."
supabase start

# Apply database migrations
echo "Applying database migrations..."
supabase db reset

# Verify database schema
echo "Verifying database schema..."
supabase db lint

# Create storage bucket
echo "Creating storage bucket..."
supabase db psql -c "
INSERT INTO storage.buckets (id, name) 
VALUES ('documents', 'Document Storage')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY \"Documents are publicly accessible\"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );"

# Generate types
echo "Generating TypeScript types..."
supabase gen types typescript --local > frontend/src/types/supabase.ts

# Run database tests
echo "Running database tests..."
supabase test db

# Verify storage
echo "Verifying storage..."
curl -X POST -F "file=@README.md" http://localhost:54321/storage/v1/object/documents/test.md
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Storage verification successful${NC}"
    # Cleanup test file
    curl -X DELETE http://localhost:54321/storage/v1/object/documents/test.md
else
    echo -e "${RED}Storage verification failed${NC}"
    exit 1
fi

# Update environment variables
echo "Updating environment variables..."
SUPABASE_URL=$(supabase status --output json | jq -r '.api.url')
SUPABASE_ANON_KEY=$(supabase status --output json | jq -r '.api.anon_key')

cat > frontend/.env.local << EOL
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
EOL

echo -e "${GREEN}Supabase verification complete!${NC}" 