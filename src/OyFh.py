import sys
from pathlib import Path

# Add the parent directory to the system path to allow imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from markdown_utils import run_parsing

if __name__ == "__main__":
    input_directory = 'code-llm-orig'
    output_file = 'findings/code-llm/05-security-misconfigurations.json'
    run_parsing(input_directory, output_file)