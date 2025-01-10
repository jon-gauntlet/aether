#!/bin/bash

# Check for distracting processes
echo "Checking for distractions..."
DISTRACTIONS=(
    "netflix"
    "youtube"
    "spotify"
    "discord"
    "telegram"
    "signal"
    "steam"
    "game"
)

for app in "${DISTRACTIONS[@]}"; do
    if pgrep -i "$app" > /dev/null; then
        notify-send "FOCUS WARNING" "Detected potentially distracting app: $app"
    fi
done

# Check system resources
echo "System Resources:"
free -h | grep "Mem:"
df -h / | tail -n 1
top -bn1 | head -n 3

# Check git activity
echo "Today's Git Activity:"
cd ~/workspace/gauntlet
git log --since="6am" --oneline

# Check daily note
TODAY=$(date +%Y-%m-%d)
if [ ! -f ~/Documents/notes/$TODAY.md ]; then
    notify-send "GAUNTLET REMINDER" "Daily note not created yet!"
fi

# Check focus time
WORK_START="7:00"
CURRENT_TIME=$(date +%H:%M)
UPTIME=$(uptime -p)

echo "System uptime: $UPTIME"
echo "Current time: $CURRENT_TIME"

# Calculate hours worked
START_SECONDS=$(date -d "$WORK_START" +%s)
NOW_SECONDS=$(date +%s)
HOURS_WORKED=$(( ($NOW_SECONDS - $START_SECONDS) / 3600 ))

echo "Hours worked today: $HOURS_WORKED"
if [ $HOURS_WORKED -lt 12 ]; then
    notify-send "GAUNTLET FOCUS" "Only $HOURS_WORKED hours worked. Keep pushing!"
fi 