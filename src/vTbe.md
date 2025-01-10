# Arch Linux System Protection Directive

## Critical Importance
The Arch Linux system is the foundation for all Gauntlet AI work. System integrity and accessibility must be preserved at all costs, as there are no backups or alternative systems available.

## Core Protection Rules
1. **Never Modify**
   - System boot files (kernel, initramfs, bootloader)
   - System authentication (PAM, login, sudo)
   - Core system utilities
   - Network configuration
   - Display manager/Window manager
   - User account settings

2. **Never Delete**
   - Any files under /home/jon/
   - System configuration in /etc/
   - Systemd units in /etc/systemd/
   - Package manager files
   - Login/authentication files

3. **Resource Protection**
   - Never fill root partition (keep 20% free)
   - Maintain swap space availability
   - Protect against memory exhaustion
   - Prevent CPU lockups
   - Monitor disk I/O

4. **Package Management**
   - No automated system updates
   - Never remove core packages
   - Maintain package database integrity
   - Preserve package cache
   - Keep working versions of critical packages

5. **Service Management**
   - Protect critical systemd services
   - Maintain login manager
   - Preserve display server
   - Keep network management running
   - Protect user services

## Safe Operations
1. **Allowed**
   - Reading system status
   - Monitoring resources
   - Creating user files
   - Managing user services
   - Using system utilities

2. **Requires Caution**
   - Installing user packages
   - Modifying user systemd units
   - Changing user configurations
   - Managing user services

3. **Never Allowed**
   - System package removal
   - Core service modification
   - Boot configuration changes
   - Authentication changes
   - Network stack modification

## Critical Paths to Protect
1. **System Access**
   ```
   /etc/passwd
   /etc/shadow
   /etc/pam.d/*
   /etc/sudoers
   /etc/security/*
   ```

2. **Boot Process**
   ```
   /boot/*
   /etc/default/grub
   /etc/mkinitcpio.conf
   ```

3. **Package Management**
   ```
   /var/lib/pacman/
   /etc/pacman.conf
   /etc/pacman.d/
   ```

4. **User Environment**
   ```
   /home/jon/.xinitrc
   /home/jon/.xsession
   /home/jon/.config/
   /home/jon/.local/
   ```

## Emergency Procedures
1. If system stability is threatened:
   - Stop all automated operations
   - Release system resources
   - Log the situation
   - Wait for human intervention

2. If resources are constrained:
   - Gracefully reduce operations
   - Never impact system services
   - Preserve login ability
   - Log all events

## Implementation Requirements
1. **Validation**
   - Check system status before operations
   - Verify critical paths
   - Test in safe context
   - Monitor impacts

2. **Monitoring**
   - Track system resources
   - Monitor critical services
   - Log system events
   - Alert on anomalies

3. **Safety Checks**
   - Verify system accessibility
   - Check service status
   - Monitor login capability
   - Validate core utilities

## Remember
- System access is mission-critical
- No automated system changes
- Preserve login capability
- Maintain system stability
- When in doubt, ask human
- Better to stop than risk damage 