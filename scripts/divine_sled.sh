#!/bin/bash

echo "🛡️ Initializing development environment..."

# Clear space
clear

# Verify environment
echo "🕊️ Verifying environment state..."
tsc --noEmit
npm outdated
rm -rf dist build .cache

# Prepare terminals
echo "🦅 Setting up monitoring..."
tmux new-session -d 'npm run dev | tee logs/dev.log'
tmux split-window -h 'tsc --watch --preserveWatchOutput'
tmux split-window -v 'npm run build:watch'

# Create recovery point
echo "🌿 Creating recovery checkpoint..."
git checkout -b recovery/$(date +%Y%m%d_%H%M)

echo "⚡ Development environment ready" 