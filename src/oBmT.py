"""Utility for splitting large JSON files into smaller chunks."""

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

def chunk_json_file(
    input_file: str,
    output_dir: str,
    chunk_size: int = 1000,
    array_field: Optional[str] = 'vulnerabilities'
) -> List[str]:
    """Split a large JSON file into smaller chunks.
    
    Args:
        input_file: Path to input JSON file
        output_dir: Directory to write chunk files
        chunk_size: Number of items per chunk
        array_field: Name of the array field to split, or None if root is array
        
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
    
    # Handle different file structures
    if isinstance(data, list):
        if data and isinstance(data[0], dict) and array_field in data[0]:
            # Structure: [{vulnerabilities: [...]}, ...]
            items = data[0].get(array_field, [])
        else:
            # Structure: [...]
            items = data
    elif isinstance(data, dict):
        if array_field in data:
            # Structure: {vulnerabilities: [...]}
            items = data.get(array_field, [])
        elif 'runs' in data:
            # Structure: {runs: [{results: [...]}]}
            items = data['runs'][0].get('results', [])
        else:
            raise ValueError(f"Unsupported structure in {input_file}")
    else:
        raise ValueError(f"Expected list or dict, got {type(data)}")
        
    total_items = len(items)
    if total_items == 0:
        return []
    
    # Calculate number of chunks
    num_chunks = (total_items + chunk_size - 1) // chunk_size
    
    chunk_files = []
    
    # Create each chunk file
    for i in range(num_chunks):
        start_idx = i * chunk_size
        end_idx = min((i + 1) * chunk_size, total_items)
        
        # Create chunk data with same structure as original
        if isinstance(data, list):
            if data and isinstance(data[0], dict) and array_field in data[0]:
                chunk_data = data.copy()
                chunk_data[0] = chunk_data[0].copy()
                chunk_data[0][array_field] = items[start_idx:end_idx]
            else:
                chunk_data = items[start_idx:end_idx]
        else:
            chunk_data = data.copy()
            if array_field in data:
                chunk_data[array_field] = items[start_idx:end_idx]
            elif 'runs' in data:
                chunk_data['runs'] = [data['runs'][0].copy()]
                chunk_data['runs'][0]['results'] = items[start_idx:end_idx]
        
        # Generate chunk filename
        chunk_file = os.path.join(output_dir, f"{base_name}_chunk_{i+1:03d}.json")
        
        # Write chunk file
        with open(chunk_file, 'w') as f:
            json.dump(chunk_data, f, indent=2)
            
        chunk_files.append(chunk_file)
        
    return chunk_files 