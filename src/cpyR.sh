#!/bin/bash

# Prepare context services for installation
# This script runs as user, no sudo needed

# Ensure directories exist
mkdir -p ~/.config/cursor/{contexts/{system,general,projects,sacred},state,bridges}
mkdir -p ~/.local/share/cursor/{indexes,cache,logs}

# Create staging directory for service files
mkdir -p ~/.config/cursor/services

# Prepare service files
cat > ~/.config/cursor/services/cursor-context.slice << 'EOF'
[Unit]
Description=Cursor Context Management Slice
Before=slices.target

[Slice]
CPUWeight=90
IOWeight=90
MemoryHigh=4G
TasksMax=32
EOF

cat > ~/.config/cursor/services/cursor-semantic-indexer.service << 'EOF'
[Unit]
Description=Cursor Semantic Indexer Service
After=cursor-agent.service
Wants=cursor-agent.service
Slice=cursor-context.slice

[Service]
Type=simple
User=jon
Group=jon
Environment=CURSOR_CONTEXT_ROOT=/home/jon/.config/cursor
Environment=CURSOR_DATA_ROOT=/home/jon/.local/share/cursor
ExecStart=/home/jon/scripts/cursor/semantic_indexer.sh
Restart=always
RestartSec=30
Nice=10

[Install]
WantedBy=multi-user.target
EOF

cat > ~/.config/cursor/services/cursor-context-optimizer.service << 'EOF'
[Unit]
Description=Cursor Context Optimizer Service
After=cursor-agent.service cursor-semantic-indexer.service
Wants=cursor-agent.service cursor-semantic-indexer.service
Slice=cursor-context.slice

[Service]
Type=simple
User=jon
Group=jon
Environment=CURSOR_CONTEXT_ROOT=/home/jon/.config/cursor
Environment=CURSOR_DATA_ROOT=/home/jon/.local/share/cursor
ExecStart=/home/jon/scripts/cursor/context_optimizer.sh
Restart=always
RestartSec=30
Nice=15

[Install]
WantedBy=multi-user.target
EOF

# Make scripts executable
chmod +x /home/jon/scripts/cursor/*.sh

echo "Service files prepared in ~/.config/cursor/services"
echo "Run install_context_services.sh with sudo to complete installation" 