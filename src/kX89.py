"""Utility for splitting large JSON files into smaller chunks."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

def chunk_json_file(
    input_file: str,
    output_dir: str,
    chunk_size: int = 1000,
    array_field: str = 'vulnerabilities'
) -> List[str]:
    """Split a large JSON file into smaller chunks.
    
    Args:
        input_file: Path to input JSON file
        output_dir: Directory to write chunk files
        chunk_size: Number of items per chunk
        array_field: Name of the array field to split
        
    Returns:
        List of generated chunk file paths
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Get base filename without extension
    base_name = Path(input_file).stem
    
    # Read input file
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Get items to chunk
    items = data.get(array_field, [])
    total_items = len(items)
    
    # Calculate number of chunks
    num_chunks = (total_items + chunk_size - 1) // chunk_size
    
    chunk_files = []
    
    # Create each chunk file
    for i in range(num_chunks):
        start_idx = i * chunk_size
        end_idx = min((i + 1) * chunk_size, total_items)
        
        # Create chunk data with same structure as original
        chunk_data = data.copy()
        chunk_data[array_field] = items[start_idx:end_idx]
        
        # Generate chunk filename
        chunk_file = os.path.join(output_dir, f"{base_name}_chunk_{i+1:03d}.json")
        
        # Write chunk file
        with open(chunk_file, 'w') as f:
            json.dump(chunk_data, f, indent=2)
            
        chunk_files.append(chunk_file)
        
    return chunk_files 