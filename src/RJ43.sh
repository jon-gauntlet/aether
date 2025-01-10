#!/bin/bash

# Cursor Auto-Updater and Configurator
# Keeps Cursor up-to-date and optimized for AI-First Development

set -euo pipefail

# Logging
readonly LOG_DIR="/var/log/cursor"
readonly LOG_FILE="$LOG_DIR/auto_update.log"
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Update Cursor from AUR
update_cursor() {
    log "Updating Cursor..."
    sudo -u "$SUDO_USER" yay -Syu --noconfirm cursor-bin || true
}

# Configure Cursor settings
configure_cursor() {
    local config_dir="/home/$SUDO_USER/.config/Cursor"
    local settings_file="$config_dir/settings.json"
    
    mkdir -p "$config_dir"
    
    # Create or update settings
    cat > "$settings_file" << EOF
{
    "yolo_mode": true,
    "auto_save": true,
    "terminal.integrated.enablePersistentSessions": true,
    "terminal.integrated.persistentSessionReviveProcess": "never",
    "terminal.integrated.tabs.enabled": false,
    "terminal.integrated.enableFileLinks": true,
    "workbench.editor.limit.enabled": true,
    "workbench.editor.limit.value": 5,
    "workbench.editor.limit.perEditorGroup": true,
    "files.autoSave": "afterDelay",
    "files.autoSaveDelay": 1000,
    "editor.formatOnSave": true,
    "editor.formatOnPaste": true,
    "editor.formatOnType": true,
    "window.restoreWindows": "preserve",
    "window.newWindowDimensions": "inherit",
    "extensions.autoUpdate": true,
    "telemetry.telemetryLevel": "off",
    "security.workspace.trust.enabled": true,
    "security.workspace.trust.startupPrompt": "never",
    "security.workspace.trust.banner": "never",
    "security.workspace.trust.emptyWindow": true
}
EOF
    
    # Set correct ownership
    chown -R "$SUDO_USER:$SUDO_USER" "$config_dir"
    chmod 600 "$settings_file"
    
    log "Cursor configuration updated"
}

# Main function
main() {
    if [ "$EUID" -ne 0 ]; then
        echo "Please run with sudo"
        exit 1
    fi
    
    log "Starting Cursor optimization..."
    update_cursor
    configure_cursor
    log "Cursor optimization complete"
}

main 