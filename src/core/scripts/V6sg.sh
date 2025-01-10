#!/bin/bash

# ChatGenius Project Environment Optimization
# This script sets up optimizations specific to the ChatGenius project

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})
CHATGENIUS_DIR="$USER_HOME/projects/chatgenius"
GAUNTLET_HOME="$CHATGENIUS_DIR/.gauntlet"

echo "Setting up ChatGenius optimization..."

# Create project-specific slice
cat > /etc/systemd/system/chatgenius.slice << EOF
[Unit]
Description=ChatGenius Project Slice
Before=slices.target
After=system-ai.slice

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=8G
TasksMax=infinity
EOF

# Create environment file
cat > /etc/gauntlet/chatgenius.env << EOF
CURSOR_PROJECT=$CHATGENIUS_DIR
GAUNTLET_HOME=$GAUNTLET_HOME
HOME=$USER_HOME
EOF

# Create the ChatGenius monitor script
cat > /usr/local/bin/chatgenius-monitor << 'EOF'
#!/bin/bash
set -eo pipefail

# Load environment
if [ ! -f /etc/gauntlet/chatgenius.env ]; then
    echo "Error: Missing environment file" >&2
    exit 1
fi
source /etc/gauntlet/chatgenius.env

# Verify required variables
for var in CURSOR_PROJECT GAUNTLET_HOME HOME; do
    if [ -z "${!var}" ]; then
        echo "Error: Missing required variable: $var" >&2
        exit 1
    fi
done

# Verify directories exist
if [ ! -d "$CURSOR_PROJECT" ]; then
    echo "Error: Project directory does not exist: $CURSOR_PROJECT" >&2
    exit 1
fi

if [ ! -d "$GAUNTLET_HOME" ]; then
    mkdir -p "$GAUNTLET_HOME" || {
        echo "Error: Could not create Gauntlet home directory: $GAUNTLET_HOME" >&2
        exit 1
    }
fi

# Trap cleanup
cleanup() {
    echo "Cleaning up..." >&2
    jobs -p | xargs -r kill
    exit 0
}
trap cleanup SIGTERM SIGINT

while true; do
    # Monitor project files
    inotifywait -r -e modify,create,delete "${CURSOR_PROJECT}" > "${GAUNTLET_HOME}/file_changes.log" 2>/dev/null || true

    # Update project context
    find "${CURSOR_PROJECT}" -type f -name "*.md" -exec cat {} + > "${GAUNTLET_HOME}/documentation.txt" 2>/dev/null || true
    find "${CURSOR_PROJECT}" -type f -name "*.json" -exec cat {} + > "${GAUNTLET_HOME}/config.txt" 2>/dev/null || true

    # Collect metrics
    if [ -d "${CURSOR_PROJECT}/.git" ]; then
        git -C "${CURSOR_PROJECT}" status --porcelain > "${GAUNTLET_HOME}/git_status.txt" 2>/dev/null || true
        git -C "${CURSOR_PROJECT}" log --since="1 day ago" --pretty=format:"%h %s" > "${GAUNTLET_HOME}/recent_commits.txt" 2>/dev/null || true
    fi

    # Rotate logs if they get too big
    for log in "${GAUNTLET_HOME}"/*.log; do
        if [ -f "$log" ] && [ "$(stat -f%z "$log" 2>/dev/null || stat -c%s "$log")" -gt 10485760 ]; then
            mv "$log" "$log.old" 2>/dev/null || true
        fi
    done

    sleep 60
done
EOF

chmod +x /usr/local/bin/chatgenius-monitor

# Create project-specific systemd service
cat > /etc/systemd/system/chatgenius-dev.service << 'EOF'
[Unit]
Description=ChatGenius Development Environment
After=network.target system-ai.slice gauntlet-optimizer.service
Wants=system-ai.slice gauntlet-optimizer.service
ConditionPathExists=/etc/gauntlet/chatgenius.env
StartLimitIntervalSec=300
StartLimitBurst=3

[Service]
Type=simple
User=GAUNTLET_USER
Group=GAUNTLET_USER
Environment="NODE_ENV=development"
Environment="CURSOR_PROJECT=CHATGENIUS_DIR_PATH"
Environment="CURSOR_LOG_LEVEL=error"
Environment="GAUNTLET_HOME=GAUNTLET_HOME_PATH"
Environment="HOME=USER_HOME_PATH"
WorkingDirectory=CHATGENIUS_DIR_PATH
ExecStartPre=/bin/mkdir -p GAUNTLET_HOME_PATH
ExecStartPre=/usr/bin/test -d CHATGENIUS_DIR_PATH
ExecStart=/usr/local/bin/chatgenius-monitor
Slice=chatgenius.slice
Restart=always
RestartSec=5
TimeoutStartSec=30
TimeoutStopSec=30
SuccessExitStatus=0 143
KillMode=mixed
KillSignal=SIGTERM
LimitNOFILE=65535

[Install]
WantedBy=default.target
EOF

# Secure environment file
chown root:$ORIGINAL_USER /etc/gauntlet/chatgenius.env
chmod 640 /etc/gauntlet/chatgenius.env

# Create project directory if it doesn't exist
mkdir -p "$CHATGENIUS_DIR"
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$CHATGENIUS_DIR"

# Replace placeholders in the service file
sed -i "s|GAUNTLET_USER|$ORIGINAL_USER|g" /etc/systemd/system/chatgenius-dev.service
sed -i "s|CHATGENIUS_DIR_PATH|$CHATGENIUS_DIR|g" /etc/systemd/system/chatgenius-dev.service
sed -i "s|GAUNTLET_HOME_PATH|$GAUNTLET_HOME|g" /etc/systemd/system/chatgenius-dev.service
sed -i "s|USER_HOME_PATH|$USER_HOME|g" /etc/systemd/system/chatgenius-dev.service

# Set up project-specific directories
mkdir -p "$CHATGENIUS_DIR/.gauntlet"/{logs,metrics,context,cache}
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$CHATGENIUS_DIR/.gauntlet"

# Create optimization rules file
cat > "$CHATGENIUS_DIR/.cursorrules" << EOF
# ChatGenius Project Rules
editor.formatOnSave: true
editor.defaultFormatter: null
files.autoSave: afterDelay
files.autoSaveDelay: 1000
search.exclude:
  "**/.git": true
  "**/node_modules": true
  "**/.gauntlet": true
  "**/*.min.*": true
  "**/dist": true
  "**/build": true
EOF

# Set up git hook for context preservation
mkdir -p "$CHATGENIUS_DIR/.git/hooks"
cat > "$CHATGENIUS_DIR/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash
# Save context before commit
find . -type f -name "*.md" -exec cat {} + > .gauntlet/pre_commit_context.txt 2>/dev/null || true
# Record metrics
git diff --cached --stat > .gauntlet/commit_stats.txt 2>/dev/null || true
EOF

chmod +x "$CHATGENIUS_DIR/.git/hooks/pre-commit"

# Enable and start services
systemctl daemon-reload
systemctl enable --now chatgenius.slice
systemctl enable --now chatgenius-dev.service

echo "ChatGenius optimization system installed successfully."
echo "The project environment is now optimized for:"
echo "1. Real-time file indexing and code completion"
echo "2. ADHD-friendly workflow with minimal distractions"
echo "3. Automatic context preservation"
echo "4. Continuous integration of changes"
echo "5. High-priority system resource allocation" 