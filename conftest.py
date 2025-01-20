import os
import sys
from pathlib import Path

# Get the absolute path to the project root
root_dir = Path(__file__).parent
src_dir = root_dir / "src"

# Add the src directory to the Python path
sys.path.insert(0, str(src_dir))
sys.path.insert(0, str(root_dir)) 