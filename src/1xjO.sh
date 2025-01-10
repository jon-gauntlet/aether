#!/bin/bash

# Simple Gauntlet Setup
# Makes everything "just work" while staying out of your way

# Colors (can be disabled with NO_COLOR=1)
[[ -z "$NO_COLOR" ]] && {
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    NC='\033[0m'
}

# Paths
SCRIPTS_DIR="$HOME/scripts"
LOCAL_BIN="$HOME/.local/bin"
DATA_DIR="$HOME/.local/share/gauntlet"
BRAINLIFT_DIR="$HOME/brainlifts"

# Create directories quietly
mkdir -p "$LOCAL_BIN" "$DATA_DIR" 2>/dev/null

# Install timer and focus check
for script in automation/gauntlet-timer.sh monitoring/focus-check.sh; do
    name=$(basename "$script" .sh)
    target="$LOCAL_BIN/${name/gauntlet-/g}"
    cp "$SCRIPTS_DIR/$script" "$target" 2>/dev/null
    chmod +x "$target" 2>/dev/null
done

# Add simple aliases if they don't exist
for rc in ".bashrc" ".zshrc"; do
    [[ -f "$HOME/$rc" ]] && {
        grep -q "alias gtimer" "$HOME/$rc" || {
            echo '# Gauntlet shortcuts (disable by removing)' >> "$HOME/$rc"
            echo 'alias gt="gtimer"        # Quick timer' >> "$HOME/$rc"
            echo 'alias gf="focus-check"   # Quick focus check' >> "$HOME/$rc"
            echo 'alias gb="cd ~/brainlifts && ls -t" # Quick BrainLift access' >> "$HOME/$rc"
        }
    }
done

# Create BrainLift directory only if user wants it
[[ ! -d "$BRAINLIFT_DIR" ]] && {
    echo -e "${BLUE}Enable BrainLift tracking? (optional) [y/N]${NC}"
    read -r -n 1 enable_brainlift
    [[ ${enable_brainlift,,} == "y" ]] && {
        mkdir -p "$BRAINLIFT_DIR"
        echo -e "\n${GREEN}✓ BrainLift enabled at ~/brainlifts${NC}"
    }
}

# Print minimal success message
echo -e "${GREEN}✓ Ready!${NC}"
echo -e "${BLUE}Try: gt 25${NC}  # 25min focus block" 