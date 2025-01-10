from bs4 import BeautifulSoup
import json
import os

def parse_skipfish_report(html_file):
    with open(html_file, 'r') as file:
        soup = BeautifulSoup(file, 'html.parser')

    issues = []
    for issue in soup.find_all('div', class_='issue'):
        issue_data = {}
        for child in issue.children:
            if child.name:
                issue_data[child.name] = child.get_text(strip=True)
        issues.append(issue_data)

    return issues

def main():
    # Assuming the script is run from tools/skipfish
    html_file = 'app_scan_results_02-complete/index.html'
    issues = parse_skipfish_report(html_file)
    json_output = json.dumps(issues, indent=4)

    # Output JSON to findings/dast-manual
    output_file = os.path.join('..', '..', 'findings', 'dast-manual', 'skipfish_report.json')
    with open(output_file, 'w') as json_file:
        json_file.write(json_output)

if __name__ == '__main__':
    main()