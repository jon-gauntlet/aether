# Task 01: Injection Flaws

## Resources
@codebase[project]: deliverable/security-assessment-categories.md > "1. Injection Flaws"
@codebase[project]: notes/rails-security-guide/06-injection.md

@web[rails_security_guide](https://guides.rubyonrails.org/v7.1/security.html)
@web[owasp_top_10](https://owasp.org/Top10/)

## Guide
To identify SQL Injection flaws, focus on controller actions and model methods that interact with the database. Look for instances where user input is interpolated directly into raw SQL queries without proper validation or sanitization. Utilize LLM prompting to analyze complex code and suggest secure alternatives using Active Record query methods. Document your findings, including the file name, line number, affected functionality, and potential impact. Prioritize the flaws based on their likelihood of exploitation and provide recommendations for secure fixes using the Rails Security Guide and LLM-generated code snippets.

## Sub-categories

### SQL Injection
@codebase[project]: findings/code/01-injection-flaws/app-models.md
@codebase[project]: findings/code/01-injection-flaws/app-controllers.md

### Command Injection

### LDAP Injection 

### XML Injection