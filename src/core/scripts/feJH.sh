#!/bin/bash

# AI-First Development Codebase Indexer
# Optimizes codebase for AI tools and maintains index

set -euo pipefail

# Configuration
WORKSPACE_DIR="/home/jon/workspace"
INDEX_DIR="/home/jon/.cursor/index"
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    "*.pyc"
    "__pycache__"
    "*.log"
    "build"
    "dist"
    "*.min.js"
    "*.min.css"
    "venv"
    ".env"
)

# Create exclude pattern for ripgrep
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --glob '!$pattern'"
done

# Ensure directories exist
mkdir -p "$INDEX_DIR"
mkdir -p "$WORKSPACE_DIR"

# Index source files
echo "Indexing source files..."
eval "rg --files $EXCLUDE_ARGS $WORKSPACE_DIR" > "$INDEX_DIR/files.list"

# Generate ctags
echo "Generating ctags..."
ctags --fields=+l --extras=+F -L "$INDEX_DIR/files.list" -f "$INDEX_DIR/tags" 2>/dev/null || true

# Generate file type statistics
echo "Generating file statistics..."
{
    echo "File type statistics:"
    echo "--------------------"
    find "$WORKSPACE_DIR" -type f -name "*.*" | grep -v -E "$(IFS=\|; echo "${EXCLUDE_PATTERNS[*]}")" | sed 's/.*\.//' | sort | uniq -c | sort -nr
} > "$INDEX_DIR/stats.txt"

# Create workspace symlinks for quick access
echo "Creating workspace symlinks..."
mkdir -p "$WORKSPACE_DIR/.cursor"
ln -sf "$INDEX_DIR/files.list" "$WORKSPACE_DIR/.cursor/files.list"
ln -sf "$INDEX_DIR/tags" "$WORKSPACE_DIR/.cursor/tags"
ln -sf "$INDEX_DIR/stats.txt" "$WORKSPACE_DIR/.cursor/stats.txt"

# Generate project-wide search index
echo "Generating search index..."
{
    echo "# Project Search Index"
    echo "Last updated: $(date)"
    echo
    echo "## File Structure"
    tree -L 3 --dirsfirst "$WORKSPACE_DIR" 2>/dev/null || true
    echo
    echo "## Important Files"
    find "$WORKSPACE_DIR" -type f -name "*.json" -o -name "*.yaml" -o -name "*.toml" -o -name "*.md" | grep -v -E "$(IFS=\|; echo "${EXCLUDE_PATTERNS[*]}")" || true
    echo
    echo "## Dependencies"
    {
        find "$WORKSPACE_DIR" -name "package.json" -exec cat {} \; 2>/dev/null | jq -r '.dependencies, .devDependencies | to_entries[] | .key' 2>/dev/null || true
        find "$WORKSPACE_DIR" -name "requirements.txt" -exec cat {} \; 2>/dev/null || true
        find "$WORKSPACE_DIR" -name "pyproject.toml" -exec cat {} \; 2>/dev/null || true
    } | sort -u
} > "$INDEX_DIR/project_index.md"

# Create .gitignore if it doesn't exist
if [ ! -f "$WORKSPACE_DIR/.gitignore" ]; then
    cat > "$WORKSPACE_DIR/.gitignore" << EOF
# Generated files
.cursor/
*.pyc
__pycache__/
*.so
*.dylib
*.dll
*.class
*.jar
*.war
*.ear
*.log
.env
.venv/
venv/
ENV/
node_modules/
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp
*.swo
*~
EOF
fi

# Set up git hooks for auto-indexing
mkdir -p "$WORKSPACE_DIR/.git/hooks"
cat > "$WORKSPACE_DIR/.git/hooks/post-commit" << 'EOF'
#!/bin/bash
/home/jon/scripts/index_codebase.sh
EOF
chmod +x "$WORKSPACE_DIR/.git/hooks/post-commit"

# Optimize for Cursor
echo "Optimizing for Cursor..."
{
    echo "# Cursor Project Configuration"
    echo "editor.formatOnSave: true"
    echo "editor.defaultFormatter: null"
    echo "files.autoSave: afterDelay"
    echo "files.autoSaveDelay: 1000"
    echo "search.exclude:"
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        echo "  \"**/$pattern\": true"
    done
} > "$WORKSPACE_DIR/.cursor.yaml"

echo "Codebase indexing complete" 