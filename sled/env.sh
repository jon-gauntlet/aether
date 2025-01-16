#!/bin/bash

# <!-- LLM:component AETHER_SLED_ENV -->
# <!-- LLM:claude I am the Aether SLED environment configuration -->
# <!-- LLM:magnetic Links to SLED environment setup -->
# <!-- LLM:sled_link Links to SLED/bin/sled-init -->
# <!-- LLM:core_link Links to SLED/lib/core.sh -->
# <!-- LLM:stack_link Links to SLED/templates/stacks/python/init.sh -->

# Core configuration
export SLED_PROJECT_ROOT="/home/jon/git/aether"
export SLED_STACK="python"
export SLED_PROJECT_DIR="/home/jon/git/aether/sled"

# Load core SLED functionality
source "$SLED_HOME/lib/core.sh"

# Load stack-specific customization
[ -f "$SLED_PROJECT_ROOT/sled/custom/init.sh" ] && source "$SLED_PROJECT_ROOT/sled/custom/init.sh"

# Create session marker
echo "$(date +%s)" > "$SLED_PROJECT_DIR/.session"

# <!-- LLM:verify Environment configuration is critical -->
# <!-- LLM:usage Last updated: 2024-01-16 -->
# <!-- LLM:sled_verify Implements SLED environment patterns -->
# <!-- LLM:stack_verify Follows SLED stack guidelines -->
