#!/bin/bash

# Define the base directory for the codebase
BASE_DIR="/home/jon/git/app-sec-exercise"

# Define old and new directory names
declare -A path_changes=(
    ["findings/claude-3.5-sonnet"]="findings/code_analysis"
    ["findings/dast"]="findings/dynamic_analysis"
    ["findings/sast"]="findings/static_analysis"
)

# Function to rename directories
rename_directories() {
    echo "Renaming directories..."

    for old_path in "${!path_changes[@]}"; do
        new_path=${path_changes[$old_path]}
        if [ -d "$BASE_DIR/$old_path" ]; then
            mv "$BASE_DIR/$old_path" "$BASE_DIR/$new_path" 2>/dev/null
            echo "Renamed $old_path to $new_path"
        fi
    done
}

# Function to rename files for consistency
rename_files() {
    echo "Renaming files..."

    # Example: Rename files in code_analysis directory
    for file in "$BASE_DIR/findings/code_analysis"/*/*.md; do
        new_name=$(echo "$file" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
        mv "$file" "$new_name" 2>/dev/null
    done

    # Example: Rename JSON files in dynamic_analysis directory
    for file in "$BASE_DIR/findings/dynamic_analysis"/*.json; do
        new_name=$(echo "$file" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
        mv "$file" "$new_name" 2>/dev/null
    done

    # Example: Rename JSON files in static_analysis directory
    for file in "$BASE_DIR/findings/static_analysis"/*.json; do
        new_name=$(echo "$file" | tr ' ' '_' | tr '[:upper:]' '[:lower:]')
        mv "$file" "$new_name" 2>/dev/null
    done
}

# Function to update path references in files
update_path_references() {
    echo "Updating path references..."

    for old_path in "${!path_changes[@]}"; do
        new_path=${path_changes[$old_path]}
        echo "Replacing $old_path with $new_path"

        # Find and replace old paths with new paths in all files, including markdown
        find "$BASE_DIR" -type f \( -name "*.sh" -o -name "*.md" -o -name "*.json" \) -exec sed -i "s|$old_path|$new_path|g" {} +
    done
}

# Function to create a scripts directory
create_scripts_directory() {
    echo "Creating scripts directory..."
    mkdir -p "$BASE_DIR/scripts"
    echo "Scripts directory created at $BASE_DIR/scripts"
}

# Main function to execute the script
main() {
    rename_directories
    rename_files
    update_path_references
    create_scripts_directory
    echo "Optimization complete."
}

# Run the main function
main
