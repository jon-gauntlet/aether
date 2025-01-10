import logging

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('/home/jon/security-assessment/logs/etl-process.log', mode='w'),  # Overwrite on each run
            logging.StreamHandler()
        ]
    )