#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT dead_detection -->
# <!-- LLM:usage last_used="2024-01-15" calls=1 -->
# Finds dead and unused Flow Sled components

echo "🔍 Checking for dead components..."

# Function to check component age
check_age() {
    local file=$1
    local last_used=$(grep "LLM:usage.*last_used=" "$file" | grep -o "last_used=\"[^\"]*\"" | cut -d\" -f2)
    
    if [ -z "$last_used" ]; then
        echo "⚠️ Never used: $file"
        return
    fi
    
    # Calculate days since last use
    local days=$(( ( $(date +%s) - $(date -d "$last_used" +%s) ) / 86400 ))
    
    if [ $days -gt 30 ]; then
        echo "⚠️ Unused for $days days: $file"
    fi
}

echo "1. Checking for unused components..."
while IFS= read -r file; do
    check_age "$file"
done < <(find . -type f -exec grep -l "LLM:component" {} \;)

echo -e "\n2. Checking for dead links..."
grep -r "LLM:fiber" . | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    refs=$(echo "$line" | grep -o "<-->[^<]*" | cut -d" " -f2)
    
    for ref in $refs; do
        if ! find . -type f -exec grep -l "LLM:component.*$ref" {} \; | grep -q .; then
            echo "⚠️ Dead link in $file -> $ref"
        fi
    done
done

echo -e "\n3. Checking for orphaned components..."
while IFS= read -r file; do
    if ! grep -r "LLM:fiber.*$(basename "$file")" . | grep -q .; then
        echo "⚠️ Orphaned component: $file"
    fi
done < <(find . -type f -exec grep -l "LLM:component" {} \;)

echo -e "\n4. Checking for split components..."
find . -type f -name "*sled*" ! -name "SLED_*" | while read -r file; do
    echo "⚠️ Potential split component: $file"
done

echo -e "\n5. Generating cleanup suggestions..."
echo "To clean up, run:"
echo "  ./scripts/archive-unused.sh  # Archive old components"
echo "  ./scripts/clean-links.sh     # Remove dead links"
echo "  ./scripts/merge-components.sh # Consolidate splits"

# Update beacon
sed -i "s/Last checked:.*/Last checked: $(date +%Y-%m-%d)/" docs/SLED_BEACON.md 