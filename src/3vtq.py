"""
Extract SpikyPOVs from text using NLP and heuristics.
A SpikyPOV is a unique, controversial, or non-consensus viewpoint.
"""
import re
from dataclasses import dataclass
from pathlib import Path
import json
import logging
from typing import List, Optional

import spacy
from transformers import pipeline

logger = logging.getLogger(__name__)

@dataclass
class SpikyPOV:
    """A unique and potentially controversial point of view."""
    text: str
    confidence: float  # How confident we are this is a SpikyPOV
    divergence: float  # How much this diverges from consensus
    source_text: str  # Context around the SpikyPOV
    
    def __str__(self):
        return (
            f"SpikyPOV (conf={self.confidence:.2f}, div={self.divergence:.2f}):\n"
            f"  {self.text}\n"
            f"Context:\n  {self.source_text}"
        )

class SpikyPOVExtractor:
    """Extract SpikyPOVs from text."""
    
    def __init__(
        self,
        min_confidence: float = 0.6,
        min_divergence: float = 0.6,
        spacy_model: str = "en_core_web_sm"
    ):
        """Initialize the extractor.
        
        Args:
            min_confidence: Minimum confidence threshold for SpikyPOVs
            min_divergence: Minimum divergence threshold for SpikyPOVs
            spacy_model: spaCy model to use for NLP
        """
        self.min_confidence = min_confidence
        self.min_divergence = min_divergence
        
        # Load NLP models
        logger.info("Loading spaCy model...")
        self.nlp = spacy.load(spacy_model)
        
        logger.info("Loading sentiment analyzer...")
        self.sentiment = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1  # CPU
        )
        
        # Controversial topic keywords
        self.controversial_topics = {
            "gender", "sex", "race", "politics", "religion", "money",
            "class", "power", "inequality", "feminism", "masculinity",
            "dating", "relationships", "marriage", "divorce", "family",
            "technology", "ai", "automation", "climate", "energy",
            "civilization", "culture", "society", "morality", "ethics",
            "truth", "reality", "consciousness", "intelligence", "education",
            "media", "censorship", "freedom", "control", "surveillance",
            "capitalism", "socialism", "democracy", "authority", "hierarchy",
            "evolution", "biology", "science", "progress", "decline",
            "future", "past", "tradition", "innovation", "disruption"
        }
        
        # Phrases indicating strong opinions
        self.opinion_indicators = [
            r"I believe",
            r"In my opinion",
            r"I think",
            r"clearly",
            r"obviously",
            r"certainly",
            r"without doubt",
            r"must be",
            r"has to be",
            r"can't be",
            r"always",
            r"never",
            r"everyone",
            r"no one",
            r"nothing",
            r"everything",
            r"truth is",
            r"fact is",
            r"reality is",
            r"problem is",
            r"real issue",
        ]
        
        # Compile regex patterns
        self.opinion_pattern = re.compile(
            "|".join(rf"\b{p}\b" for p in self.opinion_indicators),
            re.IGNORECASE
        )
    
    async def extract_spikypovs(self, text: str) -> List[SpikyPOV]:
        """Extract SpikyPOVs from text.
        
        Args:
            text: Text to extract SpikyPOVs from
            
        Returns:
            List of SpikyPOV objects
        """
        # Split into sentences
        doc = self.nlp(text)
        sentences = list(doc.sents)
        
        spiky_povs = []
        
        # Process each sentence
        for i, sent in enumerate(sentences):
            sent_text = sent.text.strip()
            if not sent_text:
                continue
                
            # Get context (previous and next sentences)
            context = []
            if i > 0:
                context.append(sentences[i-1].text.strip())
            context.append(sent_text)
            if i < len(sentences)-1:
                context.append(sentences[i+1].text.strip())
            context = " ".join(context)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(sent)
            
            # Calculate divergence score
            divergence = self._calculate_divergence(sent)
            
            # Check if meets thresholds
            if confidence >= self.min_confidence and divergence >= self.min_divergence:
                spiky_povs.append(SpikyPOV(
                    text=sent_text,
                    confidence=confidence,
                    divergence=divergence,
                    source_text=context
                ))
        
        return spiky_povs
    
    def _calculate_confidence(self, sent) -> float:
        """Calculate confidence score for a sentence."""
        score = 0.0
        text = sent.text
        
        # Check for opinion indicators
        if self.opinion_pattern.search(text):
            score += 0.3
            
        # Check sentiment strength
        sentiment = self.sentiment(text)[0]
        score += abs(sentiment["score"] - 0.5) * 0.4
        
        # Check for controversial topics
        tokens = {t.text.lower() for t in sent}
        topic_overlap = tokens.intersection(self.controversial_topics)
        if topic_overlap:
            score += len(topic_overlap) * 0.1
            
        # Cap at 1.0
        return min(score, 1.0)
    
    def _calculate_divergence(self, sent) -> float:
        """Calculate how much a sentence diverges from consensus."""
        score = 0.0
        text = sent.text.lower()
        
        # Strong negations of common beliefs
        negation_patterns = [
            r"not true",
            r"isn't true",
            r"false",
            r"wrong",
            r"incorrect",
            r"myth",
            r"lie",
            r"mistaken",
            r"misunderstood",
            r"contrary to",
            r"unlike",
            r"opposite",
            r"reject",
            r"challenge",
            r"question",
            r"doubt",
            r"skeptical",
            r"controversial",
            r"unpopular",
            r"unconventional",
            r"radical",
            r"revolutionary",
            r"heterodox",
            r"heretical",
            r"taboo",
            r"forbidden",
            r"unspeakable",
            r"unthinkable",
            r"politically incorrect",
            r"against consensus",
        ]
        
        for pattern in negation_patterns:
            if re.search(rf"\b{pattern}\b", text):
                score += 0.2
                
        # Check for controversial claim structure
        claim_patterns = [
            r"actually",
            r"in reality",
            r"truth is",
            r"fact is",
            r"contrary to popular belief",
            r"what most people don't realize",
            r"what they don't tell you",
            r"hidden truth",
            r"real reason",
            r"secret",
            r"conspiracy",
            r"cover[- ]up",
            r"suppressed",
            r"censored",
            r"banned",
        ]
        
        for pattern in claim_patterns:
            if re.search(rf"\b{pattern}\b", text):
                score += 0.15
                
        # Cap at 1.0
        return min(score, 1.0)
    
    def save_spikypovs(
        self,
        spiky_povs: List[SpikyPOV],
        output_dir: Path,
        source_url: Optional[str] = None
    ) -> Path:
        """Save SpikyPOVs to JSON file.
        
        Args:
            spiky_povs: List of SpikyPOV objects to save
            output_dir: Directory to save to
            source_url: Optional source URL
            
        Returns:
            Path to saved file
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename from URL or timestamp
        if source_url:
            filename = re.sub(r'[^\w\-_]', '_', source_url.split('/')[-1])
            filename = f"{filename[:50]}.json"  # Truncate if too long
        else:
            from datetime import datetime
            filename = f"spikypovs_{datetime.now():%Y%m%d_%H%M%S}.json"
            
        output_file = output_dir / filename
        
        # Convert to dict for JSON
        data = {
            "source_url": source_url,
            "spiky_povs": [
                {
                    "text": pov.text,
                    "confidence": pov.confidence,
                    "divergence": pov.divergence,
                    "source_text": pov.source_text
                }
                for pov in spiky_povs
            ]
        }
        
        # Save
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        return output_file

async def test_extractor():
    """Test the SpikyPOV extractor with example text."""
    test_text = """
    Modern society's obsession with technological progress is fundamentally altering human consciousness.
    Research clearly shows that excessive screen time is rewiring our brains, particularly in children.
    While experts claim this is merely an adaptation to new tools, the evidence suggests a deeper transformation.
    
    Traditional religious institutions have failed to address this crisis.
    Churches increasingly embrace secular values and digital culture, abandoning their spiritual foundations.
    Statistical data reveals that 70% of young people find no meaning in conventional religious practice.
    
    The intersection of technology and spirituality represents an unprecedented challenge.
    Digital devices have become our new gods, commanding more attention and devotion than any traditional deity.
    This transformation has profound implications for human development and societal cohesion.
    """
    
    extractor = SpikyPOVExtractor(min_confidence=0.6, min_divergence=0.6)
    
    print("\n=== SpikyPOV Extractor Test ===")
    print("Processing test text...")
    
    spiky_povs = await extractor.extract_spikypovs(test_text)
    
    print(f"\nFound {len(spiky_povs)} SpikyPOVs:")
    for i, pov in enumerate(spiky_povs, 1):
        print(f"\n{i}. {str(pov)}")
    
    # Save results
    output_dir = Path("../../04-SPIKYPOVS/test_results")
    extractor.save_spikypovs(spiky_povs, output_dir)

if __name__ == "__main__":
    asyncio.run(test_extractor()) 