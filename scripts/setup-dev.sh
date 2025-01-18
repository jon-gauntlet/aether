#!/bin/bash

# Start Supabase
echo "Starting Supabase..."
supabase start

# Get Supabase credentials
echo "Fetching credentials..."
SUPABASE_URL=$(supabase status | grep 'API URL' | awk '{print $NF}')
SUPABASE_KEY=$(supabase status | grep 'anon key' | awk '{print $NF}')

# Update .env
echo "Updating .env..."
echo "VITE_SUPABASE_URL=$SUPABASE_URL" > .env
echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY" >> .env

# Reset database
echo "Resetting database..."
supabase db reset

# Verify setup
echo "Verifying setup..."
npm run verify

echo "Setup complete! Run 'npm run dev' to start development server" 