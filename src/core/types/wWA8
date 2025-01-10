#!/usr/bin/env python3
"""
Web fetching interface for Cursor/Claude
Fetches web content and stores in a readable cache
"""

import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Constants
CACHE_DIR = Path.home() / ".cache" / "cursor" / "web"
CACHE_INDEX = CACHE_DIR / "index.json"
MAX_CACHE_AGE = 3600  # 1 hour

def setup_cache() -> None:
    """Create cache directory and index if they don't exist"""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if not CACHE_INDEX.exists():
        CACHE_INDEX.write_text("{}")

def url_to_filename(url: str) -> str:
    """Convert URL to a safe filename"""
    return hashlib.sha256(url.encode()).hexdigest()

def load_cache_index() -> Dict:
    """Load the cache index"""
    return json.loads(CACHE_INDEX.read_text())

def save_cache_index(index: Dict) -> None:
    """Save the cache index"""
    CACHE_INDEX.write_text(json.dumps(index, indent=2))

def cache_url(url: str, content: str, title: str) -> str:
    """Cache URL content and return cache path"""
    filename = url_to_filename(url)
    cache_path = CACHE_DIR / filename
    
    # Save content
    cache_path.write_text(content)
    
    # Update index
    index = load_cache_index()
    index[url] = {
        "filename": filename,
        "timestamp": time.time(),
        "title": title
    }
    save_cache_index(index)
    
    return str(cache_path)

def fetch_url(url: str) -> Optional[str]:
    """Fetch URL content, process it, and cache it"""
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = soup.title.string if soup.title else url
        
        # Basic content extraction - can be enhanced
        content = []
        
        # Get main content
        for tag in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            text = tag.get_text().strip()
            if text:
                content.append(text)
        
        processed_content = f"Title: {title}\nURL: {url}\n\n" + "\n\n".join(content)
        return cache_url(url, processed_content, title)
        
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return None

def get_cached_content(url: str) -> Optional[str]:
    """Get cached content if fresh, otherwise fetch"""
    index = load_cache_index()
    if url in index:
        entry = index[url]
        if time.time() - entry["timestamp"] < MAX_CACHE_AGE:
            cache_path = CACHE_DIR / entry["filename"]
            if cache_path.exists():
                return cache_path.read_text()
    
    # Fetch fresh content
    cache_path = fetch_url(url)
    if cache_path:
        return Path(cache_path).read_text()
    return None

def main():
    parser = argparse.ArgumentParser(description="Fetch and cache web content")
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument("--force-refresh", action="store_true", 
                      help="Force refresh cache")
    args = parser.parse_args()
    
    setup_cache()
    
    if args.force_refresh:
        cache_path = fetch_url(args.url)
        if cache_path:
            print(Path(cache_path).read_text())
    else:
        content = get_cached_content(args.url)
        if content:
            print(content)
        else:
            sys.exit(1)

if __name__ == "__main__":
    main() 