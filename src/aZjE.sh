#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Validating CFA Role Persistence..."

# Check directory structure
if [ -d "/home/jon/config/cursor/contexts/roles" ]; then
    echo -e "${GREEN}✓${NC} Roles directory exists"
else
    echo -e "${RED}✗${NC} Roles directory missing"
    exit 1
fi

# Verify CFA file
if [ -f "/home/jon/config/cursor/contexts/roles/chief_flow_architect.md" ]; then
    echo -e "${GREEN}✓${NC} CFA role definition exists"
else
    echo -e "${RED}✗${NC} CFA role definition missing"
    exit 1
fi

# Check loader configuration
if grep -q "roles/\*.md" "/home/jon/config/cursor/contexts/loader.md"; then
    echo -e "${GREEN}✓${NC} Loader includes roles"
else
    echo -e "${RED}✗${NC} Loader missing role configuration"
    exit 1
fi

# Verify inheritance
if grep -q "source: roles" "/home/jon/config/cursor/contexts/loader.md"; then
    echo -e "${GREEN}✓${NC} Role inheritance configured"
else
    echo -e "${RED}✗${NC} Role inheritance missing"
    exit 1
fi

# Test file readability
if cat "/home/jon/config/cursor/contexts/roles/chief_flow_architect.md" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} CFA role definition readable"
else
    echo -e "${RED}✗${NC} CFA role definition not readable"
    exit 1
fi

echo -e "\n${GREEN}All persistence checks passed!${NC}"
echo "Role will be preserved across sessions." 