#!/bin/bash

echo "🌿 Initiating system recovery..."

# Save current work
git add .
git stash

# Return to last known good state
git checkout $(git rev-list -n 1 HEAD -- $(git ls-files -m))

# Clean and restore
npm run clean
npm install

echo "✨ System state restored" 