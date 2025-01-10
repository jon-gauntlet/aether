import json
import os
import jsonschema
from collections import Counter
from typing import Dict, List
import statistics

class FindingsValidator:
    def __init__(self, schema_path: str):
        with open(schema_path, 'r') as f:
            self.schema = json.load(f)
            
    def validate_findings(self, findings_path: str) -> Dict:
        """Validate findings and generate statistics."""
        with open(findings_path, 'r') as f:
            data = json.load(f)
            findings = data.get('findings', [])
            
        stats = {
            "total_findings": len(findings),
            "by_source": Counter(),
            "by_severity": Counter(),
            "by_category": Counter(),
            "risk_scores": {
                "mean": 0,
                "median": 0,
                "by_source": {},
                "by_severity": {},
                "by_category": {}
            }
        }
        
        # Validate each finding
        valid_findings = []
        for finding in findings:
            try:
                jsonschema.validate(finding, self.schema)
                valid_findings.append(finding)
                
                # Collect statistics
                source_type = finding.get('source', {}).get('type', 'unknown')
                stats["by_source"][source_type] += 1
                stats["by_severity"][finding.get('severity', 'unknown')] += 1
                stats["by_category"][finding.get('security_category', 'unknown')] += 1
                
            except jsonschema.exceptions.ValidationError as e:
                print(f"Validation error in finding {finding.get('id', 'unknown')}: {e}")
                
        # Calculate risk score statistics
        if valid_findings:
            scores = []
            for f in valid_findings:
                if isinstance(f.get('risk_score'), dict):
                    score = f['risk_score'].get('score')
                    if score is not None:
                        scores.append(score)
            
            if scores:
                stats["risk_scores"]["mean"] = statistics.mean(scores)
                stats["risk_scores"]["median"] = statistics.median(scores)
                
                # Risk scores by source
                for source in stats["by_source"]:
                    source_scores = [
                        f['risk_score']['score'] 
                        for f in valid_findings 
                        if f.get('source', {}).get('type') == source 
                        and isinstance(f.get('risk_score'), dict)
                        and f['risk_score'].get('score') is not None
                    ]
                    if source_scores:
                        stats["risk_scores"]["by_source"][source] = {
                            "mean": statistics.mean(source_scores),
                            "median": statistics.median(source_scores)
                        }
                
                # Risk scores by severity
                for severity in stats["by_severity"]:
                    severity_scores = [
                        f['risk_score']['score'] 
                        for f in valid_findings 
                        if f.get('severity') == severity 
                        and isinstance(f.get('risk_score'), dict)
                        and f['risk_score'].get('score') is not None
                    ]
                    if severity_scores:
                        stats["risk_scores"]["by_severity"][severity] = {
                            "mean": statistics.mean(severity_scores),
                            "median": statistics.median(severity_scores)
                        }
                
                # Risk scores by category
                for category in stats["by_category"]:
                    category_scores = [
                        f['risk_score']['score'] 
                        for f in valid_findings 
                        if f.get('security_category') == category 
                        and isinstance(f.get('risk_score'), dict)
                        and f['risk_score'].get('score') is not None
                    ]
                    if category_scores:
                        stats["risk_scores"]["by_category"][category] = {
                            "mean": statistics.mean(category_scores),
                            "median": statistics.median(category_scores)
                        }
        
        return stats

def main():
    validator = FindingsValidator("/home/jon/security-assessment/scripts/etl/config/final_schema.json")
    stats = validator.validate_findings("/home/jon/security-assessment/data/categorized_findings/categorized_findings.json")
    
    # Write statistics
    output_file = "/home/jon/security-assessment/data/validation/findings_statistics.json"
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(stats, f, indent=2)
        
    print(f"Validation complete. Statistics written to {output_file}")

if __name__ == "__main__":
    main() 