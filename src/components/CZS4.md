# Binti App Sec Exercise Security Assessment

## Objective
Conduct a comprehensive security assessment of the "Binti App Sec Exercise" Ruby on Rails application. This application is an email sending tool with features similar to those in Binti's stack. The goal is to identify potential vulnerabilities, insecure coding practices, and areas for improvement. Provide a detailed report with findings, recommendations, and guidance on preventing similar vulnerabilities in the future.

## Key Tasks
1. Review the application for any security issues
2. Describe the threat and potential impact of each vulnerability
3. Provide options for fixing the vulnerabilities
4. Suggest ways to prevent introducing similar vulnerabilities in the future
5. If possible, provide ideas on detecting past exploitation of vulnerabilities
6. Document findings in a clear, actionable report
7. For investigated areas without security issues, note the potential issues considered and why the code may not be vulnerable

## Application Overview
The "Binti App Sec Exercise" is a Ruby on Rails email sending tool with the following features:
1. Users can add individual recipients to their account
2. Users can select a group of recipients to send a rich text email
3. Users can import a CSV of recipients and see conflicting names with imported and existing users

The application uses a stack similar to Binti's, including:
- ActiveAdmin for application structure and user interface
- Devise for authentication
- Pundit for authorization
- ActionText for rich text entry in HTML emails
- React for bulk recipient imports
- Apollo for frontend GraphQL communication
- GraphQL Ruby for server-side GraphQL implementation

## Setup Instructions
1. Build and run the application using Docker:
   ```
   docker build -t app-sec-exercise:testing .
   docker run -p 3000:3000 app-sec-exercise:testing
   ```

2. Access the application at `http://localhost:3000`

3. Login with the following credentials:
   - Admin user:
     - Username: `admin@example.com`
     - Password: `password_1234`

   - Non-privileged users (password: `password_1234`):
     - `carla_reynolds@cruickshank.example`
     - `patrick_stanton@bayer.test`
     - `ruby_ebert@hamill.test`
     - `shirleen.cartwright@franecki.example`
     - `tyree.nikolaus@howe.test`

## Key Concepts and Models
1. Users: Includes admin and non-privileged users who can send emails to Recipients in their account
2. Recipients: Names and emails associated with a User who may receive emails (not Users themselves)
3. Emails: Contains subject, rich text body, and a list of Recipients to whom the emails are sent (no actual email sending)

The application is seeded with sample data, including users and their recipients. You can login as any user using their email and the password `password_1234`.

## Related Resources
### Project
@codebase[project] /home/jon/git/appsec-project

### References
@web[owasp_top_10](https://owasp.org/www-project-top-ten/)
@web[owasp_rails_cheat_sheet] https://cheatsheetseries.owasp.org/cheatsheets/Ruby_on_Rails_Cheat_Sheet.html
@web[rails_security_guide](https://guides.rubyonrails.org/v7.1/security.html)
@web[rails_security_advisories](https://discuss.rubyonrails.org/c/security-announcements/9)

Feel free to use any resources you normally would when evaluating code, such as Google, Stack Overflow, IDE tools, etc.

Please provide a comprehensive security assessment report addressing the objectives and key tasks outlined above. If you have any questions or need further clarification, don't hesitate to ask.
