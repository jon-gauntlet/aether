#!/bin/bash

# <!-- LLM:claude SLED environment setup - Handles multiple repository copies -->
# <!-- LLM:magnetic CORE_ENV_CONFIG -->

# Dynamically determine project paths
export SLED_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SLED_PROJECT_DIR="$SLED_PROJECT_ROOT/sled"
export SLED_STACK="python"

# Load core SLED functionality
if [ -z "$SLED_HOME" ]; then
    echo "Error: SLED_HOME not set"
    return 1
fi

# Source core functionality
source "$SLED_HOME/lib/core.sh"

# Source custom initialization if it exists
if [ -f "$SLED_PROJECT_DIR/custom/init.sh" ]; then
    source "$SLED_PROJECT_DIR/custom/init.sh"
fi

# Create session marker
mkdir -p "$SLED_PROJECT_DIR/.session"
date > "$SLED_PROJECT_DIR/.session/$(date +%Y%m%d_%H%M%S)"

# <!-- LLM:verify Environment is now copy-safe and determined dynamically -->
