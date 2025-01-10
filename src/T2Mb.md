# System Context

## Hardware
- Device: Thinkpad E16
- Serial: PF-4W4A69
- Architecture: x86_64

## Operating System
- Distribution: EndeavourOS (Arch-based)
- Desktop Environment: KDE Plasma
- Terminal Emulator: Konsole
- Shell: zsh 5.9
- Display Server: X11/Wayland (please specify which you're using)

## Development Environment
- oh-my-zsh
- Terminal: Konsole
- Editor: Cursor
- Workspace Path: /home/jon/projects/chatgenius

## Key Configuration Files
- Shell Config: ~/.zshrc
- ZSH Custom Dir: ~/.oh-my-zsh/custom
- Completion Path: /usr/share/zsh/site-functions

## Important Paths
- Projects: ~/projects
- Workspace: ~/workspace
- Local Bin: ~/.local/bin
- Scripts: ~/scripts

## Package Management
- Primary: pacman (Arch)
- AUR Helper: yay
- Python: poetry
- Node: npm

## Core Principles

### 1. DRY (Don't Repeat Yourself)
- Every piece of knowledge must have a single, unambiguous, authoritative representation
- Applies to:
  - Code: Use functions, classes, and modules for reusability
  - Documentation: Single source of truth, link don't copy
  - Configuration: Use templates and inheritance
  - Knowledge: Centralize and reference, don't duplicate
- Implementation:
  - Use LLMs to identify and refactor duplicated patterns
  - Maintain central knowledge bases
  - Create reusable templates and snippets
  - Automate repetitive tasks

### 2. Eliminate Toil
- Definition: Manual, repetitive work that can be automated
- Target areas:
  - Manual troubleshooting: Use LLMs and automation
  - Reading source code: Let LLMs analyze and summarize
  - Documentation parsing: Automated extraction of key points
  - Repetitive debugging: Automated diagnosis
  - Configuration management: Templates and generators
- Implementation:
  - LLMs for code analysis and generation
  - Automated testing and validation
  - Smart completion and suggestions
  - Context-aware tooling
  - Workflow automation
- Benefits:
  - Preserve mental energy
  - Maintain flow states
  - Focus on creative work
  - Reduce frustration
  - Increase productivity

## Infrastructure Self-Improvement

### Data Collection Points
- `~/.local/bin/cursor/deep`: Flow state periods
- `~/.local/bin/cursor/brain`: Learning patterns
- `~/.local/bin/cursor/flow`: Productivity cycles
- `~/.local/bin/cursor/timer`: Work/rest rhythms
- `~/.local/bin/cursor/note`: Insight capture

### Improvement Vectors
1. **Context Enhancement**
   - Pattern recognition from tool usage
   - Automatic context refinement
   - Knowledge base expansion

2. **Automation Optimization**
   - Workflow pattern detection
   - Task automation opportunities
   - Toil elimination targets

3. **Integration Points**
   - Tool usage logs -> Pattern analysis
   - Insights -> Context updates
   - Patterns -> Automation rules

### Implementation Notes
- All tools should log to `~/.cache/cursor/logs/`
- Patterns stored in `~/.context/patterns/`
- Improvements tracked in `~/.context/improvements/`
- Analysis results in `~/.context/analysis/`

### Future Improvements
[AI: Update this section based on observed patterns]
- Pattern categories identified
- Automation opportunities found
- Context refinements needed
- Integration points discovered

---
Note: This section is specifically for AI self-improvement of the infrastructure. 
Human interaction should not be required for these optimizations.

## Notes
- Running KDE Plasma desktop environment
- Using Konsole as terminal emulator
- zsh with oh-my-zsh as shell
- Heavy focus on AI development and automation
- Optimized for long coding sessions (80-100 hours/week)
- ADHD-optimized workflow

## Common Issues
- Tab completion in zsh needs tuning
- (Add other recurring issues here)

## Custom Tools
- ~/.local/bin/cursor/deep - Deep work mode
- ~/.local/bin/cursor/note - Quick notes
- ~/.local/bin/cursor/brain - BrainLifts management
- ~/.local/bin/cursor/stats - Progress tracking
- ~/.local/bin/cursor/flow - Hyperfocus optimization
- ~/.local/bin/cursor/timer - Session timing 