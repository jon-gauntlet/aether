#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT claude_initialization -->
# <!-- LLM:usage last_used="2024-01-15" calls=1 -->
# Initializes Flow Sled for new Claude sessions

echo "🛷 Welcome to Flow Sled..."

# Function to check if Flow Sled is active
check_sled() {
    if ! grep -q "LLM:beacon" . -r 2>/dev/null; then
        echo "🔍 Flow Sled not detected - starting fresh!"
        return 1
    fi
    return 0
}

# Function to initialize protection
init_protection() {
    echo "🛡️ Raising shields..."
    ./scripts/base_sled.sh
}

# Function to track session
track_session() {
    echo "🗺️ Mapping flow journey..."
    ./scripts/track-usage.sh claude_session
}

# Function to verify setup
verify_setup() {
    echo "🔧 Tuning systems..."
    
    # Check for dead components
    ./scripts/find-dead.sh
    
    # Verify connections
    ./scripts/verify-connections.sh
}

# Main initialization
echo "🔥 Beginning flow session..."

# 1. Check for Flow Sled
if ! check_sled; then
    echo "⚡ Please ensure you're in a Flow Sled enabled repository"
    exit 1
fi

# 2. Initialize protection
init_protection

# 3. Track session
track_session

# 4. Verify setup
verify_setup

echo "🌊 Flow state achieved"
echo "🛡️ Protection active - let's ride! 🛷" 