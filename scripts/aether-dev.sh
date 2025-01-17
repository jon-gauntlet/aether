#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check and kill process using a port
kill_port_process() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Process using port $port found (PID: $pid). Killing...${NC}"
        kill -9 $pid
        sleep 1
    fi
}

# Function to check and setup Node.js version
setup_node_version() {
    REQUIRED_NODE_VERSION="18.17.1"
    CURRENT_NODE_VERSION=$(node -v 2>/dev/null || echo "none")
    
    if [ "$CURRENT_NODE_VERSION" != "v$REQUIRED_NODE_VERSION" ]; then
        echo -e "${YELLOW}Node.js $REQUIRED_NODE_VERSION required but found $CURRENT_NODE_VERSION${NC}"
        
        # Try using n to install the correct version
        if ! command -v n &> /dev/null; then
            echo -e "${BLUE}Installing n (Node.js version manager)...${NC}"
            sudo npm install -g n || {
                echo -e "${RED}Failed to install n. Please install Node.js $REQUIRED_NODE_VERSION manually${NC}"
                exit 1
            }
        fi
        
        echo -e "${BLUE}Installing Node.js $REQUIRED_NODE_VERSION...${NC}"
        sudo n $REQUIRED_NODE_VERSION || {
            echo -e "${RED}Failed to install Node.js $REQUIRED_NODE_VERSION${NC}"
            exit 1
        }
        
        # Refresh shell hash
        hash -r 2>/dev/null || rehash 2>/dev/null || true
        
        # Verify installation
        NEW_NODE_VERSION=$(node -v)
        if [ "$NEW_NODE_VERSION" != "v$REQUIRED_NODE_VERSION" ]; then
            echo -e "${RED}Node.js version mismatch after installation. Please start a new shell.${NC}"
            exit 1
        fi
    fi
}

# Function to clean install dependencies
clean_install_deps() {
    echo -e "${BLUE}Performing clean installation of dependencies...${NC}"
    rm -rf node_modules
    npm install || {
        echo -e "${RED}Failed to install dependencies${NC}"
        exit 1
    }
}

# Determine which repo we're in based on directory name
REPO_NAME=$(basename $(pwd))
case $REPO_NAME in
    "aether-frontend")
        PORT=3001  # Changed from 3000 to match current setup
        BACKEND_PORT=8000
        setup_node_version  # Frontend needs specific Node.js version
        ;;
    "aether-backend")
        PORT=8000
        ;;
    "aether-infra")
        PORT=9000
        ;;
    *)
        echo -e "${RED}Error: Not in a recognized aether repository${NC}"
        echo "Please run this script from aether-frontend, aether-backend, or aether-infra"
        exit 1
        ;;
esac

# Kill any processes using our ports
kill_port_process $PORT
if [ "$REPO_NAME" = "aether-frontend" ]; then
    kill_port_process $BACKEND_PORT
fi

# Check if this is first time setup by looking for .env
if [ ! -f ".env" ]; then
    echo -e "${BLUE}First time setup detected for $REPO_NAME${NC}"
    
    # Clone main aether repo if not already present
    if [ ! -d "../aether" ]; then
        echo -e "${BLUE}Cloning main aether repository...${NC}"
        cd ..
        git clone https://github.com/jon-gauntlet/aether
        cd -
    fi

    # Run setup script
    echo -e "${BLUE}Running workspace setup...${NC}"
    ../aether/scripts/setup-workspace.sh $REPO_NAME $PORT
fi

# For frontend, ensure clean dependency installation
if [ "$REPO_NAME" = "aether-frontend" ]; then
    clean_install_deps
fi

# Start development environment
echo -e "${GREEN}Starting development environment for $REPO_NAME${NC}"
./scripts/start-dev.sh 