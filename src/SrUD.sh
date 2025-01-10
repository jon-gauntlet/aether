#!/bin/bash

# Migration script for system-ops to gauntlet integration
# Follows the Principle of Simplicity

set -eo pipefail

# Configuration
SYSTEM_OPS_DIR="$HOME/workspace/system-ops"
SCRIPTS_DIR="$HOME/scripts"
CONFIG_DIR="$HOME/.config/gauntlet"
STATE_DIR="$HOME/.local/state/gauntlet"
DATA_DIR="$HOME/.local/share/gauntlet"
SYSTEMD_DIR="/etc/systemd/system"

# Logging
log() {
    echo "[$(date -Iseconds)] $*"
}

error() {
    echo "[$(date -Iseconds)] ERROR: $*" >&2
}

# Create required directories
setup_directories() {
    log "Creating directory structure..."
    mkdir -p "$CONFIG_DIR"/{metrics,context,ai}
    mkdir -p "$STATE_DIR"/{metrics,context,ai}
    mkdir -p "$DATA_DIR"/{metrics,context,ai}
    mkdir -p "$SCRIPTS_DIR/gauntlet"/{metrics,context,ai}
}

# Migrate scripts with path updates
migrate_scripts() {
    log "Migrating scripts..."
    
    # Update paths in scripts
    for script in "$SYSTEM_OPS_DIR/scripts/gauntlet_"*.sh; do
        if [[ -f "$script" ]]; then
            name=$(basename "$script")
            category=$(echo "$name" | cut -d_ -f2 | cut -d. -f1)
            target="$SCRIPTS_DIR/gauntlet/$category/$(basename "$script")"
            
            # Create directory if needed
            mkdir -p "$(dirname "$target")"
            
            # Update paths and copy
            sed -e "s|\${HOME}/.gauntlet/metrics|$DATA_DIR/metrics|g" \
                -e "s|\${HOME}/.gauntlet/state|$STATE_DIR|g" \
                -e "s|\${HOME}/.gauntlet|$DATA_DIR|g" \
                "$script" > "$target"
            
            chmod +x "$target"
            log "Migrated $name to $target"
        fi
    done
}

# Migrate systemd services
migrate_services() {
    log "Migrating systemd services..."
    
    # Stop existing services
    systemctl --user stop gauntlet-*.service 2>/dev/null || true
    sudo systemctl stop gauntlet-*.service 2>/dev/null || true
    
    # Update and copy service files
    for service in "$SYSTEM_OPS_DIR/configs/"*.service; do
        if [[ -f "$service" ]]; then
            name=$(basename "$service")
            
            # Update paths and copy
            sed -e "s|/home/jon/.gauntlet|$DATA_DIR|g" \
                -e "s|/home/jon/workspace/system-ops|$SCRIPTS_DIR/gauntlet|g" \
                "$service" > "/tmp/$name"
            
            sudo mv "/tmp/$name" "$SYSTEMD_DIR/$name"
            sudo chmod 644 "$SYSTEMD_DIR/$name"
            log "Migrated $name"
        fi
    done
    
    # Update and copy slice files
    for slice in "$SYSTEM_OPS_DIR/configs/"*.slice; do
        if [[ -f "$slice" ]]; then
            name=$(basename "$slice")
            
            # Don't overwrite our new gauntlet-focus.slice
            if [[ "$name" != "gauntlet-focus.slice" ]]; then
                sudo cp "$slice" "$SYSTEMD_DIR/$name"
                sudo chmod 644 "$SYSTEMD_DIR/$name"
                log "Migrated $name"
            fi
        fi
    done
    
    # Reload systemd
    sudo systemctl daemon-reload
}

# Migrate configuration files
migrate_configs() {
    log "Migrating configurations..."
    
    # Copy and update configurations
    if [[ -d "$SYSTEM_OPS_DIR/configs/etc" ]]; then
        for config in "$SYSTEM_OPS_DIR/configs/etc/gauntlet/"*; do
            if [[ -f "$config" ]]; then
                name=$(basename "$config")
                cp "$config" "$CONFIG_DIR/"
                log "Migrated config: $name"
            fi
        done
    fi
}

# Migrate state files
migrate_state() {
    log "Migrating state..."
    
    # Copy state files if they exist
    if [[ -d "$SYSTEM_OPS_DIR/state" ]]; then
        for state in "$SYSTEM_OPS_DIR/state/"*; do
            if [[ -f "$state" ]]; then
                name=$(basename "$state")
                cp "$state" "$STATE_DIR/"
                log "Migrated state: $name"
            fi
        done
    fi
}

# Clean up temporary files
cleanup() {
    log "Cleaning up..."
    rm -f /tmp/gauntlet-*.service
}

# Main migration process
main() {
    log "Starting system-ops migration..."
    
    # Ensure we're not running as root
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
    
    # Check if system-ops exists
    if [[ ! -d "$SYSTEM_OPS_DIR" ]]; then
        error "system-ops directory not found at $SYSTEM_OPS_DIR"
        exit 1
    }
    
    # Run migration steps
    setup_directories
    migrate_scripts
    migrate_services
    migrate_configs
    migrate_state
    cleanup
    
    log "Migration complete!"
    log "You can now safely remove $SYSTEM_OPS_DIR"
    log "Please restart your shell or run: source ~/.zshrc"
}

# Run main if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 