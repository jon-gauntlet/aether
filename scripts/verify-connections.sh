#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT verify_connections core_maintenance -->
# Verifies and strengthens Flow Sled component connections

echo "🧲 Verifying Flow Sled connections..."

# Check core integrity
echo "Checking core integrity..."
if ! grep -q "LLM:magnetic_core" docs/SLED_CORE.md; then
    echo "⚠️ Core marker missing!"
    exit 1
fi

# Find all components
echo "Finding components..."
COMPONENTS=$(find . -type f -exec grep -l "FLOW_SLED_COMPONENT" {} \;)
echo "Found $(echo "$COMPONENTS" | wc -l) components"

# Verify fiber connections
echo "Verifying fiber connections..."
FIBERS=$(grep -r "LLM:fiber" . | cut -d: -f1)
for fiber in $FIBERS; do
    echo "Checking fiber: $fiber"
    LINKS=$(grep "<-->" "$fiber" | cut -d" " -f1)
    for link in $LINKS; do
        if ! grep -q "FLOW_SLED_COMPONENT" "$link" 2>/dev/null; then
            echo "⚠️ Missing component marker in: $link"
        fi
    done
done

# Check for orphaned components
echo "Checking for orphaned components..."
for component in $COMPONENTS; do
    if ! grep -q "$component" docs/SLED_CORE.md && ! grep -q "$component" docs/SLED_INDEX.md; then
        echo "⚠️ Orphaned component: $component"
    fi
done

# Verify magnetic field
echo "Verifying magnetic field..."
FIELD_STRENGTH=$(grep -r "LLM:magnetic" . | wc -l)
echo "Magnetic field strength: $FIELD_STRENGTH connections"

# Update growth marker
echo "Updating growth marker..."
sed -i "s/Last updated:.*$/Last updated: $(date)/" docs/SLED_CORE.md

echo "✅ Connection verification complete" 