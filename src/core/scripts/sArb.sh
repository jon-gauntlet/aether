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
import logging
from pathlib import Path
from typing import Dict, Optional
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler(Path.home() / '.cache' / 'cursor' / 'web-fetch.log')
    ]
)
logger = logging.getLogger(__name__)

# Constants
CACHE_DIR = Path.home() / ".cache" / "cursor" / "web"
CACHE_INDEX = CACHE_DIR / "index.json"
MAX_CACHE_AGE = 3600  # 1 hour

def setup_cache() -> None:
    """Create cache directory and index if they don't exist"""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        if not CACHE_INDEX.exists():
            CACHE_INDEX.write_text("{}")
        logger.info(f"Cache directory setup at {CACHE_DIR}")
    except Exception as e:
        logger.error(f"Failed to setup cache: {e}")
        raise

def url_to_filename(url: str) -> str:
    """Convert URL to a safe filename"""
    return hashlib.sha256(url.encode()).hexdigest()

def load_cache_index() -> Dict:
    """Load the cache index"""
    try:
        return json.loads(CACHE_INDEX.read_text())
    except Exception as e:
        logger.error(f"Failed to load cache index: {e}")
        return {}

def save_cache_index(index: Dict) -> None:
    """Save the cache index"""
    try:
        CACHE_INDEX.write_text(json.dumps(index, indent=2))
        logger.debug("Cache index updated")
    except Exception as e:
        logger.error(f"Failed to save cache index: {e}")
        raise

def cache_url(url: str, content: str, title: str) -> str:
    """Cache URL content and return cache path"""
    try:
        filename = url_to_filename(url)
        cache_path = CACHE_DIR / filename
        
        # Save content
        cache_path.write_text(content)
        logger.debug(f"Content cached to {cache_path}")
        
        # Update index
        index = load_cache_index()
        index[url] = {
            "filename": filename,
            "timestamp": time.time(),
            "title": title
        }
        save_cache_index(index)
        
        return str(cache_path)
    except Exception as e:
        logger.error(f"Failed to cache URL {url}: {e}")
        raise

def fetch_url(url: str) -> Optional[str]:
    """Fetch URL content, process it, and cache it"""
    try:
        logger.info(f"Fetching URL: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        logger.debug(f"Got response: {response.status_code}")
        
        soup = BeautifulSoup(response.text, 'html.parser')
        logger.debug(f"Parsed HTML content: {len(response.text)} bytes")
        
        # Extract title
        title = soup.title.string if soup.title else url
        logger.debug(f"Found title: {title}")
        
        # Basic content extraction - can be enhanced
        content = []
        
        # Get main content
        for tag in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article']):
            text = tag.get_text().strip()
            if text:
                content.append(text)
        
        logger.debug(f"Extracted {len(content)} content blocks")
        
        processed_content = f"Title: {title}\nURL: {url}\n\n" + "\n\n".join(content)
        logger.debug(f"Processed content length: {len(processed_content)}")
        
        return cache_url(url, processed_content, title)
        
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return None

def get_cached_content(url: str) -> Optional[str]:
    """Get cached content if fresh, otherwise fetch"""
    try:
        index = load_cache_index()
        if url in index:
            entry = index[url]
            if time.time() - entry["timestamp"] < MAX_CACHE_AGE:
                cache_path = CACHE_DIR / entry["filename"]
                if cache_path.exists():
                    logger.info(f"Using cached content for {url}")
                    return cache_path.read_text()
        
        logger.info(f"Cache miss for {url}, fetching fresh content")
        # Fetch fresh content
        cache_path = fetch_url(url)
        if cache_path:
            return Path(cache_path).read_text()
        return None
    except Exception as e:
        logger.error(f"Error getting cached content for {url}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Fetch and cache web content")
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument("--force-refresh", action="store_true", 
                      help="Force refresh cache")
    parser.add_argument("--debug", action="store_true",
                      help="Enable debug output")
    args = parser.parse_args()
    
    if args.debug:
        logger.setLevel(logging.DEBUG)
    
    try:
        setup_cache()
        
        if args.force_refresh:
            logger.info("Forcing cache refresh")
            cache_path = fetch_url(args.url)
            if cache_path:
                print(Path(cache_path).read_text())
            else:
                sys.exit(1)
        else:
            content = get_cached_content(args.url)
            if content:
                print(content)
            else:
                sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 