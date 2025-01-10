#!/bin/bash

# Service management script for AI System Evolution

# Configuration
SYSTEMD_DIR="$HOME/.config/systemd/user"
SLICE_NAME="cursor.slice"
SERVICES=(
    "context-service.service"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Helper functions
check_systemd() {
    if ! systemctl --user is-active --quiet systemd; then
        error "User systemd is not running"
        exit 1
    fi
}

reload_systemd() {
    log "Reloading systemd configuration"
    systemctl --user daemon-reload
}

ensure_directories() {
    # Create required directories
    mkdir -p "$HOME/.config/cursor"
    mkdir -p "$HOME/.local/share/cursor/"{contexts,patterns,logs}
    mkdir -p "$HOME/.local/share/cursor/contexts/"{active,archived,synthesized,principles}
    mkdir -p "$HOME/.local/share/cursor/patterns/"{code,workflow,integration,synthesized}
    
    # Set permissions
    chmod 700 "$HOME/.config/cursor"
    chmod -R 700 "$HOME/.local/share/cursor"
}

check_python_deps() {
    local deps=(
        "systemd"
        "aiofiles"
        "typing_extensions"
    )
    
    local missing=()
    for dep in "${deps[@]}"; do
        if ! python3 -c "import $dep" 2>/dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -gt 0 ]; then
        error "Missing Python dependencies: ${missing[*]}"
        error "Please install with: pip install ${missing[*]}"
        exit 1
    fi
}

# Service management functions
start_services() {
    log "Starting AI System Evolution services"
    
    # Start slice
    systemctl --user start "$SLICE_NAME"
    
    # Start services
    for service in "${SERVICES[@]}"; do
        log "Starting $service"
        if systemctl --user start "$service"; then
            log "$service started successfully"
        else
            error "Failed to start $service"
        fi
    done
}

stop_services() {
    log "Stopping AI System Evolution services"
    
    # Stop services in reverse order
    for ((i=${#SERVICES[@]}-1; i>=0; i--)); do
        service="${SERVICES[i]}"
        log "Stopping $service"
        if systemctl --user stop "$service"; then
            log "$service stopped successfully"
        else
            warn "Failed to stop $service"
        fi
    done
    
    # Stop slice
    systemctl --user stop "$SLICE_NAME"
}

restart_services() {
    stop_services
    start_services
}

check_status() {
    log "Checking service status"
    
    # Check slice status
    echo "Slice status:"
    systemctl --user status "$SLICE_NAME" --no-pager
    
    # Check service status
    for service in "${SERVICES[@]}"; do
        echo -e "\nService status: $service"
        systemctl --user status "$service" --no-pager
    done
}

install_services() {
    log "Installing AI System Evolution services"
    
    # Create required directories
    ensure_directories
    
    # Check Python dependencies
    check_python_deps
    
    # Enable services
    for service in "${SERVICES[@]}"; do
        log "Enabling $service"
        if systemctl --user enable "$service"; then
            log "$service enabled successfully"
        else
            error "Failed to enable $service"
        fi
    done
    
    # Start services
    start_services
}

uninstall_services() {
    log "Uninstalling AI System Evolution services"
    
    # Stop and disable services
    for service in "${SERVICES[@]}"; do
        log "Disabling $service"
        systemctl --user stop "$service"
        if systemctl --user disable "$service"; then
            log "$service disabled successfully"
        else
            warn "Failed to disable $service"
        fi
    done
}

# Main logic
main() {
    check_systemd
    
    case "$1" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_status
            ;;
        install)
            install_services
            ;;
        uninstall)
            uninstall_services
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|install|uninstall}"
            exit 1
            ;;
    esac
}

main "$@" 