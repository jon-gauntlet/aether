#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT usage_tracking -->
# <!-- LLM:usage last_used="2024-01-15" calls=1 -->
# Tracks usage of Flow Sled components

COMPONENT=$1
TODAY=$(date +%Y-%m-%d)

if [ -z "$COMPONENT" ]; then
    echo "Usage: $0 <component_name>"
    exit 1
fi

# Update usage marker in component
update_usage() {
    local file=$1
    local current_calls=$(grep "LLM:usage.*calls=" "$file" | grep -o "calls=[0-9]*" | cut -d= -f2)
    
    if [ -z "$current_calls" ]; then
        # Add usage marker if not present
        sed -i "1a<!-- LLM:usage last_used=\"$TODAY\" calls=1 -->" "$file"
    else
        # Update existing marker
        local new_calls=$((current_calls + 1))
        sed -i "s/last_used=\"[^\"]*\"/last_used=\"$TODAY\"/" "$file"
        sed -i "s/calls=[0-9]*/calls=$new_calls/" "$file"
    fi
}

# Find component file
COMPONENT_FILE=$(find . -type f -exec grep -l "LLM:component.*$COMPONENT" {} \;)

if [ -z "$COMPONENT_FILE" ]; then
    echo "⚠️ Component not found: $COMPONENT"
    exit 1
fi

# Update usage
update_usage "$COMPONENT_FILE"

# Generate usage report
echo "📊 Usage Report for $COMPONENT"
echo "Last used: $TODAY"
echo "Total calls: $(grep "LLM:usage.*calls=" "$COMPONENT_FILE" | grep -o "calls=[0-9]*" | cut -d= -f2)"

# Check for dead links
DEAD_LINKS=$(grep -r "LLM:fiber.*$COMPONENT" . | grep -v -f <(find . -type f -exec grep -l "LLM:component" {} \;))
if [ ! -z "$DEAD_LINKS" ]; then
    echo "⚠️ Found dead links to this component:"
    echo "$DEAD_LINKS"
fi

# Check for split components
SIMILAR_COMPONENTS=$(find . -type f -name "*${COMPONENT}*" ! -path "*$COMPONENT_FILE")
if [ ! -z "$SIMILAR_COMPONENTS" ]; then
    echo "⚠️ Found potentially split components:"
    echo "$SIMILAR_COMPONENTS"
fi

# Update beacon
sed -i "s/Last checked:.*/Last checked: $TODAY/" docs/SLED_BEACON.md
``` 