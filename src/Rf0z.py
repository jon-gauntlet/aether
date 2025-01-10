import os
import json

def count_findings(directory):
    total_count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    total_count += len(data)  # Count the number of findings
    return total_count

input_count = count_findings('/home/jon/security-assessment/findings')
output_count = count_findings('/home/jon/security-assessment/data/mongo-staging')

print(f"Input Findings Count: {input_count}")
print(f"Output Findings Count: {output_count}")