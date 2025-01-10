"""
Process Substack Article
Extract SpikyPOVs from a Substack article and save results.
"""
import asyncio
import logging
from pathlib import Path
from spikypov_extractor import SpikyPOVExtractor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    """Process a Substack article and extract SpikyPOVs."""
    # Test article content
    content = """
    "Young men, let me make a suggestion to you: Why don't you turn off the computer, log off the porn, and go ask a real woman on a date. How 'bout that? Just a thought. Ask her out. Young men, why don't you do that?"

    —Josh Hawley, United States Senator

    It's delusional to claim that women are catering to the whims of men, when they reject 95% of their options at first glance.

    Even a cursory examination of statistical data invalidates Senator Hawley's position. Ignorance is no excuse. He's smart enough to research the contemporary dating scene. During 2007 and 2008, Josh Hawley clerked for the Chief Justice of the Supreme Court. That position requires brilliance, ambition, precision, eloquence, a grueling work ethic, and an encyclopedic reading schedule.

    Today, preachers frequently ignore the Scriptures, and claim that "women were made in the image of God". This is a small, but meaningful omission of Genesis 2, the story of Adam and Eve. According to the Scriptures, which superficial, feminist Christians pretend to believe, men were created in the image of God… and women were created in the image of man.

    Women enjoy rejecting men, especially handsome men; the power to select or spurn suitors based on arbitrary reasons, mercurial moods, is fun. It provides a validational ego boost.

    These truths are politically unpopular.

    As a result, Senator Josh Hawley feigns ignorance, and blames men.

    Scapegoating men (and porn) for the destruction of the family feels righteous, and cathartic. But nearly 70% of divorces are initiated by women.

    The larger problem is that women are not attracted to most men. This is a biological reality, which has been exacerbated by technology. The end of cheap energy, and the collapse of industrial civilization, will restore the historical norm of arranged marriages.

    "The breakdown of the family, which so preoccupied midcentury sociologists as a problem peculiar to the black community, has now spread to all but the educated elite... As young men and women anxiously retreat from each others' lives and men drop out of the college circuit — soon two-thirds of college graduates will be women — we appear to be comfortably returning to premodern patterns of male success, in which the clear majority of men fail to reproduce, without a whisper of social upheaval... At work here is a logic much deeper than material decline: it is the increasing inability of men and women to reach an attractive settlement of life."

    —N.S. Lyons, The Upheaval

    "Put down the phone," says Twenge, "and do something else" — but what? Commentators of every stripe have tried to insert their preferred schemata into the space opened by this question, without success. For the last fifty years, we have been sliding back into a muck of such intractability that it threatens to restore the historical norm of permanent stagnation... We are slipping into a world of caste, superstition, and quiescence.

    Nothing rivals the destructive power of a well-executed joke, viciously lacerating: "You will never be a real woman... It's okay to be White... Learn to Code... Poast physique... [Euphemisms] could be here, he thought, I hate [Euphemisms]... She could lose weight... Six million? Sounds a little high..."

    Permanent crisis, downward mobility, crumbling infrastructure, media hysteria, logistical delays, debased currency, cultural erosion, rampant crime, and a diminished standard of living will consume the foreseeable, short-term future.

    Boys and girls are now showing physiological responses that are more characteristic of a "fast life history strategy" — in which adolescents, under the stress of a resource-rich but also hostile and uncertain environment, mature more quickly in order to reproduce early and often.

    "The Pygmalion myth is about a sculptor who falls in love with his own creation, a statue of a woman. The gods take pity on him and bring the statue to life. The myth has been retold many times, most famously in George Bernard Shaw's play Pygmalion, which was adapted into the musical My Fair Lady. In Shaw's version, a phonetics professor, Henry Higgins, makes a bet that he can train a low-class flower girl, Eliza Doolittle, to pass for a duchess at an ambassador's garden party by teaching her to assume a veneer of gentility, the most important element of which, he believes, is impeccable speech. The play is a commentary on the rigid British class system of the day and a treatise on the relationship between men and women."

    —Wikipedia

    It's fascinating that a legend that began with a king disgusted by prostitutes, handed down generation after generation, can mutate into the feminized romance of a modern king (a corporate warlord, who specializes in hostile takeovers, the financial conquest and plundering of Wall Street conglomerates) mesmerized by prostitutes.

    "The Pygmalion myth is about a sculptor who falls in love with his own creation, a statue of a woman. The gods take pity on him and bring the statue to life. The myth has been retold many times, most famously in George Bernard Shaw's play Pygmalion, which was adapted into the musical My Fair Lady. In Shaw's version, a phonetics professor, Henry Higgins, makes a bet that he can train a low-class flower girl, Eliza Doolittle, to pass for a duchess at an ambassador's garden party by teaching her to assume a veneer of gentility, the most important element of which, he believes, is impeccable speech. The play is a commentary on the rigid British class system of the day and a treatise on the relationship between men and women."

    —Wikipedia

    It's fascinating that a legend that began with a king disgusted by prostitutes, handed down generation after generation, can mutate into the feminized romance of a modern king (a corporate warlord, who specializes in hostile takeovers, the financial conquest and plundering of Wall Street conglomerates) mesmerized by prostitutes.

    What good is it to have thousands of choices, when all (or the vast majority) of the options are bad?

    Only a handful of men are charming, handsome, accomplished, and can afford to raise a family on a pragmatic timeline.

    "The breakdown of the family, which so preoccupied midcentury sociologists as a problem peculiar to the black community, has now spread to all but the educated elite... As young men and women anxiously retreat from each others' lives and men drop out of the college circuit — soon two-thirds of college graduates will be women — we appear to be comfortably returning to premodern patterns of male success, in which the clear majority of men fail to reproduce, without a whisper of social upheaval... At work here is a logic much deeper than material decline: it is the increasing inability of men and women to reach an attractive settlement of life."

    —N.S. Lyons, The Upheaval

    "Put down the phone," says Twenge, "and do something else" — but what? Commentators of every stripe have tried to insert their preferred schemata into the space opened by this question, without success. For the last fifty years, we have been sliding back into a muck of such intractability that it threatens to restore the historical norm of permanent stagnation... We are slipping into a world of caste, superstition, and quiescence.

    Nothing rivals the destructive power of a well-executed joke, viciously lacerating: "You will never be a real woman... It's okay to be White... Learn to Code... Poast physique... [Euphemisms] could be here, he thought, I hate [Euphemisms]... She could lose weight... Six million? Sounds a little high..."

    Permanent crisis, downward mobility, crumbling infrastructure, media hysteria, logistical delays, debased currency, cultural erosion, rampant crime, and a diminished standard of living will consume the foreseeable, short-term future.

    Boys and girls are now showing physiological responses that are more characteristic of a "fast life history strategy" — in which adolescents, under the stress of a resource-rich but also hostile and uncertain environment, mature more quickly in order to reproduce early and often.

    "The Pygmalion myth is about a sculptor who falls in love with his own creation, a statue of a woman. The gods take pity on him and bring the statue to life. The myth has been retold many times, most famously in George Bernard Shaw's play Pygmalion, which was adapted into the musical My Fair Lady. In Shaw's version, a phonetics professor, Henry Higgins, makes a bet that he can train a low-class flower girl, Eliza Doolittle, to pass for a duchess at an ambassador's garden party by teaching her to assume a veneer of gentility, the most important element of which, he believes, is impeccable speech. The play is a commentary on the rigid British class system of the day and a treatise on the relationship between men and women."

    —Wikipedia

    It's fascinating that a legend that began with a king disgusted by prostitutes, handed down generation after generation, can mutate into the feminized romance of a modern king (a corporate warlord, who specializes in hostile takeovers, the financial conquest and plundering of Wall Street conglomerates) mesmerized by prostitutes.

    What good is it to have thousands of choices, when all (or the vast majority) of the options are bad?

    Only a handful of men are charming, handsome, accomplished, and can afford to raise a family on a pragmatic timeline.
    """
    
    try:
        # Extract SpikyPOVs
        extractor = SpikyPOVExtractor(
            min_confidence=0.6,  # Require strong confidence
            min_divergence=0.6   # Require significant divergence
        )
        
        logger.info("Extracting SpikyPOVs...")
        spiky_povs = await extractor.extract_spikypovs(content)
        
        # Save results
        output_dir = Path("../../04-SPIKYPOVS/articles/pygmalion")
        output_file = extractor.save_spikypovs(
            spiky_povs, 
            output_dir,
            "https://billionairepsycho.substack.com/p/pygmalion-and-the-anime-girl"
        )
        
        # Print summary
        print(f"\n=== Article Analysis Complete ===")
        print(f"Found {len(spiky_povs)} SpikyPOVs")
        print(f"Results saved to: {output_file}")
        
        print("\nTop SpikyPOVs by Confidence + Divergence:")
        # Sort by combined score
        sorted_povs = sorted(
            spiky_povs,
            key=lambda p: p.confidence + p.divergence,
            reverse=True
        )
        
        for i, pov in enumerate(sorted_povs[:5], 1):  # Show top 5
            print(f"\n{i}. Combined Score: {pov.confidence + pov.divergence:.2f}")
            print(str(pov))
        
    except Exception as e:
        logger.error(f"Error processing article: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 