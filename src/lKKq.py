from bs4 import BeautifulSoup
import json
import os
def normalize_skipfish_report(html_file):
with open(html_file, 'r') as file:
soup = BeautifulSoup(file, 'html.parser')
findings = []
for issue in soup.find_all('div', class_='issue'):
finding = {
'finding_id': issue.get('id', 'unknown'),
'source': 'skipfish',
'title': issue.find('h2').get_text(strip=True),
'description': issue.find('p').get_text(strip=True),
'severity': 'medium', # Example default, adjust based on content
'recommendations': 'Review and address the issue.',
'location': {
'file': 'unknown', # Extract if available
'line': 0 # Extract if available
},
'risk_score': 0, # Placeholder for calculated score
'additional_data': {}
}
findings.append(finding)
return findings
def main():
html_file = 'app_scan_results/index.html'
findings = normalize_skipfish_report(html_file)
json_output = json.dumps(findings, indent=4)
output_file = os.path.join('..', '..', 'findings', 'dast-manual', 'skipfish_report.json')
with open(output_file, 'w') as json_file:
json_file.write(json_output)
if name == 'main':
main()