#!/bin/bash

# Function to fix imports in a file
fix_imports() {
    local file="$1"
    local dir="$(dirname "$file")"
    local base_dir="$(basename "$dir")"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process each line
    while IFS= read -r line; do
        # Fix imports from core
        if [[ "$line" =~ ^import.*from.*\'../core\' ]]; then
            echo "$line" | sed "s/'..\/core'/'.\/${base_dir}'/g" >> "$temp_file"
        # Fix imports from flow
        elif [[ "$line" =~ ^import.*from.*\'../flow\' ]]; then
            echo "$line" | sed "s/'..\/flow'/'..\/flow\/types'/g" >> "$temp_file"
        # Fix imports from space
        elif [[ "$line" =~ ^import.*from.*\'../space\' ]]; then
            echo "$line" | sed "s/'..\/space'/'..\/space\/types'/g" >> "$temp_file"
        # Fix imports from energy
        elif [[ "$line" =~ ^import.*from.*\'../energy\' ]]; then
            echo "$line" | sed "s/'..\/energy'/'..\/energy\/types'/g" >> "$temp_file"
        # Fix imports from protection
        elif [[ "$line" =~ ^import.*from.*\'../protection\' ]]; then
            echo "$line" | sed "s/'..\/protection'/'..\/protection\/types'/g" >> "$temp_file"
        # Fix imports from consciousness
        elif [[ "$line" =~ ^import.*from.*\'../consciousness\' ]]; then
            echo "$line" | sed "s/'..\/consciousness'/'..\/consciousness\/types'/g" >> "$temp_file"
        # Keep other lines unchanged
        else
            echo "$line" >> "$temp_file"
        fi
    done < "$file"
    
    # Replace original file with fixed version
    mv "$temp_file" "$file"
}

# Process each TypeScript file in the types directory
find src/core/types -name "*.ts" -type f | while read -r file; do
    echo "Fixing imports in $file..."
    fix_imports "$file"
done

echo "Import fixes complete!" 