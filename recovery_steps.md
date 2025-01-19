# Recovery Steps for System Permission Fix

## Current Issue
- Root filesystem mounted with nosuid,nodev
- Causing permission denied on /dev/null and /dev/fuse
- Sudo not working
- Bash completion broken

## Before Reboot
1. Save all work
2. Close all applications
3. Note: Cursor and other apps will still work after fix

## Recovery Mode Steps
1. Restart computer
2. Hold SHIFT while booting
3. In GRUB menu:
   - Select "Advanced options for Ubuntu"
   - Choose latest kernel with "(recovery mode)"
4. In Recovery Menu:
   - Select "root" or "drop to root shell"

## Fix Commands (Run these in recovery root shell)
```bash
# Mount root filesystem read-write
mount -o remount,rw /

# Check current fstab
cat /etc/fstab

# Backup fstab
cp /etc/fstab /etc/fstab.backup

# Edit fstab - remove nosuid,nodev from root mount options
# Look for line with / and ext4
nano /etc/fstab

# Verify changes
cat /etc/fstab

# Reboot
reboot
```

## After Reboot
1. System should boot normally
2. All permissions should be restored
3. Cursor and other apps will work as before

## If Something Goes Wrong
1. You can always boot back to recovery mode
2. Original fstab is backed up at /etc/fstab.backup
3. Can restore with: `cp /etc/fstab.backup /etc/fstab`

## Verification After Fix
```bash
# Check mount options
mount | grep -E '/ |/usr'

# Should NOT see nosuid,nodev

# Test sudo
sudo whoami

# Test /dev/null
echo test > /dev/null

# Test AppImage
# Try running Cursor again
``` 