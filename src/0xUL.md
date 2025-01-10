# Security Assessment Methodology

## Analysis Types

### 1. Static Analysis (SAST)
- Location: `findings/sast/`
- Type: Pre-deployment code analysis
- Source: Automated scanning tools
- Focus: Code vulnerabilities, security patterns, best practices

### 2. Dynamic Analysis (DAST)
- Location: `findings/dast/`
- Type: Runtime security testing
- Source: Automated scanning tools
- Focus: Runtime behavior, actual vulnerabilities, attack simulation

### 3. LLM Analysis
- Location: `findings/claude-3.5-sonnet/`
- Type: Interactive code review
- Source: Claude 3.5 Sonnet AI
- Focus: Code quality, security patterns, architectural issues

## Findings Normalization
- Target directory: `data/normalized_findings/`
- Base schema: Using format from claude-3.5-sonnet findings
- Process: ETL pipeline in `scripts/etl/`
- Parsers: Dedicated parsers for each tool in `scripts/etl/parsers/`
- Schema validation: All findings validated against common schema
- Error handling: Configurable skip-on-error behavior per parser
- Source preservation: Original tool output preserved in metadata

## ETL Pipeline Learnings
### Parser Design
- Base parser class provides common functionality:
  - Severity normalization
  - Schema validation
  - Source data preservation
  - Finding ID generation
  - Required field validation
  
### Tool-Specific Considerations
- SAST Tools:
  - Bearer: Severity determined by finding list location
  - Brakeman: Rich metadata about Rails-specific issues
  - Snyk: Handles both dependency and code analysis
  
- DAST Tools:
  - Nikto: URL construction from host/port
  - Wapiti: Classification-based metadata
  - ZAP: Instance-based evidence collection
  - Burp Suite: Detailed remediation information

### Best Practices
1. Consistent Finding Structure:
   - Unique ID generation
   - Clear title and description
   - Normalized severity levels
   - Evidence with reproduction steps
   - Actionable remediation steps
   - Relevant references

2. Error Handling:
   - Graceful failure for missing fields
   - Configurable error skipping
   - Detailed error logging
   - Schema validation at multiple steps

3. Data Quality:
   - HTML cleaning for descriptions
   - URL normalization
   - Consistent severity scoring
   - Metadata preservation
   - Tag generation for categorization

## Workflow
1. Collect findings from all three sources
2. Normalize using consistent schema
3. Analyze and correlate findings
4. Generate comprehensive reports

