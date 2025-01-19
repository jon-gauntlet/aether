#!/bin/bash

# Set up cron jobs for system maintenance
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAINTENANCE_SCRIPT="$SCRIPT_DIR/system_maintenance.py"

# Make maintenance script executable
chmod +x "$MAINTENANCE_SCRIPT"

# Create cron job entries
# Run maintenance tasks daily at 3 AM
MAINTENANCE_JOB="0 3 * * * $MAINTENANCE_SCRIPT >> $SCRIPT_DIR/../logs/maintenance_cron.log 2>&1"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -Fq "$MAINTENANCE_SCRIPT") || (crontab -l 2>/dev/null; echo "$MAINTENANCE_JOB") | crontab -

echo "✅ Maintenance cron jobs installed successfully"
echo "📅 System maintenance scheduled to run daily at 3 AM"
echo "📝 Logs will be written to: $SCRIPT_DIR/../logs/maintenance_cron.log" 