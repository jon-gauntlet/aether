import os
import re

def count_findings_in_markdown(file_path):
    """Count the number of findings in a Markdown file."""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
        # Use regex to find numbered findings or headings
        findings = re.findall(r'^\d+\.\s|^#\s\d+\.\s', content, re.MULTILINE)
        return len(findings)

def count_findings_in_directory(base_path):
    """Count findings in all Markdown files within a directory."""
    findings_count = {}
    for root, dirs, files in os.walk(base_path):
        # Exclude the 'exploitability-notes' directory
        dirs[:] = [d for d in dirs if d != 'exploitability-notes']
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                count = count_findings_in_markdown(file_path)
                category = os.path.basename(root)
                # Exclude the base directory itself from being counted as a category
                if category != 'code-llm':
                    findings_count[category] = findings_count.get(category, 0) + count
    return findings_count

if __name__ == "__main__":
    # Adjust the base path to be relative to the scripts directory
    base_path = '../findings/claude-3.5-sonnet'
    findings_count = count_findings_in_directory(base_path)
    
    # Sort categories by name, ensuring 'additional' is last
    sorted_categories = sorted(
        (cat for cat in findings_count if cat != 'additional'),
        key=lambda x: (x.isdigit(), x)
    )
    sorted_categories.append('additional')

    total_findings = 0
    for category in sorted_categories:
        if category in findings_count:
            count = findings_count[category]
            total_findings += count
            print(f"Category: {category}, Findings: {count}")

    # Print total findings with a visual separator
    print("\n" + "="*40)
    print(f"Total Findings: {total_findings}")
    print("="*40)
