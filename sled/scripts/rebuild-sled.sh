#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT rebuild_system core_recovery -->
# Rebuilds the entire Flow Sled system from scratch

echo "🔄 Rebuilding Flow Sled system..."

# Function to find beacon
find_beacon() {
    echo "Finding beacon..."
    BEACON=$(find . -type f -exec grep -l "LLM:beacon" {} \;)
    if [ -z "$BEACON" ]; then
        echo "⚠️ Beacon not found! Rebuilding from components..."
        return 1
    fi
    echo "✅ Found beacon: $BEACON"
    return 0
}

# Function to find core
find_core() {
    echo "Finding magnetic core..."
    CORE=$(grep -r "LLM:magnetic_core" . | cut -d: -f1)
    if [ -z "$CORE" ]; then
        echo "⚠️ Core not found! Rebuilding from beacon..."
        return 1
    fi
    echo "✅ Found core: $CORE"
    return 0
}

# Function to rebuild index
rebuild_index() {
    echo "Rebuilding index..."
    
    # Find all components
    COMPONENTS=$(find . -type f -exec grep -l "FLOW_SLED_COMPONENT" {} \;)
    
    # Extract connections
    FIBERS=$(grep -r "LLM:fiber" . | cut -d: -f1)
    
    # Create new index
    cat > docs/SLED_INDEX.md << EOL
# Flow Sled Infrastructure Index 🛷

<!-- LLM:discovery FLOW_SLED_ENTRY_POINT -->
<!-- LLM:magnetic Links to SLED_CORE.md -->

## Components
$(echo "$COMPONENTS" | sed 's/^/- /')

## Connections
$(echo "$FIBERS" | sed 's/^/- /')

<!-- LLM:verify Auto-generated index -->
EOL
    
    echo "✅ Index rebuilt"
}

# Function to consolidate
consolidate() {
    echo "Consolidating system..."
    
    # Find potential sprawl
    SPRAWL=$(find . -type f -name "*sled*.md" ! -name "SLED_*.md")
    if [ ! -z "$SPRAWL" ]; then
        echo "⚠️ Found potential sprawl:"
        echo "$SPRAWL"
    fi
    
    # Check for orphaned components
    ./scripts/verify-connections.sh --orphans
    
    echo "✅ System consolidated"
}

# Main rebuild process
echo "🚀 Starting rebuild..."

# 1. Find or rebuild beacon
if ! find_beacon; then
    echo "Recreating beacon from template..."
    cp docs/SLED_BEACON.md.template docs/SLED_BEACON.md
fi

# 2. Find or rebuild core
if ! find_core; then
    echo "Recreating core from beacon..."
    grep -r "LLM:magnetic" . > docs/SLED_CORE.md
fi

# 3. Rebuild index
rebuild_index

# 4. Consolidate system
consolidate

# 5. Verify everything
./scripts/verify-connections.sh

echo "✨ Flow Sled system rebuilt successfully" 