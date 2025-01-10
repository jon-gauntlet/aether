#!/bin/bash
mkdir -p src/core/{patterns,hooks,types,context,autonomic,flow,integration,energy} src/components
HISTORY_DIR="/home/jon/.config/Cursor/User/History"
for dir in "$HISTORY_DIR"/*; do if [ -d "$dir" ]; then latest=$(find "$dir" -type f -name "*.ts*" -printf "%T@ %p
" | sort -n | tail -n 1 | cut -f2- -d" "); if [ ! -z "$latest" ]; then first_line=$(head -n 1 "$latest" 2>/dev/null); if [[ "$first_line" == *"src/"* ]]; then orig_path=$(echo "$first_line" | grep -o "src/.*\.[tj]sx\?"); if [ ! -z "$orig_path" ]; then echo "Recovering $orig_path"; cp "$latest" "$orig_path"; fi; fi; fi; fi; done
