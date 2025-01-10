#!/bin/bash

# Cursor Auto-Updater and Configurator
# Keeps Cursor up-to-date and optimized for AI-First Development

set -euo pipefail
trap 'cleanup $?' EXIT

# Logging
readonly LOG_DIR="/var/log/cursor"
readonly LOG_FILE="$LOG_DIR/auto_update.log"
readonly LOCK_FILE="/var/run/cursor_updater.lock"
readonly MAX_LOG_SIZE=$((10 * 1024 * 1024)) # 10MB

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    local exit_code=$1
    rm -f "$LOCK_FILE"
    if [ "$exit_code" -ne 0 ]; then
        log "Error occurred. Exit code: $exit_code"
    fi
}

rotate_logs() {
    if [ -f "$LOG_FILE" ] && [ "$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE")" -gt "$MAX_LOG_SIZE" ]; then
        mv "$LOG_FILE" "$LOG_FILE.old"
    fi
}

check_lock() {
    if [ -f "$LOCK_FILE" ]; then
        pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "Another instance is running (PID: $pid)"
            exit 0
        fi
    fi
    echo $$ > "$LOCK_FILE"
}

# Update Cursor from AUR
update_cursor() {
    log "Updating Cursor..."
    if ! command -v yay &> /dev/null; then
        log "Installing yay..."
        sudo -u "$SUDO_USER" bash -c 'git clone https://aur.archlinux.org/yay.git /tmp/yay && cd /tmp/yay && makepkg -si --noconfirm' || true
    fi
    sudo -u "$SUDO_USER" yay -Syu --noconfirm cursor-bin || true
}

# Configure Cursor settings
configure_cursor() {
    local config_dir="/home/$SUDO_USER/.config/Cursor"
    local settings_file="$config_dir/settings.json"
    local backup_file="$config_dir/settings.json.bak"
    
    mkdir -p "$config_dir"
    
    # Backup existing settings
    if [ -f "$settings_file" ]; then
        cp "$settings_file" "$backup_file"
    fi
    
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
    "security.workspace.trust.emptyWindow": true,
    "workbench.editor.showTabs": "single",
    "workbench.editor.enablePreview": false,
    "workbench.editor.closeEmptyGroups": true,
    "workbench.editor.focusRecentEditorAfterClose": false,
    "files.simpleDialog.enable": true,
    "window.menuBarVisibility": "toggle",
    "editor.minimap.enabled": false,
    "workbench.activityBar.location": "hidden",
    "workbench.statusBar.visible": false,
    "workbench.layoutControl.enabled": false,
    "terminal.integrated.defaultProfile.linux": "zsh",
    "terminal.integrated.gpuAcceleration": "on",
    "terminal.integrated.shellIntegration.enabled": true,
    "terminal.integrated.persistentSessionReviveProcess": "never",
    "terminal.integrated.enablePersistentSessions": false,
    "terminal.integrated.tabs.enabled": false,
    "terminal.integrated.enableFileLinks": true
}
EOF
    
    # Set correct ownership
    chown -R "$SUDO_USER:$SUDO_USER" "$config_dir"
    chmod 600 "$settings_file"
    
    log "Cursor configuration updated"
}

# Verify system integration
verify_integration() {
    log "Verifying system integration..."
    
    # Check systemd services
    systemctl is-active cursor-agent.service >/dev/null 2>&1 || systemctl restart cursor-agent.service
    systemctl is-enabled cursor-updater.timer >/dev/null 2>&1 || systemctl enable cursor-updater.timer
    
    # Check system resources
    if [ -f "/etc/systemd/system/system-ai.slice" ]; then
        systemctl restart system-ai.slice || true
    fi
    
    # Verify sudoers configuration
    if [ ! -f "/etc/sudoers.d/99-cursor-agent" ]; then
        log "Reinstalling sudoers configuration..."
        cp "/home/jon/scripts/99-cursor-agent" "/etc/sudoers.d/"
        chmod 440 "/etc/sudoers.d/99-cursor-agent"
    fi
}

# Main function
main() {
    if [ "$EUID" -ne 0 ]; then
        echo "Please run with sudo"
        exit 1
    fi
    
    mkdir -p "$LOG_DIR"
    rotate_logs
    check_lock
    
    log "Starting Cursor optimization..."
    update_cursor
    configure_cursor
    verify_integration
    log "Cursor optimization complete"
}

main 