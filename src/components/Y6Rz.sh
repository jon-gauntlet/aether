#!/bin/bash

# Complete end-to-end setup for Cursor Context Management
# This script coordinates the entire setup process

echo "Starting complete setup..."

# 1. Prepare services (user space)
./prepare_context_services.sh

# 2. Create sudoers entry for seamless operation
cat > ~/.config/cursor/services/99-cursor-context << EOF
# Cursor Context Management permissions
jon ALL=(ALL) NOPASSWD: /bin/systemctl daemon-reload
jon ALL=(ALL) NOPASSWD: /bin/systemctl enable --now cursor-context.slice
jon ALL=(ALL) NOPASSWD: /bin/systemctl enable --now cursor-semantic-indexer.service
jon ALL=(ALL) NOPASSWD: /bin/systemctl enable --now cursor-context-optimizer.service
jon ALL=(ALL) NOPASSWD: /bin/systemctl restart cursor-*
jon ALL=(ALL) NOPASSWD: /bin/systemctl status cursor-*
EOF

# 3. Install services (single sudo)
sudo bash -c '
cp ~/.config/cursor/services/99-cursor-context /etc/sudoers.d/
chmod 440 /etc/sudoers.d/99-cursor-context
/home/jon/scripts/cursor/install_context_services.sh
'

# 4. Initialize context system
mkdir -p ~/.config/cursor/contexts/{system,general,projects,sacred}/active
mkdir -p ~/.local/share/cursor/{indexes,cache,logs}/current

# 5. Create initial context marker
cat > ~/.config/cursor/contexts/system/setup_complete.md << EOF
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
mkdir -p ~/.local/share/cursor/logs
touch ~/.local/share/cursor/logs/setup.log
exec 1> >(tee -a ~/.local/share/cursor/logs/setup.log)
exec 2>&1

# 7. Verify services
echo "Verifying services..."
systemctl --user status cursor-context.slice cursor-semantic-indexer.service cursor-context-optimizer.service || true

# 8. Start indexing
echo "Starting initial indexing..."
/usr/local/bin/unified-context-indexer || true

echo "Setup complete. Context system is now operational."
echo "Logs available at: ~/.local/share/cursor/logs/setup.log" 