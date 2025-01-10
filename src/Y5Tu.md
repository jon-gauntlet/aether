# Security Assessment Project

## Overview

This repository contains the security assessment tooling and findings for the Rails application security review. The assessment combines static analysis (SAST), dynamic analysis (DAST), and LLM-based code review findings into a unified report.

## Key Features

- Multi-tool security assessment integration
- Unified finding schema normalization
- OWASP Risk Rating methodology implementation
- Rails Security Guide categorization
- Automated processing pipeline

## Documentation

- [Data Processing Pipeline](docs/DATA_PROCESSING.md)
- [Finding Normalization](docs/topics/FINDING_NORMALIZATION.md)

## Directory Structure

```
.
├── data/                       # Processed findings
│   ├── normalized_findings/    # Schema-normalized
│   ├── risk_scored_findings/   # OWASP risk-scored
│   └── categorized_findings/   # Rails-categorized
├── docs/                       # Documentation
│   └── topics/                # Detailed docs
├── scripts/                    # Processing scripts
│   └── etl/                   # ETL pipeline
└── tools/                     # Assessment tools
```

## Getting Started

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Run the processing pipeline: `python scripts/etl/process_findings.py`

## Contributing

1. Follow the schema defined in [Finding Normalization](docs/topics/FINDING_NORMALIZATION.md)
2. Ensure all findings are properly risk-scored
3. Verify Rails security categories are correctly assigned

## License

MIT License - See LICENSE file for details