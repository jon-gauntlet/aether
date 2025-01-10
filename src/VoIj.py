import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    # Create a logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)  # Set to DEBUG to capture all levels of logs

    # Create a file handler for logging to a file
    file_handler = RotatingFileHandler(
        '/home/jon/security-assessment/logs/etl-process.log', 
        maxBytes=5*1024*1024,  # 5 MB
        backupCount=3
    )
    file_handler.setLevel(logging.DEBUG)  # Log all levels to the file
    file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)

    # Create a console handler for minimal console output
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)  # Log only INFO and above to the console
    console_formatter = logging.Formatter('%(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)

    # Add handlers to the logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)