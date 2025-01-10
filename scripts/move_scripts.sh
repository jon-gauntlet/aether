#!/bin/bash

# Create scripts directory if it doesn't exist
mkdir -p src/core/scripts

# Function to check if a file is a shell script
is_shell_script() {
    local file="$1"
    head -n1 "$file" | grep -q '^#!'
}

# Function to get script name from content
get_script_name() {
    local file="$1"
    local name
    
    # Try to get name from second line comment
    name=$(sed -n '2s/# \(.*\)/\1/p' "$file" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
    
    if [ -z "$name" ]; then
        # Fallback to original name
        name=$(basename "$file")
    fi
    
    echo "$name.sh"
}

# Process each file in types directory
for file in src/core/types/*; do
    if [ -f "$file" ] && is_shell_script "$file"; then
        script_name=$(get_script_name "$file")
        mv "$file" "src/core/scripts/$script_name"
        chmod +x "src/core/scripts/$script_name"
        echo "Moved $file to src/core/scripts/$script_name"
    fi
done

echo "Script movement complete!" 