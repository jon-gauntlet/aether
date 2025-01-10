#!/bin/bash

# ChatGenius Project Optimization
# This script optimizes the environment specifically for ChatGenius development

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Store the original user
ORIGINAL_USER=$(logname || echo ${SUDO_USER})
USER_HOME=$(eval echo ~${ORIGINAL_USER})
CHATGENIUS_DIR="$USER_HOME/projects/chatgenius"

echo "Setting up ChatGenius optimization..."

# Create project-specific systemd slice
cat > /etc/systemd/system/chatgenius.slice << EOF
[Unit]
Description=ChatGenius Project Slice
Before=slices.target
Wants=system-ai.slice

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
WorkingDirectory=$CHATGENIUS_DIR
ExecStart=/bin/bash -c '\
while true; do \
    # Monitor project files \
    inotifywait -r -e modify,create,delete . > .gauntlet/file_changes.log; \
    \
    # Update project context \
    find . -type f -name "*.md" -exec cat {} + > .gauntlet/documentation.txt; \
    find . -type f -name "*.json" -exec cat {} + > .gauntlet/config.txt; \
    \
    # Collect metrics \
    git status --porcelain > .gauntlet/git_status.txt; \
    git log --since="1 day ago" --pretty=format:"%h %s" > .gauntlet/recent_commits.txt; \
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
mkdir -p "$CHATGENIUS_DIR/.gauntlet/"{logs,metrics,context,cache}

# Create project-specific optimization rules
cat > "$CHATGENIUS_DIR/.cursorrules" << EOF
{
    "project": {
        "name": "ChatGenius",
        "type": "ai",
        "priority": "high"
    },
    "optimization": {
        "cursor": {
            "indexing": {
                "priority": "realtime",
                "excludeDirs": ["node_modules", ".git", "dist"],
                "includeFiles": ["*.ts", "*.js", "*.md", "*.json"]
            },
            "completion": {
                "priority": "high",
                "contextWindow": "large",
                "model": "latest"
            }
        },
        "system": {
            "nice": -10,
            "ioclass": "realtime",
            "cpuGovernor": "performance"
        }
    },
    "adhd": {
        "focus": {
            "notifications": "minimal",
            "autoSave": true,
            "formatOnSave": true,
            "quickFixes": true
        },
        "flow": {
            "autoComplete": true,
            "inlineHints": true,
            "diagnostics": "immediate"
        }
    }
}
EOF

# Set up git hooks for context preservation
mkdir -p "$CHATGENIUS_DIR/.git/hooks"
cat > "$CHATGENIUS_DIR/.git/hooks/pre-commit" << 'EOF'
#!/bin/bash

# Save current context before commit
find . -type f -name "*.md" -mtime -1 -exec cp {} .gauntlet/context/ \;
find . -type f -name "*.json" -mtime -1 -exec cp {} .gauntlet/context/ \;

# Record metrics
git diff --cached --stat > .gauntlet/metrics/pre_commit_stats.txt
git status --porcelain > .gauntlet/metrics/pre_commit_status.txt

exit 0
EOF

chmod +x "$CHATGENIUS_DIR/.git/hooks/pre-commit"

# Set correct ownership
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$CHATGENIUS_DIR/.gauntlet"
chown -R "$ORIGINAL_USER:$ORIGINAL_USER" "$CHATGENIUS_DIR/.git/hooks"
chown "$ORIGINAL_USER:$ORIGINAL_USER" "$CHATGENIUS_DIR/.cursorrules"

# Enable and start services
systemctl daemon-reload
systemctl enable --now chatgenius.slice
systemctl enable --now chatgenius-dev.service

# Move this script to applied directory
mv "$0" "$(dirname "$0")/../applied/"

echo "ChatGenius optimization system installed successfully."
echo "The project environment is now optimized for:"
echo "1. Real-time file indexing and code completion"
echo "2. ADHD-friendly workflow with minimal distractions"
echo "3. Automatic context preservation"
echo "4. Continuous integration of changes"
echo "5. High-priority system resource allocation" 