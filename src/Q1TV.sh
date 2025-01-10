#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
        return 0
    fi
}

recreate_structure() {
    print_header "Recreating Repository Structure"
    
    # Core directories
    directories=(
        "practice/easy"
        "practice/medium"
        "practice/hard"
        "practice/templates/array"
        "practice/templates/dp"
        "practice/templates/graph"
        "practice/templates/string"
        "practice/templates/tree"
        "learn/concepts"
        "learn/implementations"
        "learn/visualizations"
        "review/flashcards"
        "review/cheatsheets"
        "review/summaries"
        "quiz/mock_tests"
        "quiz/results"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        echo -e "${GREEN}✓ Created $dir${NC}"
    done
}

gather_requirements() {
    print_header "Gathering Python Requirements"
    
    if [ -f "consolidated_requirements.txt" ]; then
        echo -e "${GREEN}✓ Requirements file exists${NC}"
    else
        echo -e "${YELLOW}! Recreating requirements file${NC}"
        cat > consolidated_requirements.txt << EOL
# Core Data Science and Computation
numpy
pandas
scipy

# Visualization
matplotlib
seaborn

# Testing and Development
pytest
pytest-timeout
pytest-watch
pytest-benchmark
pytest-cov
black
pylint
ipython
mypy

# Data Structures and Algorithms
sortedcontainers
more-itertools

# Interactive Development
jupyter
ipywidgets
ipdb

# Utilities
tqdm
memory-profiler
python-dotenv
rich
typer
pydantic
pre-commit
EOL
        echo -e "${GREEN}✓ Created consolidated_requirements.txt${NC}"
    fi
}

setup_environment() {
    print_header "Setting Up Python Environment"
    
    # Check Python installation
    check_command "python" || return 1
    check_command "pip" || return 1
    
    # Create virtual environment if needed
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    if [ -f "consolidated_requirements.txt" ]; then
        echo "Installing requirements..."
        pip install -r consolidated_requirements.txt
    fi
}

download_resources() {
    print_header "Downloading Essential Resources"
    
    # Create temporary directory for downloads
    mkdir -p .tmp_downloads
    
    # List of essential resources
    resources=(
        "https://raw.githubusercontent.com/TheAlgorithms/Python/master/searches/binary_search.py:practice/templates/binary_search_template.py"
        "https://raw.githubusercontent.com/TheAlgorithms/Python/master/graphs/breadth_first_search.py:practice/templates/bfs_template.py"
        "https://raw.githubusercontent.com/TheAlgorithms/Python/master/graphs/depth_first_search.py:practice/templates/dfs_template.py"
    )
    
    # Download each resource
    for resource in "${resources[@]}"; do
        IFS=':' read -r url dest <<< "$resource"
        echo "Downloading $(basename $dest)..."
        curl -s "$url" -o "$dest"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Downloaded $(basename $dest)${NC}"
        else
            echo -e "${RED}❌ Failed to download $(basename $dest)${NC}"
        fi
    done
    
    # Cleanup
    rm -rf .tmp_downloads
}

main() {
    print_header "Starting Repository Recovery"
    
    # Check if we're in the right directory
    if [ ! -f "README.md" ]; then
        echo -e "${RED}❌ Please run this script from the repository root${NC}"
        exit 1
    fi
    
    # Run recovery steps
    recreate_structure
    gather_requirements
    setup_environment
    download_resources
    
    print_header "Recovery Complete"
    echo -e "${GREEN}✓ Repository structure restored${NC}"
    echo -e "${GREEN}✓ Requirements gathered${NC}"
    echo -e "${GREEN}✓ Environment setup${NC}"
    echo -e "${GREEN}✓ Resources downloaded${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Run tests: pytest"
    echo "2. Check interactive problems: python practice/templates/interactive_problems.py"
    echo "3. Take a mock test: python practice/templates/mock_test.py"
}

# Run main function
main 