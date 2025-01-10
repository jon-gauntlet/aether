"""
Patristic Faith HTML Parser
"""
from bs4 import BeautifulSoup
from typing import List, Optional, Dict
from dataclasses import dataclass
import aiohttp
import asyncio
from datetime import datetime
import logging
from urllib.parse import urljoin

@dataclass
class PatristicArticle:
    """Represents a single article from Patristic Faith."""
    title: str
    url: str
    author: str
    date: datetime
    content: str
    categories: List[str]
    summary: str
    related_articles: List[str]

class PatristicParser:
    """Parser for Patristic Faith website content."""
    
    def __init__(self, base_url: str = "https://patristicfaith.com"):
        self.base_url = base_url
        self.logger = logging.getLogger(__name__)

    def parse_article_card(self, card: BeautifulSoup) -> Optional[Dict[str, str]]:
        """Parse an article card from the category/listing page."""
        try:
            # Article cards have specific structure we observed
            title_elem = card.find("h3")
            if not title_elem:
                return None
                
            title = title_elem.text.strip()
            link = title_elem.find("a")
            url = urljoin(self.base_url, link["href"]) if link else None
            author = card.find("span", class_="author").text.strip()
            
            return {
                "title": title,
                "url": url,
                "author": author
            }
        except Exception as e:
            self.logger.error(f"Error parsing article card: {e}")
            return None

    def parse_article_content(self, soup: BeautifulSoup) -> Optional[PatristicArticle]:
        """Parse a full article page."""
        try:
            # Main article content
            article = soup.find("article")
            if not article:
                return None

            # Extract key elements
            title = article.find("h1").text.strip()
            author = article.find("span", class_="author").text.strip()
            date_str = article.find("time")["datetime"]
            date = datetime.fromisoformat(date_str)
            
            # Get content
            content_div = article.find("div", class_="content")
            content = content_div.get_text(separator="\n", strip=True)
            
            # Get categories
            categories = [
                cat.text.strip() 
                for cat in article.find_all("a", class_="category")
            ]
            
            # Get summary (first paragraph)
            summary = content_div.find("p").text.strip()
            
            # Get related articles
            related = [
                urljoin(self.base_url, a["href"])
                for a in article.find_all("a", class_="related-article")
            ]
            
            return PatristicArticle(
                title=title,
                url=article.find("link", rel="canonical")["href"],
                author=author,
                date=date,
                content=content,
                categories=categories,
                summary=summary,
                related_articles=related
            )
        except Exception as e:
            self.logger.error(f"Error parsing article content: {e}")
            return None

    def parse_category_page(self, soup: BeautifulSoup) -> List[Dict[str, str]]:
        """Parse a category listing page."""
        articles = []
        
        # Find all article cards
        cards = soup.find_all("div", class_="article-card")
        
        for card in cards:
            article_data = self.parse_article_card(card)
            if article_data:
                articles.append(article_data)
                
        return articles

async def main():
    """Example usage."""
    async with aiohttp.ClientSession() as session:
        parser = PatristicParser()
        
        # Example: Fetch and parse a category page
        url = "https://patristicfaith.com/theology"
        async with session.get(url) as response:
            if response.status == 200:
                html = await response.text()
                soup = BeautifulSoup(html, 'lxml')
                articles = parser.parse_category_page(soup)
                print(f"Found {len(articles)} articles")
                
                # Example: Fetch and parse first article
                if articles:
                    article_url = articles[0]["url"]
                    async with session.get(article_url) as article_response:
                        if article_response.status == 200:
                            article_html = await article_response.text()
                            article_soup = BeautifulSoup(article_html, 'lxml')
                            article = parser.parse_article_content(article_soup)
                            if article:
                                print(f"Parsed article: {article.title}")
                                print(f"Categories: {article.categories}")
                                print(f"Summary: {article.summary[:200]}...")

if __name__ == "__main__":
    asyncio.run(main()) 