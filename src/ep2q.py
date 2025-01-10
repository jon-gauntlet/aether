import os
import re
from pathlib import Path

def parse_markdown_file(file_path):
    with open(file_path, 'r') as file:
        content = file.read()

    # Extract the title
    title_match = re.search(r'^#\s*(.+)', content, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else ''

    # Extract the location
    location_match = re.search(r'- Location:\s*`(.+?)`', content, re.MULTILINE)
    location = location_match.group(1).strip() if location_match else ''

    # Extract the current code
    current_code_match = re.search(r'Current Code:\n```(?:ruby|python|javascript|erb)?\n(.*?)\n```', content, re.DOTALL)
    current_code = current_code_match.group(1).strip() if current_code_match else ''

    # Extract the secure code
    secure_code_match = re.search(r'Secure Code:\n```(?:ruby|python|javascript|erb)?\n(.*?)\n```', content, re.DOTALL)
    secure_code = secure_code_match.group(1).strip() if secure_code_match else ''

    # Extract key takeaways
    key_takeaways_match = re.search(r'# Key Takeaways\n((?:- .+\n?)+)', content, re.MULTILINE)
    key_takeaways = key_takeaways_match.group(1).strip().split('\n') if key_takeaways_match else []
    key_takeaways = [takeaway.strip('- ').strip() for takeaway in key_takeaways]

    return {
        'title': title,
        'location': location,
        'current_code': current_code,
        'secure_code': secure_code,
        'key_takeaways': key_takeaways
    }

def parse_all_markdown_files(directory):
    findings = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                finding = parse_markdown_file(file_path)
                findings.append(finding)
    return findings