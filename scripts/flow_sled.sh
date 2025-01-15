#!/bin/bash

# <!-- LLM:component FLOW_SLED_COMPONENT flow_management core_operations -->
# Core Flow Sled management script

# Flow Sled - Natural Development Acceleration
# ------------------------------------------

# Initialize state
FLOW_STATE=1
ENERGY=100
PROTECTION=1

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Functions
check_state() {
  echo -e "${BLUE}🌊 Flow State: $FLOW_STATE${NC}"
  echo -e "${GREEN}⚡ Energy: $ENERGY${NC}"
  echo -e "${YELLOW}🛡️ Protection: $PROTECTION${NC}"
}

protect_flow() {
  if [ $FLOW_STATE -eq 1 ]; then
    echo -e "${GREEN}🛡️ Flow state protected${NC}"
    PROTECTION=$((PROTECTION + 1))
  else
    echo -e "${YELLOW}⚠️ Flow state needs recovery${NC}"
    PROTECTION=$((PROTECTION - 1))
  fi
}

monitor_energy() {
  local current_time=$(date +%s)
  local session_length=$((current_time - start_time))
  
  if [ $session_length -gt 7200 ]; then # 2 hours
    ENERGY=$((ENERGY - 20))
    echo -e "${YELLOW}⚠️ Energy declining, consider a break${NC}"
  fi
}

optimize_types() {
  local mode=$1
  echo -e "${BLUE}📐 Type Optimization${NC}"
  
  if [ $ENERGY -lt 50 ]; then
    echo -e "${YELLOW}⚠️ Low energy - running quick wins only${NC}"
    npx ts-node --project scripts/tsconfig.json scripts/optimize-types.ts --quick
  else
    case $mode in
      "quick")
        npx ts-node --project scripts/tsconfig.json scripts/optimize-types.ts --quick
        ;;
      "batch")
        npx ts-node --project scripts/tsconfig.json scripts/optimize-types.ts --batch
        ;;
      "deep")
        npx ts-node --project scripts/tsconfig.json scripts/optimize-types.ts --deep
        ;;
      *)
        npx ts-node --project scripts/tsconfig.json scripts/optimize-types.ts --all
        ;;
    esac
  fi
}

protected_build() {
  echo -e "${BLUE}🚀 Protected Build${NC}"
  if [ $PROTECTION -gt 0 ]; then
    npm run build
  else
    echo -e "${RED}❌ Build blocked - protection level too low${NC}"
  fi
}

save_state() {
  echo -e "${GREEN}💾 Saving flow state${NC}"
  echo "{\"flow\": $FLOW_STATE, \"energy\": $ENERGY, \"protection\": $PROTECTION}" > .flow-state
}

restore_state() {
  echo -e "${BLUE}♻️ Restoring flow state${NC}"
  if [ -f .flow-state ]; then
    FLOW_STATE=$(jq '.flow' .flow-state)
    ENERGY=$(jq '.energy' .flow-state)
    PROTECTION=$(jq '.protection' .flow-state)
  fi
}

# Main execution
start_time=$(date +%s)

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
  
  "--optimize-types")
    optimize_types $2
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
    echo "  --optimize-types Run type optimization"
    echo "    quick         Quick wins only"
    echo "    batch         Batch processing"
    echo "    deep          Deep fixes"
    echo "    all          Full optimization (default)"
    echo "  --build          Protected build"
    echo "  --save           Save flow state"
    echo "  --restore        Restore flow state"
    ;;
esac 