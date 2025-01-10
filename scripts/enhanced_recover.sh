#!/bin/bash

# Configuration
HISTORY_DIR="/home/jon/.config/Cursor/User/History"
WORKSPACE_DIR="/home/jon/projects/aether"
SIGNATURE_DB="$WORKSPACE_DIR/.gauntlet/recovery/signatures.json"
RECOVERY_LOG="$WORKSPACE_DIR/.gauntlet/recovery/recovery.log"
CONFLICT_DIR="$WORKSPACE_DIR/.gauntlet/recovery/conflicts"
TEMP_DIR="$WORKSPACE_DIR/.gauntlet/recovery/temp"

# Create necessary directories
mkdir -p "$WORKSPACE_DIR/.gauntlet/recovery"
mkdir -p "$CONFLICT_DIR"
mkdir -p "$TEMP_DIR"
mkdir -p "$WORKSPACE_DIR/src/core/"{patterns,hooks,types,context,autonomic,flow,integration,energy,fields,metrics,protection}
mkdir -p "$WORKSPACE_DIR/src/components"
mkdir -p "$WORKSPACE_DIR/src/core/"{patterns,hooks,types,context,autonomic,flow,integration,energy,fields,metrics,protection}"/__tests__"

# Initialize recovery log
echo "Recovery started at $(date)" > "$RECOVERY_LOG"

# Function to generate content-based signature
generate_signature() {
    local file="$1"
    # Use combination of imports, exports, and type definitions
    local imports=$(grep -E '^import .* from' "$file" | sort | sha256sum | cut -d' ' -f1)
    local exports=$(grep -E '^export' "$file" | sort | sha256sum | cut -d' ' -f1)
    local types=$(grep -E 'type|interface|enum' "$file" | sort | sha256sum | cut -d' ' -f1)
    echo "${imports}:${exports}:${types}"
}

# Function to detect file type and target directory
detect_file_type() {
    local file="$1"
    local content=$(cat "$file")
    
    # Check for test files
    if [[ "$file" =~ \.test\.[tj]sx?$ ]] || [[ "$content" =~ "describe(" ]]; then
        echo "test"
        return
    fi
    
    # Check for component files
    if [[ "$content" =~ "React" ]] || [[ "$content" =~ "Component" ]] || [[ "$file" =~ \.tsx$ ]]; then
        echo "component"
        return
    fi
    
    # Check for type definitions
    if [[ "$content" =~ "interface " ]] || [[ "$content" =~ "type " ]] || [[ "$file" =~ \.d\.ts$ ]]; then
        echo "type"
        return
    fi
    
    # Check for hooks
    if [[ "$content" =~ "use[A-Z]" ]]; then
        echo "hook"
        return
    fi
    
    echo "source"
}

# Function to determine target path
determine_target_path() {
    local file="$1"
    local file_type="$2"
    local content=$(cat "$file")
    
    # Try to extract path from comments or imports
    local path_hint=$(grep -o "src/.*\.[tj]sx\?" "$file" | head -n 1)
    if [ ! -z "$path_hint" ]; then
        echo "$path_hint"
        return
    fi
    
    # Analyze content for system identification
    local system_type=""
    if [[ "$content" =~ "energy" ]]; then
        system_type="energy"
    elif [[ "$content" =~ "autonomic" ]]; then
        system_type="autonomic"
    elif [[ "$content" =~ "flow" ]]; then
        system_type="flow"
    elif [[ "$content" =~ "field" ]]; then
        system_type="fields"
    elif [[ "$content" =~ "pattern" ]]; then
        system_type="patterns"
    elif [[ "$content" =~ "protect" ]]; then
        system_type="protection"
    elif [[ "$content" =~ "metric" ]]; then
        system_type="metrics"
    elif [[ "$content" =~ "context" ]]; then
        system_type="context"
    fi
    
    # Generate path based on file type and system
    case "$file_type" in
        "test")
            echo "src/core/${system_type}/__tests__/$(basename "$file")"
            ;;
        "component")
            echo "src/components/$(basename "$file")"
            ;;
        "type")
            echo "src/core/types/$(basename "$file")"
            ;;
        "hook")
            echo "src/core/${system_type}/$(basename "$file")"
            ;;
        *)
            echo "src/core/${system_type}/$(basename "$file")"
            ;;
    esac
}

# Function to log recovery action
log_recovery() {
    local action="$1"
    local file="$2"
    local details="$3"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $action: $file - $details" >> "$RECOVERY_LOG"
}

# Function to handle file recovery
recover_file() {
    local history_file="$1"
    local target_file="$2"
    local signature="$3"
    
    if [ -f "$target_file" ]; then
        local existing_signature=$(generate_signature "$target_file")
        if [ "$existing_signature" != "$signature" ]; then
            # Store both versions in conflicts directory
            local conflict_base=$(basename "$target_file")
            cp "$target_file" "$CONFLICT_DIR/${conflict_base}.existing"
            cp "$history_file" "$CONFLICT_DIR/${conflict_base}.history"
            log_recovery "CONFLICT" "$target_file" "Multiple versions found"
        else
            log_recovery "SKIP" "$target_file" "Already recovered"
            return
        fi
    fi

    # Ensure target directory exists
    mkdir -p "$(dirname "$target_file")"
    
    # Copy file and preserve timestamp
    cp -p "$history_file" "$target_file"
    log_recovery "RECOVER" "$target_file" "Successfully recovered"
}

# Process history directory
echo "Starting enhanced recovery process..."
for dir in "$HISTORY_DIR"/*; do
    if [ -d "$dir" ]; then
        while IFS= read -r -d '' file; do
            if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
                # Create temporary copy for analysis
                tmp_file="$TEMP_DIR/$(basename "$file")"
                cp "$file" "$tmp_file"
                
                # Detect file type and target path
                file_type=$(detect_file_type "$tmp_file")
                target_path=$(determine_target_path "$tmp_file" "$file_type")
                
                if [ ! -z "$target_path" ]; then
                    target_file="$WORKSPACE_DIR/$target_path"
                    signature=$(generate_signature "$tmp_file")
                    recover_file "$file" "$target_file" "$signature"
                fi
                
                # Cleanup
                rm "$tmp_file"
            fi
        done < <(find "$dir" -type f -print0)
    fi
done

# Generate recovery summary
echo "Recovery completed at $(date)" >> "$RECOVERY_LOG"
echo "Summary:" >> "$RECOVERY_LOG"
echo "Files recovered: $(grep "RECOVER" "$RECOVERY_LOG" | wc -l)" >> "$RECOVERY_LOG"
echo "Conflicts found: $(grep "CONFLICT" "$RECOVERY_LOG" | wc -l)" >> "$RECOVERY_LOG"
echo "Files skipped: $(grep "SKIP" "$RECOVERY_LOG" | wc -l)" >> "$RECOVERY_LOG"

echo "Enhanced recovery process completed. Check $RECOVERY_LOG for details." 