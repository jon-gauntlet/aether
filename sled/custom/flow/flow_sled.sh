#!/bin/bash

# <!-- LLM:component AETHER_FLOW_SLED -->
# <!-- LLM:claude I am the Aether flow SLED script with zero-interference -->
# <!-- LLM:magnetic Links to SLED flow functionality -->
# <!-- LLM:sled_link Links to SLED/lib/core.sh -->
# <!-- LLM:core_link Links to SLED/core/sled-core.sh -->
# <!-- LLM:flow_link Links to SLED/scripts/shell-integration.sh -->

set -euo pipefail

# <!-- LLM:component FLOW_SLED_COMPONENT flow_management core_operations -->
# Core Flow Sled management script with zero-interference

# Flow Sled - Natural Development Acceleration
# ------------------------------------------

# Initialize state directories
FLOW_DIR="$SLED_PROJECT_DIR/.flow"
ENERGY_DIR="$SLED_PROJECT_DIR/.energy"
PROTECTION_DIR="$SLED_PROJECT_DIR/.protection"

mkdir -p "$FLOW_DIR" "$ENERGY_DIR" "$PROTECTION_DIR"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# State management functions
get_flow_state() {
    [ -f "$FLOW_DIR/state" ] && cat "$FLOW_DIR/state" || echo "1"
}

get_energy_level() {
    [ -f "$ENERGY_DIR/level" ] && cat "$ENERGY_DIR/level" || echo "100"
}

get_protection_level() {
    [ -f "$PROTECTION_DIR/level" ] && cat "$PROTECTION_DIR/level" || echo "1"
}

# Functions
check_state() {
    local flow_state=$(get_flow_state)
    local energy_level=$(get_energy_level)
    local protection_level=$(get_protection_level)
    
    echo -e "${BLUE}🌊 Flow State: $flow_state${NC}"
    echo -e "${GREEN}⚡ Energy: $energy_level${NC}"
    echo -e "${YELLOW}🛡️ Protection: $protection_level${NC}"
}

protect_flow() {
    local flow_state=$(get_flow_state)
    local protection_level=$(get_protection_level)
    
    if [ "$flow_state" -eq 1 ]; then
        echo -e "${GREEN}🛡️ Flow state protected${NC}"
        protection_level=$((protection_level + 1))
    else
        echo -e "${YELLOW}⚠️ Flow state needs recovery${NC}"
        protection_level=$((protection_level - 1))
    fi
    
    echo "$protection_level" > "$PROTECTION_DIR/level"
    date > "$PROTECTION_DIR/last_update"
}

monitor_energy() {
    local energy_level=$(get_energy_level)
    local start_time
    
    if [ -f "$ENERGY_DIR/session_start" ]; then
        start_time=$(cat "$ENERGY_DIR/session_start")
    else
        start_time=$(date +%s)
        echo "$start_time" > "$ENERGY_DIR/session_start"
    fi
    
    local current_time=$(date +%s)
    local session_length=$((current_time - start_time))
    
    if [ $session_length -gt 7200 ]; then # 2 hours
        energy_level=$((energy_level - 20))
        echo -e "${YELLOW}⚠️ Energy declining, consider a break${NC}"
    fi
    
    echo "$energy_level" > "$ENERGY_DIR/level"
    echo "$(date +%s) $energy_level" >> "$ENERGY_DIR/history"
}

optimize_code() {
    local mode=$1
    local env_type
    
    echo -e "${BLUE}📐 Code Optimization${NC}"
    
    # Read environment type
    if [ -f "$SLED_PROJECT_DIR/.environment/type" ]; then
        env_type=$(cat "$SLED_PROJECT_DIR/.environment/type")
    else
        echo -e "${RED}❌ Environment type not detected${NC}"
        return 1
    fi
    
    # Create optimization log directory
    local opt_dir="$SLED_PROJECT_DIR/.optimization"
    mkdir -p "$opt_dir"
    
    case $mode in
        "quick")
            echo "Quick optimization for $env_type" >> "$opt_dir/log"
            ;;
        "batch")
            echo "Batch optimization for $env_type" >> "$opt_dir/log"
            ;;
        "deep")
            echo "Deep optimization for $env_type" >> "$opt_dir/log"
            ;;
        *)
            echo "Full optimization for $env_type" >> "$opt_dir/log"
            ;;
    esac
    
    date > "$opt_dir/last_run"
}

protected_build() {
    echo -e "${BLUE}🚀 Protected Build${NC}"
    local protection_level=$(get_protection_level)
    
    if [ "$protection_level" -gt 0 ]; then
        # Log build attempt
        mkdir -p "$SLED_PROJECT_DIR/.builds"
        date > "$SLED_PROJECT_DIR/.builds/last_attempt"
        
        # Execute build based on environment
        if [ -f "$SLED_PROJECT_DIR/.environment/type" ]; then
            local env_type=$(cat "$SLED_PROJECT_DIR/.environment/type")
            case $env_type in
                "python")
                    if [ -f "pyproject.toml" ]; then
                        poetry build
                    fi
                    ;;
                *)
                    echo -e "${YELLOW}⚠️ No build configuration for $env_type${NC}"
                    ;;
            esac
        fi
    else
        echo -e "${RED}❌ Build blocked - protection level too low${NC}"
    fi
}

save_state() {
    echo -e "${GREEN}💾 Saving flow state${NC}"
    local flow_state=$(get_flow_state)
    local energy_level=$(get_energy_level)
    local protection_level=$(get_protection_level)
    
    # Save to state directory
    mkdir -p "$SLED_PROJECT_DIR/.state"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local state_file="$SLED_PROJECT_DIR/.state/$timestamp"
    
    {
        echo "flow=$flow_state"
        echo "energy=$energy_level"
        echo "protection=$protection_level"
    } > "$state_file"
}

restore_state() {
    echo -e "${BLUE}♻️ Restoring flow state${NC}"
    local state_dir="$SLED_PROJECT_DIR/.state"
    
    if [ -d "$state_dir" ]; then
        local latest_state=$(ls -t "$state_dir" | head -n1)
        if [ -n "$latest_state" ]; then
            local state_file="$state_dir/$latest_state"
            # shellcheck source=/dev/null
            source "$state_file"
            echo "$flow" > "$FLOW_DIR/state"
            echo "$energy" > "$ENERGY_DIR/level"
            echo "$protection" > "$PROTECTION_DIR/level"
        fi
    fi
}

# Main execution
case $1 in
    "--status")
        check_state
        ;;
    
    "--monitor")
        monitor_energy
        check_state
        ;;
    
    "--protect")
        protect_flow
        check_state
        ;;
    
    "--optimize")
        optimize_code "${2:-all}"
        ;;
    
    "--build")
        protected_build
        ;;
    
    "--save")
        save_state
        ;;
    
    "--restore")
        restore_state
        check_state
        ;;
    
    *)
        echo -e "${BLUE}🛷 Flow Sled${NC}"
        echo "Usage: flow_sled.sh [command]"
        echo
        echo "Commands:"
        echo "  --status         Check current state"
        echo "  --monitor        Monitor energy levels"
        echo "  --protect        Activate flow protection"
        echo "  --optimize       Run code optimization"
        echo "    quick         Quick wins only"
        echo "    batch         Batch processing"
        echo "    deep          Deep fixes"
        echo "    all          Full optimization (default)"
        echo "  --build          Protected build"
        echo "  --save           Save flow state"
        echo "  --restore        Restore flow state"
        ;;
esac 