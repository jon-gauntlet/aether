# Security Assessment Prompt

## Objective

Conduct a comprehensive security assessment of the Rails 7.1 application codebase, focusing on identifying potential vulnerabilities, providing recommendations for remediation, and delivering a high-quality report by January 3, 2025.

## Scope

The assessment will cover the following areas:

1. Injection Flaws
2. Authentication and Session Management
3. Cross-Site Scripting (XSS)
4. Insecure Direct Object References
5. Security Misconfiguration
6. Sensitive Data Exposure
7. Missing Function Level Access Control
8. Cross-Site Request Forgery (CSRF)
9. Using Components with Known Vulnerabilities
10. Unvalidated Redirects and Forwards

## Deliverables

1. A comprehensive security assessment report, including:
   - Executive summary
   - Detailed findings and recommendations
   - Remediation steps and priorities
2. A well-organized project folder containing:
   - Notes and methodologies
   - Vulnerability findings
   - Supporting materials and references

## Timeline

The project will follow the timeline outlined in `notes/assessment-methodology.md`, with the final deliverable submission on January 3, 2025.

## Resources

The following files and directories from `@codebase[app]` are of particular interest for this assignment:

- `app/controllers/`
- `app/models/`
- `app/views/`
- `config/`
- `db/`
- `Gemfile`
- `Gemfile.lock`

Additionally, the following resources will be utilized:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Rails Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Ruby_on_Rails_Cheat_Sheet.html)
- [Rails Security Guide](https://guides.rubyonrails.org/security.html)