"""Script to chunk large findings files."""

import os
from pathlib import Path

from scripts.etl.utils.file_chunker import chunk_json_file

def main():
    """Main entry point."""
    # Set up paths
    base_dir = Path(__file__).parent.parent.parent
    findings_dir = base_dir / 'findings'
    
    # Process Snyk test file
    snyk_file = findings_dir / 'sast' / 'snyk-test.json'
    if snyk_file.exists():
        chunk_dir = findings_dir / 'sast' / 'snyk-test-chunks'
        print(f"Chunking {snyk_file} into {chunk_dir}")
        chunk_files = chunk_json_file(str(snyk_file), str(chunk_dir))
        print(f"Created {len(chunk_files)} chunk files")
        
    # Process Snyk code test file
    snyk_code_file = findings_dir / 'sast' / 'snyk-code-test.json'
    if snyk_code_file.exists():
        chunk_dir = findings_dir / 'sast' / 'snyk-code-test-chunks'
        print(f"Chunking {snyk_code_file} into {chunk_dir}")
        chunk_files = chunk_json_file(str(snyk_code_file), str(chunk_dir))
        print(f"Created {len(chunk_files)} chunk files")

if __name__ == '__main__':
    main() 