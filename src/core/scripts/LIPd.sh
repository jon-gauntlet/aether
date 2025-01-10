#!/bin/bash

# Configuration
HISTORY_DIR="/home/jon/.config/Cursor/User/History"
WORKSPACE_DIR="/home/jon/projects/aether"
SIGNATURE_DB="$WORKSPACE_DIR/.gauntlet/recovery/signatures.json"
RECOVERY_LOG="$WORKSPACE_DIR/.gauntlet/recovery/recovery.log"
CONFLICT_DIR="$WORKSPACE_DIR/.gauntlet/recovery/conflicts"

# Create necessary directories
mkdir -p "$WORKSPACE_DIR/.gauntlet/recovery"
mkdir -p "$CONFLICT_DIR"
mkdir -p "$WORKSPACE_DIR/src/core/"{patterns,hooks,types,context,autonomic,flow,integration,energy,fields,metrics,protection}
mkdir -p "$WORKSPACE_DIR/src/components"
mkdir -p "$WORKSPACE_DIR/src/core/"{patterns,hooks,types,context,autonomic,flow,integration,energy,fields,metrics,protection}"/__tests__"

# Initialize recovery log
echo "Recovery started at $(date)" > "$RECOVERY_LOG"

# Function to generate file signature
generate_signature() {
    local file="$1"
    # Use first non-empty line and file size as signature
    local first_line=$(grep -v '^[[:space:]]*$' "$file" | head -n 1)
    local size=$(wc -c < "$file")
    echo "${first_line}:${size}"
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
                # Check for source code markers
                first_line=$(head -n 1 "$file" 2>/dev/null)
                if [[ "$first_line" == *"src/"* ]]; then
                    # Extract original path
                    orig_path=$(echo "$first_line" | grep -o "src/.*\.[tj]sx\?")
                    if [ ! -z "$orig_path" ]; then
                        target_file="$WORKSPACE_DIR/$orig_path"
                        signature=$(generate_signature "$file")
                        recover_file "$file" "$target_file" "$signature"
                    fi
                fi
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