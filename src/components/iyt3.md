# Binti Security Assessment Codebase

This repository contains the complete security assessment pipeline and findings for Binti's Rails application. The codebase demonstrates our systematic approach to security analysis, combining multiple assessment tools with custom processing to deliver actionable insights.

## Project Structure

```
.
├── data/                    # Data processing pipeline stages
│   ├── normalized_findings/ # Schema-normalized findings
│   ├── risk_scored_findings/# OWASP risk-scored findings
│   └── schemas/            # JSON schemas for validation
├── deliverable/            # Final deliverables for Binti
├── docs/                   # Documentation
│   └── topics/            # Detailed technical documentation
├── findings/              # Raw tool outputs
│   ├── dast/             # Dynamic analysis results
│   ├── llm/              # LLM-based analysis
│   └── sast/             # Static analysis results
├── scripts/              # Processing scripts
│   ├── etl/             # ETL pipeline
│   │   ├── parsers/     # Tool-specific parsers
│   │   └── transformers/# Data transformation logic
│   └── risk_scoring/    # OWASP risk scoring implementation
└── tools/               # Tool configurations and wrappers
```

## Key Components

1. **ETL Pipeline** (`scripts/etl/`)
   - Parsers for SAST, DAST, and LLM findings
   - Schema normalization
   - Data quality validation

2. **Risk Scoring** (`scripts/risk_scoring/`)
   - OWASP Risk Rating Methodology implementation
   - Impact and likelihood calculation
   - Risk score validation

3. **Security Categorization** (`scripts/categorization/`)
   - Rails Security Guide categorization
   - Category validation and normalization

## Final Deliverables

The `/deliverable` folder contains the final security assessment outputs:

1. `FINAL_security_findings_2024_01_04.json` - Complete findings dataset
2. `FINAL_findings_summary_2024_01_04.json` - Statistical summary
3. `FINAL_findings_report_2024_01_04.md` - Human-readable report
4. `README.md` - Deliverables documentation

## Documentation

- [Data Processing Pipeline](docs/DATA_PROCESSING.md)
- [Finding Normalization](docs/topics/FINDING_NORMALIZATION.md)
- [Resource Directives](docs/topics/RESOURCE_DIRECTIVES.md)

## Tools Used

1. **Static Analysis (SAST)**
   - Bearer
   - Brakeman
   - Snyk

2. **Dynamic Analysis (DAST)**
   - Nikto
   - Wapiti
   - OWASP ZAP
   - Burp Suite

3. **LLM Analysis**
   - Claude 3.5 Sonnet

## Getting Started

To review the findings:
1. Start with the human-readable report in `deliverable/FINAL_findings_report_2024_01_04.md`
2. Explore detailed findings in `deliverable/FINAL_security_findings_2024_01_04.json`
3. Review statistical insights in `deliverable/FINAL_findings_summary_2024_01_04.json`

To understand the analysis process:
1. Review the documentation in `docs/`
2. Examine the ETL pipeline in `scripts/etl/`
3. Study the risk scoring implementation in `scripts/risk_scoring/`