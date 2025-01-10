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
- Process: ETL pipeline in `scripts/etl_pipeline/`

## Workflow
1. Collect findings from all three sources
2. Normalize using consistent schema
3. Analyze and correlate findings
4. Generate comprehensive reports

