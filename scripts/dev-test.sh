#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
FOCUS=""
WATCH=false
QUICK=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --focus=*) FOCUS="${1#*=}" ;;
        --watch) WATCH=true ;;
        --quick) QUICK=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to run Python tests
run_python_tests() {
    local args=""
    if [ ! -z "$FOCUS" ]; then
        args="--focus=$FOCUS"
    fi
    if [ "$QUICK" = true ]; then
        args="$args --quick"
    fi
    poetry run pytest $args
}

# Function to run JS tests
run_js_tests() {
    local args=""
    if [ ! -z "$FOCUS" ]; then
        args="--testNamePattern=$FOCUS"
    fi
    npm test -- $args
}

# Watch mode
if [ "$WATCH" = true ]; then
    echo -e "${BLUE}🔄 Starting watch mode...${NC}"
    if [ ! -z "$FOCUS" ]; then
        echo -e "${BLUE}Focusing on: $FOCUS${NC}"
    fi
    
    # Use nodemon to watch both Python and JS files
    npx nodemon --exec "./scripts/dev-test.sh $([ ! -z "$FOCUS" ] && echo "--focus=$FOCUS") $([ "$QUICK" = true ] && echo "--quick")" \
        --ext "py,js,jsx" \
        --watch "src/" \
        --watch "tests/"
    exit 0
fi

# Single run mode
echo -e "${BLUE}🚀 Running tests...${NC}"
if [ ! -z "$FOCUS" ]; then
    echo -e "${BLUE}Focusing on: $FOCUS${NC}"
fi

# Run tests based on focus
if [[ "$FOCUS" == *".py"* ]] || [[ "$FOCUS" == "py"* ]]; then
    run_python_tests
elif [[ "$FOCUS" == *".js"* ]] || [[ "$FOCUS" == "js"* ]]; then
    run_js_tests
else
    # Run both if no specific focus
    run_python_tests && run_js_tests
fi

# Exit with the last command's status
exit $? 