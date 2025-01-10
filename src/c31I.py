import markdown
import re

def extract_finding_details(file_path, category):
    with open(file_path, 'r') as file:
        md_content = file.read()
    
    # Convert Markdown to HTML
    html_content = markdown.markdown(md_content)
    
    # Extract findings using regex or other parsing logic
    # This is a placeholder for actual parsing logic
    findings = []
    # Example: Extract headings and paragraphs
    headings = re.findall(r'<h\d>(.*?)</h\d>', html_content)
    paragraphs = re.findall(r'<p>(.*?)</p>', html_content)
    
    for heading, paragraph in zip(headings, paragraphs):
        finding = {
            "title": heading,
            "description": paragraph,
            "category": category
        }
        findings.append(finding)
    
    return findings