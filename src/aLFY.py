import sys
from pathlib import Path
import json
# Add the parent directory to the system path to allow imports
sys.path.append(str(Path(__file__).resolve().parent.parent))

from markdown_utils import parse_markdown_file

if __name__ == "__main__":
    # Use a specific Markdown file for testing
    test_file = 'findings/claude-3.5-sonnet/05-security-misconfigurations/default-or-weak-passwords.md'
    
    # Parse the specific Markdown file
    finding = parse_markdown_file(test_file)
    
    # Print the result to verify the output
    print(json.dumps(finding, indent=4))