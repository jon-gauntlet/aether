#!/bin/bash

# Function to get the appropriate name for a file based on its content
get_type_name() {
    local file="$1"
    local dir="$(dirname "$file")"
    local base_dir="$(basename "$dir")"
    
    # Check for flow type definitions
    if grep -q "type.*FlowType.*=.*'natural'" "$file" || grep -q "type.*FlowState.*=.*{" "$file" || grep -q "type.*FlowContext.*=.*{" "$file"; then
        echo "types"
        return
    fi
    
    # Check for session types
    if grep -q "interface.*Session" "$file" || grep -q "type.*Session" "$file"; then
        echo "session"
        return
    fi
    
    # Check for pattern types
    if grep -q "interface.*Pattern" "$file" || grep -q "type.*Pattern" "$file"; then
        echo "pattern"
        return
    fi
    
    # Check for natural flow types
    if grep -q "interface.*NaturalFlow" "$file"; then
        echo "natural"
        return
    fi
    
    # Check for flow type definitions
    if grep -q "enum.*FlowType" "$file" || grep -q "interface.*FlowMetrics" "$file" || grep -q "interface.*FlowContext" "$file" || grep -q "interface.*FlowEngine" "$file"; then
        echo "types"
        return
    fi
    
    # Check for stream types
    if grep -q "type.*StreamId" "$file" || grep -q "interface.*Stream.*{" "$file" || grep -q "type.*PresenceType.*=.*'active'" "$file" || grep -q "type.*PresenceType.*=.*'passive'" "$file"; then
        echo "stream"
        return
    fi
    
    # Check for presence types
    if grep -q "type.*PresenceType" "$file" || grep -q "interface.*Presence" "$file"; then
        echo "presence"
        return
    fi
    
    # Check for resonance types
    if grep -q "type.*Resonance" "$file" || grep -q "interface.*Resonance" "$file"; then
        echo "resonance"
        return
    fi
    
    # Check for metrics types
    if grep -q "type.*Metrics" "$file" || grep -q "interface.*Metrics" "$file"; then
        echo "metrics"
        return
    fi
    
    # Check for flow types
    if grep -q "type.*Flow.*=.*{" "$file" || grep -q "interface.*Flow.*{" "$file" || grep -q "type.*Flow.*=.*'.*'" "$file"; then
        echo "flow"
        return
    fi
    
    # Check for state types
    if grep -q "type.*State.*=.*{" "$file" || grep -q "interface.*State.*{" "$file" || grep -q "type.*State.*=.*'.*'" "$file"; then
        echo "state"
        return
    fi
    
    # Check for core type definitions
    if grep -q "Core Type System" "$file"; then
        echo "core"
        return
    fi
    
    # Check for specific type definitions
    if grep -q "interface.*Space.*{" "$file"; then
        echo "space"
        return
    fi
    
    if grep -q "interface.*Room.*{" "$file"; then
        echo "room"
        return
    fi
    
    if grep -q "interface.*Member.*{" "$file"; then
        echo "member"
        return
    fi
    
    if grep -q "interface.*State.*{" "$file"; then
        echo "state"
        return
    fi
    
    if grep -q "interface.*Stage.*{" "$file"; then
        echo "stage"
        return
    fi
    
    if grep -q "type.*Mood.*=" "$file"; then
        echo "mood"
        return
    fi
    
    # Check for utility functions
    if grep -q "export.*function" "$file"; then
        echo "utils"
        return
    fi
    
    # Check for test files
    if grep -q "describe(" "$file" || grep -q "test(" "$file"; then
        echo "test"
        return
    fi
    
    echo "unknown"
}

# Process each directory
for dir in src/core/types/*; do
    if [ -d "$dir" ]; then
        dir_name=$(basename "$dir")
        echo "Processing $dir_name directory..."
        
        # Process each TypeScript file
        for file in "$dir"/*.ts; do
            if [ -f "$file" ]; then
                base_name=$(basename "$file")
                
                # Skip already properly named files
                if [[ "$base_name" =~ ^[a-z]+\.ts$ ]]; then
                    continue
                fi
                
                # Get appropriate name
                type_name=$(get_type_name "$file")
                if [ "$type_name" != "unknown" ]; then
                    # Check if target file exists
                    if [ -f "$dir/$type_name.ts" ]; then
                        # If exists, use a numbered suffix
                        counter=1
                        while [ -f "$dir/${type_name}${counter}.ts" ]; do
                            ((counter++))
                        done
                        mv "$file" "$dir/${type_name}${counter}.ts"
                        echo "Renamed $base_name to ${type_name}${counter}.ts"
                    else
                        mv "$file" "$dir/$type_name.ts"
                        echo "Renamed $base_name to $type_name.ts"
                    fi
                fi
            fi
        done
    fi
done

echo "File renaming complete!" 