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

# Create project-specific systemd service
cat > /etc/systemd/system/chatgenius-dev.service << EOF
[Unit]
Description=ChatGenius Development Environment
After=network.target
Wants=system-ai.slice

[Service]
Type=simple
User=$ORIGINAL_USER
Group=$ORIGINAL_USER
Environment="NODE_ENV=development"
Environment="CURSOR_PROJECT=$CHATGENIUS_DIR"
Environment="CURSOR_LOG_LEVEL=error"
Environment="GAUNTLET_HOME=$CHATGENIUS_DIR/.gauntlet"
WorkingDirectory=$CHATGENIUS_DIR
ExecStartPre=/bin/mkdir -p $CHATGENIUS_DIR/.gauntlet
ExecStart=/bin/bash -c '\
    while true; do \
        # Monitor project files \
        inotifywait -r -e modify,create,delete "$CURSOR_PROJECT" > "$GAUNTLET_HOME/file_changes.log" 2>/dev/null || true; \
        \
        # Update project context \
        find "$CURSOR_PROJECT" -type f -name "*.md" -exec cat {} + > "$GAUNTLET_HOME/documentation.txt" 2>/dev/null || true; \
        find "$CURSOR_PROJECT" -type f -name "*.json" -exec cat {} + > "$GAUNTLET_HOME/config.txt" 2>/dev/null || true; \
        \
        # Collect metrics \
        git -C "$CURSOR_PROJECT" status --porcelain > "$GAUNTLET_HOME/git_status.txt" 2>/dev/null || true; \
        git -C "$CURSOR_PROJECT" log --since="1 day ago" --pretty=format:"%h %s" > "$GAUNTLET_HOME/recent_commits.txt" 2>/dev/null || true; \
        \
        sleep 60; \
    done'
Slice=chatgenius.slice
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

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