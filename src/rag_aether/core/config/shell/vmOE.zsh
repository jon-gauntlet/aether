export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"

# Terminal type configuration for Konsole
export TERM="xterm-256color"
[[ $TMUX != "" ]] && export TERM="screen-256color"

# Add zsh completion paths
fpath=(
    /usr/share/zsh/site-functions
    /usr/share/zsh/$ZSH_VERSION/functions
    /usr/share/zsh/functions/Calendar
    /usr/share/zsh/functions/Chpwd
    /usr/share/zsh/functions/Completion
    /usr/share/zsh/functions/Completion/Unix
    /usr/share/zsh/functions/Completion/Linux
    /usr/share/zsh/functions/Completion/X
    /usr/share/zsh/functions/Completion/Zsh
    $fpath
)

# Basic ZSH configuration
setopt AUTO_CD              # cd by typing directory name
setopt EXTENDED_GLOB        # Extended globbing
setopt NOTIFY              # Report status of background jobs immediately
setopt PROMPT_SUBST        # Enable parameter expansion in prompts

# History configuration
HISTSIZE=50000
SAVEHIST=50000
setopt EXTENDED_HISTORY    # Write format
setopt HIST_VERIFY        # Don't execute immediately upon history expansion
setopt SHARE_HISTORY      # Share command history data

# Initialize completion system
autoload -Uz compinit
compinit

# Load completion system
zmodload zsh/complist

# Basic completion settings
setopt AUTO_LIST          # List choices on ambiguous completion
setopt AUTO_MENU         # Use menu completion after the second consecutive request
setopt COMPLETE_IN_WORD  # Complete from both ends of a word
setopt ALWAYS_TO_END     # Move cursor to end of word on completion

# Simple completion style
zstyle ':completion:*' completer _complete _expand
zstyle ':completion:*' menu select
zstyle ':completion:*' list-colors ''
zstyle ':completion:*' matcher-list '' 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*:cd:*' tag-order local-directories directory-stack path-directories

# Load plugins and oh-my-zsh
plugins=(git zsh-autosuggestions zsh-syntax-highlighting history-substring-search kubectl docker npm)
source $ZSH/oh-my-zsh.sh

export GAUNTLET_START="2024-01-06"
export WORK_HOURS=100
export EDITOR="vim"
export PATH="$HOME/.local/bin/cursor:$PATH"

# Your existing aliases and functions
alias deep='~/.local/bin/cursor/deep'      # Toggle deep work mode
alias note='~/.local/bin/cursor/note'      # Quick note/insight capture
alias brain='~/.local/bin/cursor/brain'    # Manage BrainLifts
alias stats='~/.local/bin/cursor/stats'    # Show progress
alias flow='~/.local/bin/cursor/flow'      # Optimize for hyperfocus

# Your existing functions
timer() {
    if [[ "$0" == "-zsh" ]]; then
        command ~/.local/bin/cursor/timer "$@"
    fi
}

focus() {
    if [[ "$0" == "-zsh" ]]; then
        deep && flow
    fi
}

break() {
    if [[ "$0" == "-zsh" ]]; then
        command ~/.local/bin/cursor/timer 5
    fi
}

pomodoro() {
    if [[ "$0" == "-zsh" ]]; then
        command ~/.local/bin/cursor/timer 25
    fi
}

check() {
    if [[ "$0" == "-zsh" ]]; then
        stats && health
    fi
}

# Git aliases
alias gs='git status'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
alias gd='git diff'

# System aliases
alias update='sudo pacman -Syu'
alias clean='sudo paccache -rk1 && poetry cache clear --all pypi'
alias optimize='sudo cpupower frequency-set -g performance'
alias health='~/workspace/gauntlet/scripts/health_check.sh'
alias maintain='~/workspace/gauntlet/scripts/daily_maintenance.sh'
alias mstatus='~/workspace/gauntlet/scripts/maintenance_status.sh'

# Development aliases
alias format='poetry run black . && poetry run isort .'
alias lint='poetry run pylint'
alias types='poetry run mypy'
alias test='poetry run pytest'
alias benchmark='poetry run pytest --benchmark-only'
alias profile='poetry run python -m cProfile -o profile.stats'
alias analyze='poetry run python -m pstats profile.stats'
alias memory='poetry run memory_profiler'

# Node aliases
alias ndev='npm run dev'
alias nbuild='npm run build'
alias ntest='npm run test'
alias nlint='npm run lint'
alias nformat='npm run format'

# Monitoring aliases
alias gpu='nvtop'
alias cpu='btop'
alias temp='sensors | grep "Core"'
alias gpu-stats='nvidia-smi -l 1'
alias cpu-stats='btop'

# Project navigation
alias gauntlet='cd ~/workspace/gauntlet && poetry shell'
alias models='cd ~/workspace/gauntlet/models'
alias data='cd ~/workspace/gauntlet/data'
alias experiments='cd ~/workspace/gauntlet/experiments'
alias notebooks='cd ~/workspace/gauntlet/notebooks'
alias fast='cd /mnt/ramdisk'

# Development environment
alias dev='tmux new-session -A -s dev'
alias jupyter='poetry run jupyter lab --no-browser'
alias tensorboard='poetry run tensorboard --logdir logs'
alias notebook='poetry run jupyter lab'

# Clipboard handling
if command -v xclip >/dev/null 2>&1; then
    alias pbcopy='xclip -selection clipboard'
    alias pbpaste='xclip -selection clipboard -o'
elif command -v xsel >/dev/null 2>&1; then
    alias pbcopy='xsel --clipboard --input'
    alias pbpaste='xsel --clipboard --output'
fi 