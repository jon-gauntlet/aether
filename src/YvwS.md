# Security Assessment Data Processing Pipeline

## Overview

This document describes the data processing pipeline used to normalize, risk-score, and categorize security findings from multiple sources.

## Pipeline Stages

### 1. Schema Normalization

All findings are normalized to a common schema with the following required fields:
- `id`: Unique identifier
- `title`: Finding title
- `description`: Detailed description
- `severity`: Risk scoring information
- `finding_type`: Type of finding
- `security_category`: Rails Security Guide category

Location: `data/normalized_findings/*.json`

### 2. OWASP Risk Scoring

Each finding is scored using the OWASP Risk Rating Methodology:
- Severity levels: Critical, High, Medium, Low, Info
- Numerical scores: 9.0-10.0, 7.0-8.9, 5.0-6.9, 3.0-4.9, 1.0-2.9
- Context-aware scoring based on:
  - Technical Impact
  - Business Impact
  - Likelihood

Location: `data/risk_scored_findings/*.json`

### 3. Rails Security Categorization

Findings are categorized according to Rails Security Guide sections:
1. Sessions
2. Cross-Site Request Forgery (CSRF)
3. Redirection and Files
4. User Management
5. Injection
6. XSS
7. HTTP Security Headers
8. Intranet and Admin Security
9. Environmental Security
10. Dependency Management and CVEs

Location: `data/categorized_findings/*.json`

## Implementation Details

### Schema Normalization Script
- Location: `scripts/etl/normalize_schema.py`
- Purpose: Converts findings from various tools into a common format
- Handles: SAST (Bearer, Brakeman), DAST (Nikto, Wapiti), and LLM findings

### Risk Scoring Script
- Location: `scripts/etl/risk_scorer.py`
- Purpose: Applies OWASP Risk Rating methodology
- Features: Context-aware scoring based on Rails application specifics

### Category Normalization Script
- Location: `scripts/etl/normalize_categories.py`
- Purpose: Maps findings to Rails Security Guide categories
- Features: Pattern matching and intelligent category assignment

## Data Flow

```
Raw Findings
    ↓
Schema Normalization
    ↓
Risk Scoring
    ↓
Category Assignment
    ↓
Final Processed Findings
```

## Directory Structure

```
security-assessment/
├── data/
│   ├── normalized_findings/    # Schema-normalized findings
│   ├── risk_scored_findings/   # OWASP risk-scored findings
│   └── categorized_findings/   # Rails-categorized findings
├── scripts/
│   └── etl/
│       ├── normalize_schema.py
│       ├── risk_scorer.py
│       └── normalize_categories.py
└── docs/
    └── DATA_PROCESSING.md      # This document
``` 