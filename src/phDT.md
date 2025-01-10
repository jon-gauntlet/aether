# Binti Application Security Assessment

## Objective
Conduct a comprehensive security assessment of the "Binti" Ruby on Rails application. Identify potential vulnerabilities, insecure coding practices, and areas for improvement. Provide a detailed report with findings and recommendations.

## Key Tasks
1. Review code for common web app vulnerabilities (OWASP Top 10)
2. Assess adherence to Rails security best practices
3. Identify outdated or vulnerable dependencies
4. Suggest improvements to harden security posture
5. Document findings in a clear, actionable report

## Application Overview
"Binti" is a Ruby on Rails web application for personal finance management. Key features include:
- User authentication and account management
- Transaction tracking and categorization
- Financial reporting and analytics

The application uses a PostgreSQL database and follows standard Rails conventions.

## Repo Information
### Structure
- `app/`: Main application code (models, controllers, views)
- `config/`: Configuration files
- `db/`: Database migrations and schema
- `spec/`: Test files (RSpec)
- `Gemfile`: Gem dependencies
- `package.json`: JavaScript dependencies

### Location
@codebase[repo] /home/jon/git/binti-app

## Related Resources
### Project
@codebase[project] /home/jon/git/appsec-project

### References
@web[owasp_top_10](https://owasp.org/www-project-top-ten/)
@web[owasp_rails_cheat_sheet] https://cheatsheetseries.owasp.org/cheatsheets/Ruby_on_Rails_Cheat_Sheet.html
@web[rails_security_guide](https://guides.rubyonrails.org/v7.1/security.html) 
@web[rails_security_advisories](https://discuss.rubyonrails.org/c/security-announcements/9)

## Setup Instructions
1. Clone the application repository:
   @codebase[repo] /home/jon/git/binti-app

2. If needed, refer to the related project:
   @codebase[project] /home/jon/git/appsec-project

3. Consult the provided web references on Rails security best practices and common vulnerabilities during your assessment.
