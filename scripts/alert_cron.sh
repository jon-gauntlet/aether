#!/bin/bash

# Set up cron jobs for alert monitoring
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ALERT_SCRIPT="$SCRIPT_DIR/alert_manager.py"

# Make alert script executable
chmod +x "$ALERT_SCRIPT"

# Create cron job entries
# Run alert checks every 5 minutes
ALERT_JOB="*/5 * * * * $ALERT_SCRIPT >> $SCRIPT_DIR/../logs/alert_cron.log 2>&1"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -Fq "$ALERT_SCRIPT") || (crontab -l 2>/dev/null; echo "$ALERT_JOB") | crontab -

echo "✅ Alert monitoring cron job installed successfully"
echo "📅 Alert checks scheduled to run every 5 minutes"
echo "📝 Logs will be written to: $SCRIPT_DIR/../logs/alert_cron.log" 