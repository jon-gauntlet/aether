import json
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
            findings = json.load(f)
            
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
                stats["by_source"][finding["source"]] += 1
                stats["by_severity"][finding["severity"]] += 1
                stats["by_category"][finding["security_category"]] += 1
                
            except jsonschema.exceptions.ValidationError as e:
                print(f"Validation error in finding {finding.get('finding_id', 'unknown')}: {e}")
                
        # Calculate risk score statistics
        if valid_findings:
            scores = [f["risk_score"]["score"] for f in valid_findings]
            stats["risk_scores"]["mean"] = statistics.mean(scores)
            stats["risk_scores"]["median"] = statistics.median(scores)
            
            # Risk scores by source
            for source in stats["by_source"]:
                source_scores = [f["risk_score"]["score"] for f in valid_findings if f["source"] == source]
                if source_scores:
                    stats["risk_scores"]["by_source"][source] = {
                        "mean": statistics.mean(source_scores),
                        "median": statistics.median(source_scores)
                    }
            
            # Risk scores by severity
            for severity in stats["by_severity"]:
                severity_scores = [f["risk_score"]["score"] for f in valid_findings if f["severity"] == severity]
                if severity_scores:
                    stats["risk_scores"]["by_severity"][severity] = {
                        "mean": statistics.mean(severity_scores),
                        "median": statistics.median(severity_scores)
                    }
            
            # Risk scores by category
            for category in stats["by_category"]:
                category_scores = [f["risk_score"]["score"] for f in valid_findings if f["security_category"] == category]
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