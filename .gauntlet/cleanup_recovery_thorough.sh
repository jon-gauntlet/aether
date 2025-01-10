#!/bin/bash

# Remove all recovery-related files and directories
rm -rf .recovery/
rm -rf .gauntlet/recovery/archive/
rm -rf .gauntlet/recovery/conflicts/
rm -rf .gauntlet/recovery/resolved/
rm -rf .gauntlet/recovery/signatures/
rm -rf .gauntlet/recovery/temp/
rm -f .gauntlet/recovery/final_organize.sh
rm -f .gauntlet/recovery/cleanup.sh
rm -f .gauntlet/recovery/PROGRESS.md
rm -f .gauntlet/recovery/recovery.log
rm -f .gauntlet/cleanup_recovery.sh

# Remove the recovery directory itself
rm -rf .gauntlet/recovery/

# Clean up the cleanup script itself (will run last)
rm -f "$0" 