# Security Assessment Findings Statistics

## Overview
Total Findings: 127

## By Security Category
| Category | Count | Percentage |
|----------|--------|------------|
| Sessions & Authentication | 23 | 18.1% |
| CSRF Protection | 15 | 11.8% |
| Input Validation & Injection | 19 | 15.0% |
| Access Control | 21 | 16.5% |
| Security Headers | 12 | 9.4% |
| Data Protection | 17 | 13.4% |
| Error Handling | 8 | 6.3% |
| Dependency Security | 12 | 9.4% |

## By OWASP Risk Score
| Severity | Count | Percentage | Score Range |
|----------|--------|------------|-------------|
| Critical | 7 | 5.5% | 9.0-10.0 |
| High | 23 | 18.1% | 7.0-8.9 |
| Medium | 48 | 37.8% | 4.0-6.9 |
| Low | 35 | 27.6% | 2.0-3.9 |
| Info | 14 | 11.0% | 0.1-1.9 |

## By Source Type
| Source | Count | Percentage | Unique Findings |
|--------|--------|------------|-----------------|
| SAST (Static Analysis) | 52 | 40.9% | 43 |
| DAST (Dynamic Testing) | 47 | 37.0% | 39 |
| LLM (AI-Assisted Review) | 28 | 22.1% | 24 |

## Key Metrics
- Average Risk Score: 5.7
- Median Risk Score: 5.2
- Most Common Category: Sessions & Authentication
- Critical/High Issues: 30 (23.6%)
- Findings with POC: 89 (70.1%)
- Findings with Remediation: 127 (100%)

## Cross-Analysis
### High/Critical Findings by Category
1. Sessions & Authentication: 8
2. Input Validation & Injection: 7
3. Access Control: 6
4. Data Protection: 5
5. Others: 4

### Source Effectiveness
| Source | Critical/High | Medium | Low/Info |
|--------|--------------|--------|-----------|
| SAST | 12 | 24 | 16 |
| DAST | 11 | 19 | 17 |
| LLM | 7 | 5 | 16 |

## Trend Analysis
- 35% of critical/high findings in authentication/session management
- Strong correlation between SAST and DAST findings (72% overlap)
- LLM analysis identified 5 unique high-severity issues missed by other tools 