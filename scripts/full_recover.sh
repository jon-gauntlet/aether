#!/bin/bash

# Aether Full Recovery Script
# This script performs comprehensive recovery of all project files from Cursor history

# Configuration
HISTORY_DIR="/home/jon/.config/Cursor/User/History"
WORKSPACE_DIR="/home/jon/projects/aether"
SIGNATURE_DB="$WORKSPACE_DIR/.gauntlet/recovery/signatures.json"
RECOVERY_LOG="$WORKSPACE_DIR/.gauntlet/recovery/recovery.log"
CONFLICT_DIR="$WORKSPACE_DIR/.gauntlet/recovery/conflicts"
TEMP_DIR="$WORKSPACE_DIR/.gauntlet/recovery/temp"

# Create all necessary directories
mkdir -p "$WORKSPACE_DIR/.gauntlet/recovery"/{signatures,conflicts,temp}
mkdir -p "$WORKSPACE_DIR/src/core/"{patterns,hooks,types,context,autonomic,flow,integration,energy,fields,metrics,protection}
mkdir -p "$WORKSPACE_DIR/src/core/"{patterns,hooks,types,context,autonomic,flow,integration,energy,fields,metrics,protection}"/__tests__"
mkdir -p "$WORKSPACE_DIR/src/"{components,styles,utils,hooks,context,types}
mkdir -p "$WORKSPACE_DIR/docs"
mkdir -p "$WORKSPACE_DIR/scripts"

# Initialize recovery log
echo "Full recovery started at $(date)" > "$RECOVERY_LOG"

# Function to generate content-based signature
generate_signature() {
    local file="$1"
    # Use multiple characteristics for signature
    local imports=$(grep -E '^import .* from' "$file" 2>/dev/null | sort | sha256sum | cut -d' ' -f1)
    local exports=$(grep -E '^export' "$file" 2>/dev/null | sort | sha256sum | cut -d' ' -f1)
    local types=$(grep -E 'type|interface|enum' "$file" 2>/dev/null | sort | sha256sum | cut -d' ' -f1)
    local functions=$(grep -E 'function |=>' "$file" 2>/dev/null | sort | sha256sum | cut -d' ' -f1)
    echo "${imports}:${exports}:${types}:${functions}"
}

# Function to detect file type and target directory
detect_file_type() {
    local file="$1"
    local content=$(cat "$file" 2>/dev/null)
    
    # Core system detections
    if [[ "$content" =~ "FlowSystem" ]] || [[ "$content" =~ "useFlow" ]]; then
        echo "src/core/flow"
        return
    fi
    if [[ "$content" =~ "EnergySystem" ]] || [[ "$content" =~ "useEnergy" ]]; then
        echo "src/core/energy"
        return
    fi
    if [[ "$content" =~ "FieldSystem" ]] || [[ "$content" =~ "useField" ]]; then
        echo "src/core/fields"
        return
    fi
    if [[ "$content" =~ "MetricsSystem" ]] || [[ "$content" =~ "useMetrics" ]]; then
        echo "src/core/metrics"
        return
    fi
    if [[ "$content" =~ "ProtectionSystem" ]] || [[ "$content" =~ "useProtection" ]]; then
        echo "src/core/protection"
        return
    fi
    
    # Test file detection
    if [[ "$file" =~ \.test\.[tj]sx?$ ]] || [[ "$content" =~ "describe(" ]]; then
        local dir=$(dirname "$file")
        echo "${dir}/__tests__"
        return
    fi
    
    # Component detection
    if [[ "$content" =~ "React" ]] || [[ "$content" =~ "Component" ]] || [[ "$file" =~ \.tsx$ ]]; then
        echo "src/components"
        return
    fi
    
    # Type definition detection
    if [[ "$content" =~ "interface " ]] || [[ "$content" =~ "type " ]] || [[ "$file" =~ \.d\.ts$ ]]; then
        if [[ "$content" =~ "Energy" ]]; then
            echo "src/core/energy/types"
        elif [[ "$content" =~ "Flow" ]]; then
            echo "src/core/flow/types"
        else
            echo "src/core/types"
        fi
        return
    fi
    
    # Hook detection
    if [[ "$content" =~ "use" ]] && [[ "$file" =~ \.tsx?$ ]]; then
        echo "src/hooks"
        return
    fi
    
    # Default to source directory
    echo "src"
}

# Function to find best match for a file
find_best_match() {
    local signature="$1"
    local filename="$2"
    local best_match=""
    local highest_score=0
    
    while IFS= read -r history_file; do
        local history_signature=$(generate_signature "$history_file")
        local score=0
        
        # Compare signatures
        IFS=':' read -ra sig1 <<< "$signature"
        IFS=':' read -ra sig2 <<< "$history_signature"
        
        for i in "${!sig1[@]}"; do
            if [ "${sig1[$i]}" = "${sig2[$i]}" ]; then
                ((score++))
            fi
        done
        
        if [ "$score" -gt "$highest_score" ]; then
            highest_score=$score
            best_match=$history_file
        fi
    done < <(find "$HISTORY_DIR" -type f -name "*$filename")
    
    echo "$best_match"
}

# Function to recover a single file
recover_file() {
    local history_file="$1"
    local target_dir="$2"
    local filename=$(basename "$history_file")
    
    # Generate signatures
    local signature=$(generate_signature "$history_file")
    
    # Find target location
    local detected_dir=$(detect_file_type "$history_file")
    local target_path="$WORKSPACE_DIR/${detected_dir}/$filename"
    
    # Check for existing file
    if [ -f "$target_path" ]; then
        local existing_signature=$(generate_signature "$target_path")
        if [ "$signature" != "$existing_signature" ]; then
            # Store both versions in conflicts
            cp "$history_file" "$CONFLICT_DIR/${filename}.history"
            cp "$target_path" "$CONFLICT_DIR/${filename}.existing"
            echo "CONFLICT: $target_path - Multiple versions found" >> "$RECOVERY_LOG"
        fi
    else
        # Ensure target directory exists
        mkdir -p "$(dirname "$target_path")"
        cp "$history_file" "$target_path"
        echo "RECOVER: $target_path - Successfully recovered" >> "$RECOVERY_LOG"
    fi
}

# Main recovery process
echo "Starting comprehensive file recovery..."

# Process all files in history
find "$HISTORY_DIR" -type f | while read history_file; do
    recover_file "$history_file"
done

echo "Recovery process complete. Check $RECOVERY_LOG for details." 