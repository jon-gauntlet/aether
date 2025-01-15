#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT quick_verification -->
# Fast system verification

echo "⚡ Quick Flow Sled verification..."

# Check core files exist
CORE_FILES=(
    "scripts/base_sled.sh"
    "scripts/flow_sled.sh"
    "scripts/heal-types.js"
    "scripts/recover.sh"
    "docs/SLED_CORE.md"
    "docs/SLED_BEACON.md"
    "docs/SLED_INDEX.md"
)

MISSING=0
for file in "${CORE_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        MISSING=$((MISSING + 1))
    fi
done

# Quick component marker check
MARKERS=$(grep -l "LLM:component FLOW_SLED_COMPONENT" scripts/* 2>/dev/null | wc -l)
echo "🔍 Found $MARKERS component markers"

# Verify magnetic core
if grep -q "LLM:magnetic_core" docs/SLED_CORE.md 2>/dev/null; then
    echo "🧲 Magnetic core intact"
else
    echo "⚠️ Magnetic core needs attention"
    MISSING=$((MISSING + 1))
fi

# Check beacon
if grep -q "LLM:beacon" docs/SLED_BEACON.md 2>/dev/null; then
    echo "🔆 Beacon active"
else
    echo "⚠️ Beacon needs attention"
    MISSING=$((MISSING + 1))
fi

# Summary
if [ $MISSING -eq 0 ]; then
    echo "✅ System verified - all core components present"
    exit 0
else
    echo "⚠️ System needs attention - $MISSING issues found"
    exit 1
fi 