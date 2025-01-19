#!/bin/bash

# Set up cron job for automated backups
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_SCRIPT="$SCRIPT_DIR/automated_backup.py"

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"

# Create cron job entry (runs daily at 2 AM)
CRON_JOB="0 2 * * * $BACKUP_SCRIPT >> $SCRIPT_DIR/../logs/backup_cron.log 2>&1"

# Add to crontab if not already present
(crontab -l 2>/dev/null | grep -Fq "$BACKUP_SCRIPT") || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Backup cron job installed successfully"
echo "📅 Scheduled to run daily at 2 AM"
echo "📝 Logs will be written to: $SCRIPT_DIR/../logs/backup_cron.log" 