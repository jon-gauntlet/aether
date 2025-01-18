#!/bin/bash

# Aether Flow - Workspace Management Script
# This script manages multiple workspaces for the Aether project

# Base directories
AETHER_ROOT="$HOME/git/aether"
WORKSPACES_DIR="$HOME/git/aether-workspaces"

# Workspace names
BACKEND_WS="backend"
FRONTEND_WS="frontend"
INFRA_WS="infrastructure"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print with color
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if a directory exists
check_dir() {
    if [ ! -d "$1" ]; then
        print_color "$RED" "Directory $1 does not exist!"
        return 1
    fi
    return 0
}

# Create workspace directories if they don't exist
setup_workspaces() {
    print_color "$GREEN" "Setting up Aether workspaces..."
    mkdir -p "$WORKSPACES_DIR/$BACKEND_WS"
    mkdir -p "$WORKSPACES_DIR/$FRONTEND_WS"
    mkdir -p "$WORKSPACES_DIR/$INFRA_WS"
    print_color "$GREEN" "Workspaces created successfully!"
}

# Clone or update repositories
sync_repos() {
    local workspace=$1
    
    if [ ! -d "$WORKSPACES_DIR/$workspace" ]; then
        print_color "$RED" "Workspace $workspace does not exist!"
        return 1
    fi
    
    cd "$WORKSPACES_DIR/$workspace" || exit
    
    case $workspace in
        "$BACKEND_WS")
            if [ ! -d "aether-backend" ]; then
                git clone "$AETHER_ROOT" aether-backend
            else
                cd aether-backend && git pull
            fi
            ;;
        "$FRONTEND_WS")
            if [ ! -d "aether-frontend" ]; then
                git clone "$AETHER_ROOT" aether-frontend
            else
                cd aether-frontend && git pull
            fi
            ;;
        "$INFRA_WS")
            if [ ! -d "aether-infrastructure" ]; then
                git clone "$AETHER_ROOT" aether-infrastructure
            else
                cd aether-infrastructure && git pull
            fi
            ;;
        *)
            print_color "$RED" "Unknown workspace: $workspace"
            return 1
            ;;
    esac
}

# Switch to a workspace
switch_workspace() {
    local workspace=$1
    
    if [ ! -d "$WORKSPACES_DIR/$workspace" ]; then
        print_color "$RED" "Workspace $workspace does not exist!"
        return 1
    fi
    
    cd "$WORKSPACES_DIR/$workspace" || exit
    print_color "$GREEN" "Switched to $workspace workspace"
}

# Display usage information
show_usage() {
    cat << EOF
Usage: $(basename "$0") [command] [options]

Commands:
    setup               Create workspace directories
    sync <workspace>    Sync repositories for specified workspace
    switch <workspace>  Switch to specified workspace
    help               Show this help message

Workspaces:
    backend            Backend development workspace
    frontend           Frontend development workspace
    infrastructure     Infrastructure workspace

Examples:
    $(basename "$0") setup
    $(basename "$0") sync backend
    $(basename "$0") switch frontend
EOF
}

# Main script logic
main() {
    case $1 in
        setup)
            setup_workspaces
            ;;
        sync)
            if [ -z "$2" ]; then
                print_color "$RED" "Please specify a workspace"
                show_usage
                exit 1
            fi
            sync_repos "$2"
            ;;
        switch)
            if [ -z "$2" ]; then
                print_color "$RED" "Please specify a workspace"
                show_usage
                exit 1
            fi
            switch_workspace "$2"
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_color "$RED" "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"
