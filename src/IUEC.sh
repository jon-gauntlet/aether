#!/bin/bash

# Configuration
STATS_FILE="$HOME/.local/share/gauntlet/stats.json"
CONFIG_FILE="$HOME/.config/gauntlet/config.json"
SLACK_PROCESS="slack"
GNOME_SHELL_SCHEMA="org.gnome.shell"

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

toggle_deep_mode() {
    local current_state
    current_state=$(jq -r '.deep_mode' "$CONFIG_FILE")
    
    if [[ "$current_state" == "false" ]]; then
        # Enable Deep Mode
        killall "$SLACK_PROCESS" 2>/dev/null
        gsettings set "$GNOME_SHELL_SCHEMA" "dock-position" 'BOTTOM'
        gsettings set "$GNOME_SHELL_SCHEMA" "dock-autohide" true
        notify-send "Deep Mode Enabled" "Slack closed, dock auto-hidden"
        jq '.deep_mode = true' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    else
        # Disable Deep Mode
        gsettings set "$GNOME_SHELL_SCHEMA" "dock-autohide" false
        notify-send "Deep Mode Disabled" "Dock restored"
        jq '.deep_mode = false' "$CONFIG_FILE" > "$CONFIG_FILE.tmp" && mv "$CONFIG_FILE.tmp" "$CONFIG_FILE"
    fi
}

start_focus_timer() {
    local duration="${1:-25}"
    update_stats "timer_starts" "$(( $(jq -r '.timer_starts' "$STATS_FILE") + 1 ))"
    
    (
        sleep "${duration}m"
        notify-send "Timer Complete" "Focus session finished"
        paplay /usr/share/sounds/freedesktop/stereo/complete.oga
    ) &
    
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
        echo "  deep      - Toggle deep work mode (closes Slack, auto-hides dock)"
        echo "  timer [m] - Start focus timer (default: 25m)"
        echo "  stats     - Show today's metrics"
        echo "  focus     - Start focused work session"
        echo "  check     - Show system status"
        ;;
esac
