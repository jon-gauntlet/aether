"""
Test SpikyPOV Extraction
"""
import asyncio
import logging
from extract_spikypovs import POVExtractor
import json
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def test_extraction(writer: str):
    """Test extraction pipeline on a specific writer."""
    
    # Create output directory
    output_dir = Path("../../04-SPIKYPOVS") / writer
    output_dir.mkdir(parents=True, exist_ok=True)
    
    async with POVExtractor() as extractor:
        try:
            logger.info(f"Starting extraction for {writer}")
            povs = await extractor.extract_povs_from_writer(writer)
            
            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = output_dir / f"povs_{timestamp}.json"
            
            # Convert to JSON-serializable format
            pov_data = []
            for pov in povs:
                pov_dict = {
                    "title": pov.title,
                    "consensus_view": pov.consensus_view,
                    "contrarian_view": pov.contrarian_view,
                    "evidence": pov.evidence,
                    "source": {
                        "title": pov.source_article.title,
                        "url": pov.source_article.url,
                        "date": pov.source_article.date.isoformat()
                    },
                    "domains": pov.domains,
                    "validation": {
                        "status": pov.validation.status.value if pov.validation else None,
                        "explanation": pov.validation.explanation if pov.validation else None,
                        "sources": [
                            {
                                "title": s.title,
                                "url": s.url,
                                "author": s.author
                            }
                            for s in (pov.validation.supporting_sources if pov.validation else [])
                        ] if pov.validation else []
                    }
                }
                pov_data.append(pov_dict)
            
            # Save to file
            with open(output_file, 'w') as f:
                json.dump(pov_data, f, indent=2)
            
            logger.info(f"Saved {len(povs)} POVs to {output_file}")
            
            # Print summary
            print(f"\n=== Extraction Results for {writer} ===")
            print(f"Total POVs extracted: {len(povs)}")
            
            validation_stats = {
                "aligned": 0,
                "partial": 0,
                "rejected": 0,
                "unclear": 0
            }
            
            for pov in povs:
                if pov.validation:
                    validation_stats[pov.validation.status.value] += 1
            
            print("\nValidation Statistics:")
            for status, count in validation_stats.items():
                print(f"  {status}: {count}")
            
            print("\nSample POVs:")
            for i, pov in enumerate(povs[:3], 1):
                print(f"\n{i}. {pov.title}")
                print(f"   Consensus: {pov.consensus_view}")
                print(f"   Contrarian: {pov.contrarian_view}")
                if pov.validation:
                    print(f"   Validation: {pov.validation.status.value}")
                    
        except Exception as e:
            logger.error(f"Error during extraction: {e}")
            raise

def main():
    """Run test extraction."""
    # List of writers to test
    writers = [
        "default_friend",  # Example writer
        # Add more writers here
    ]
    
    for writer in writers:
        try:
            asyncio.run(test_extraction(writer))
        except Exception as e:
            logger.error(f"Failed to process {writer}: {e}")

if __name__ == "__main__":
    main() 