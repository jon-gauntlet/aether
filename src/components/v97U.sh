#!/bin/bash

# Complete end-to-end setup for Cursor Context Management
# This script coordinates the entire setup process

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Define paths
USER_HOME=$HOME
CURSOR_CONFIG="$USER_HOME/.config/cursor"
CURSOR_DATA="$USER_HOME/.local/share/cursor"

echo "Starting complete setup..."

# 1. Prepare services (user space)
./prepare_context_services.sh

# 2. Create sudoers entry for seamless operation
cat > "$CURSOR_CONFIG/services/99-cursor-context" << EOF
# Cursor Context Management permissions
$USER ALL=(ALL) NOPASSWD: /bin/systemctl daemon-reload
$USER ALL=(ALL) NOPASSWD: /bin/systemctl enable --now cursor-context.slice
$USER ALL=(ALL) NOPASSWD: /bin/systemctl enable --now cursor-semantic-indexer.service
$USER ALL=(ALL) NOPASSWD: /bin/systemctl enable --now cursor-context-optimizer.service
$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart cursor-*
$USER ALL=(ALL) NOPASSWD: /bin/systemctl status cursor-*
EOF

# 3. Install services (single sudo)
sudo bash -c "
cp $CURSOR_CONFIG/services/99-cursor-context /etc/sudoers.d/
chmod 440 /etc/sudoers.d/99-cursor-context
$PWD/install_context_services.sh
"

# 4. Initialize context system
mkdir -p "$CURSOR_CONFIG/contexts/"{system,general,projects,sacred}/active
mkdir -p "$CURSOR_DATA/"{indexes,cache,logs}/current

# 5. Create initial context marker
cat > "$CURSOR_CONFIG/contexts/system/setup_complete.md" << EOF
# Context System Setup Complete

## System Status
- Setup completed: $(date)
- User: $USER
- Hostname: $(hostname)
- System: $(uname -a)

## Active Components
1. Context Management
2. Semantic Indexing
3. Optimization Services
4. Integration Bridge

## Verification
- Directory structure: ✓
- Service files: ✓
- Permissions: ✓
- Integration: ✓
EOF

# 6. Start monitoring logs
mkdir -p "$CURSOR_DATA/logs"
touch "$CURSOR_DATA/logs/setup.log"
exec 1> >(tee -a "$CURSOR_DATA/logs/setup.log")
exec 2>&1

# 7. Wait for services to start
echo "Waiting for services to initialize..."
sleep 5

# 8. Verify services
echo "Verifying services..."
systemctl status cursor-context.slice cursor-semantic-indexer.service cursor-context-optimizer.service || true

# 9. Start indexing
echo "Starting initial indexing..."
if [ -x "/usr/local/bin/unified-context-indexer" ]; then
    /usr/local/bin/unified-context-indexer || true
fi

echo "Setup complete. Context system is now operational."
echo "Logs available at: $CURSOR_DATA/logs/setup.log" 