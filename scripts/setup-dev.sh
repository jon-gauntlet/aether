#!/bin/bash

# Check for Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI required"
    echo "Install: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Start Supabase and get credentials
supabase start
SUPABASE_URL=$(supabase status | grep 'API URL' | awk '{print $NF}')
SUPABASE_KEY=$(supabase status | grep 'anon key' | awk '{print $NF}')

# Save config
echo "VITE_SUPABASE_URL=$SUPABASE_URL" > .env
echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY" >> .env

# Reset DB and verify
supabase db reset
node scripts/verify-setup.js 