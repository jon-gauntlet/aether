#!/bin/bash

# Configuration
STATS_FILE="$HOME/.local/share/gauntlet/stats.json"
CONFIG_FILE="$HOME/.config/gauntlet/config.json"
SLACK_PROCESS="slack"

# Detect desktop environment
if [ "$XDG_CURRENT_DESKTOP" = "GNOME" ]; then
    DE_TYPE="gnome"
elif [ "$XDG_CURRENT_DESKTOP" = "KDE" ]; then
    DE_TYPE="kde"
else
    DE_TYPE="unknown"
fi

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
    if command -v notify-send >/dev/null 2>&1; then
        notify-send "$title" "$message" || echo "$title: $message"
    else
        echo "$title: $message"
    fi
}

play_sound() {
    local sound_paths=(
        "/usr/share/sounds/freedesktop/stereo/complete.oga"
        "/usr/share/sounds/freedesktop/stereo/bell.oga"
        "/usr/share/sounds/gnome/default/alerts/glass.ogg"
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
    echo "ding!"
}

toggle_deep_mode() {
    local current_state
    current_state=$(jq -r '.deep_mode' "$CONFIG_FILE")
    
    if [[ "$current_state" == "false" ]]; then
        # Enable Deep Mode
        killall "$SLACK_PROCESS" 2>/dev/null
        
        # Handle desktop environment specific settings
        case "$DE_TYPE" in
            "gnome")
                gsettings set org.gnome.shell dock-position 'BOTTOM' 2>/dev/null
                gsettings set org.gnome.shell dock-autohide true 2>/dev/null
                ;;
            "kde")
                qdbus org.kde.plasmashell /PlasmaShell evaluateScript 'panel = panels()[0]; panel.height = 1;' 2>/dev/null
                ;;
        esac
        
        notify "Deep Mode Enabled" "Slack closed, distractions minimized"
        jq '.deep_mode = true' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    else
        # Disable Deep Mode
        case "$DE_TYPE" in
            "gnome")
                gsettings set org.gnome.shell dock-autohide false 2>/dev/null
                ;;
            "kde")
                qdbus org.kde.plasmashell /PlasmaShell evaluateScript 'panel = panels()[0]; panel.height = 32;' 2>/dev/null
                ;;
        esac
        
        notify "Deep Mode Disabled" "Normal mode restored"
        jq '.deep_mode = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    fi
}

start_focus_timer() {
    local duration="${1:-25}"
    update_stats "timer_starts" "$(( $(jq -r '.timer_starts' "$STATS_FILE") + 1 ))"
    
    (
        sleep "${duration}m"
        notify "Timer Complete" "Focus session finished"
        play_sound
    ) &
    
    notify "Focus Timer" "Started for ${duration} minutes"
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
        echo "Desktop Environment: $DE_TYPE"
        echo -e "\nProcesses:"
        ps aux | grep -E "$SLACK_PROCESS|cursor" | grep -v grep
        ;;
    *)
        echo "Gauntlet Command Suite"
        echo "Usage: g <command> [args]"
        echo
        echo "Commands:"
        echo "  deep      - Toggle deep work mode (closes Slack, minimizes UI)"
        echo "  timer [m] - Start focus timer (default: 25m)"
        echo "  stats     - Show today's metrics"
        echo "  focus     - Start focused work session"
        echo "  check     - Show system status"
        ;;
esac
