#!/bin/bash

# Configuration
STATS_FILE="$HOME/.local/share/gauntlet/stats.json"
CONFIG_FILE="$HOME/.config/gauntlet/config.json"
SLACK_PROCESS="slack"

# KDE-specific settings
PANEL_SCRIPT='
var panel = panelById(panelIds[0]);
if (panel) {
    if (panel.height > 2) {
        panel.height = 1;
    } else {
        panel.height = 38;
    }
}'

# Ensure directories exist
mkdir -p "$(dirname "$STATS_FILE")" "$(dirname "$CONFIG_FILE")"

# Initialize stats if needed
if [[ ! -f "$STATS_FILE" ]]; then
    echo '{"timer_starts":0,"focus_sessions":0}' > "$STATS_FILE"
fi

# Initialize config if needed
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo '{"deep_mode":false,"flow_mode":false}' > "$CONFIG_FILE"
fi

update_stats() {
    local key="$1"
    local value="$2"
    jq ".$key = $value" "$STATS_FILE" > "$STATS_FILE.tmp" && mv "$STATS_FILE.tmp" "$STATS_FILE"
}

notify() {
    local title="$1"
    local message="$2"
    if command -v kdialog >/dev/null 2>&1; then
        kdialog --title "$title" --passivepopup "$message" 5 &
    elif command -v notify-send >/dev/null 2>&1; then
        notify-send "$title" "$message"
    else
        echo "$title: $message"
    fi
}

play_sound() {
    local sound_paths=(
        "/usr/share/sounds/plasma/stereo/complete.oga"
        "/usr/share/sounds/freedesktop/stereo/complete.oga"
        "/usr/share/sounds/freedesktop/stereo/bell.oga"
    )
    
    for sound in "${sound_paths[@]}"; do
        if [ -f "$sound" ]; then
            if command -v paplay >/dev/null 2>&1; then
                paplay "$sound" 2>/dev/null && return
            elif command -v aplay >/dev/null 2>&1; then
                aplay "$sound" 2>/dev/null && return
            fi
        fi
    done
}

toggle_deep_mode() {
    local current_state
    current_state=$(jq -r '.deep_mode' "$CONFIG_FILE")
    
    if [[ "$current_state" == "false" ]]; then
        # Enable Deep Mode
        killall "$SLACK_PROCESS" 2>/dev/null
        
        # KDE Panel manipulation
        qdbus org.kde.plasmashell /PlasmaShell evaluateScript "$PANEL_SCRIPT" 2>/dev/null
        
        # Hide desktop widgets
        qdbus org.kde.plasmashell /PlasmaShell evaluateScript 'desktop = desktopById(0); desktop.wallpaperPlugin = "org.kde.color"' 2>/dev/null
        
        notify "Deep Mode Enabled" "Slack closed, distractions minimized"
        jq '.deep_mode = true' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    else
        # Disable Deep Mode
        qdbus org.kde.plasmashell /PlasmaShell evaluateScript "$PANEL_SCRIPT" 2>/dev/null
        
        # Restore desktop widgets
        qdbus org.kde.plasmashell /PlasmaShell evaluateScript 'desktop = desktopById(0); desktop.wallpaperPlugin = "org.kde.image"' 2>/dev/null
        
        notify "Deep Mode Disabled" "Desktop restored"
        jq '.deep_mode = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    fi
}

start_focus_timer() {
    local duration="${1:-25}"
    update_stats "timer_starts" "$(( $(jq -r '.timer_starts' "$STATS_FILE") + 1 ))"
    
    (
        sleep "${duration}m"
        notify "Focus Timer" "Focus session finished"
        play_sound
    ) &
    
    notify "Focus Timer" "Started ${duration} minute focus session"
    echo "Focus timer started for ${duration} minutes"
}

show_stats() {
    echo "Today's Stats:"
    jq -r '. | to_entries | .[] | "\(.key): \(.value)"' "$STATS_FILE"
    echo -e "\nCurrent Session:"
    jq -r '. | to_entries | .[] | "\(.key): \(.value)"' "$CONFIG_FILE"
}

case "$1" in
    "deep")
        toggle_deep_mode
        ;;
    "timer")
        start_focus_timer "$2"
        ;;
    "stats")
        show_stats
        ;;
    "focus")
        toggle_deep_mode
        start_focus_timer 25
        ;;
    "check")
        show_stats
        echo -e "\nSystem Status:"
        ps aux | grep -E "$SLACK_PROCESS|cursor" | grep -v grep
        ;;
    *)
        echo "Gauntlet Command Suite"
        echo "Usage: g <command> [args]"
        echo
        echo "Commands:"
        echo "  deep      - Toggle deep work mode (closes Slack, auto-hides panel)"
        echo "  timer [m] - Start focus timer (default: 25m)"
        echo "  stats     - Show today's metrics"
        echo "  focus     - Start focused work session"
        echo "  check     - Show system status"
        ;;
esac
