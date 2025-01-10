"""Utility for chunking large JSON files."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

def chunk_json_file(
    input_file: str,
    output_dir: str,
    chunk_size: int = 1000,
    array_field: str = 'vulnerabilities'
) -> None:
    """Split a large JSON file into smaller chunks.
    
    Args:
        input_file: Path to input JSON file
        output_dir: Directory to write chunks to
        chunk_size: Number of items per chunk
        array_field: Name of array field to split
    """
    # Create output directory if needed
    os.makedirs(output_dir, exist_ok=True)
    
    # Load input file
    with open(input_file, 'r') as f:
        data = json.load(f)
        
    # Get array to split
    items = data.get(array_field, [])
    if not items:
        return
        
    # Split into chunks
    chunks = [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]
    
    # Write chunks
    base_name = Path(input_file).stem
    for i, chunk in enumerate(chunks, 1):
        output_file = os.path.join(output_dir, f"{base_name}_chunk_{i:03d}.json")
        
        # Preserve parent object structure
        chunk_data = data.copy()
        chunk_data[array_field] = chunk
        
        with open(output_file, 'w') as f:
            json.dump(chunk_data, f, indent=2) 