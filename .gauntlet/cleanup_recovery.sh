#!/bin/bash

# Remove the entire .recovery directory since we confirmed we don't need it
rm -rf .recovery/

# Remove recovery-related scripts that are no longer needed
rm -f .gauntlet/recovery/organize_files.sh
rm -f .gauntlet/recovery/fix_imports.sh
rm -f .gauntlet/recovery/rename_types.sh
rm -f .gauntlet/recovery/cleanup_intermediate.sh
rm -f .gauntlet/recovery/final_cleanup.sh

# Remove the recovery directory itself if empty
rmdir .gauntlet/recovery 2>/dev/null || true 