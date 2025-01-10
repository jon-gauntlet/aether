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
    snyk_test_file = findings_dir / 'sast' / 'snyk-test.json'
    snyk_test_chunks_dir = findings_dir / 'sast' / 'snyk-test-chunks'
    if snyk_test_file.exists():
        chunk_json_file(str(snyk_test_file), str(snyk_test_chunks_dir))
        
    # Process Snyk code test file
    snyk_code_file = findings_dir / 'sast' / 'snyk-code-test.json'
    snyk_code_chunks_dir = findings_dir / 'sast' / 'snyk-code-test-chunks'
    if snyk_code_file.exists():
        chunk_json_file(str(snyk_code_file), str(snyk_code_chunks_dir))
        
if __name__ == '__main__':
    main() 