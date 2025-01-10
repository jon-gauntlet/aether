# final-report-manual-verification

1. **Potential Missing CSRF Protection in API Controllers**
   - Steps to reproduce:
     1. Identify an API endpoint that performs state-changing actions (e.g., creating, updating, or deleting resources).
     2. Craft a malicious HTML form or script that targets the identified API endpoint with a forged request.
     3. Host the malicious form or script on an attacker-controlled website.
     4. Lure an authenticated user to visit the attacker's website while logged into the application.
     5. Observe if the forged request is successfully processed by the API endpoint without CSRF protection.

2. **Insecure Session Configuration**
   - Steps to reproduce:
     1. Intercept the HTTP traffic between the client and the server using a tool like Burp Suite or OWASP ZAP.
     2. Analyze the session cookie sent by the server and verify if it lacks the `Secure` and `HttpOnly` flags.
     3. Attempt to access the session cookie from client-side JavaScript to check if it is accessible.
     4. Modify the session cookie value and observe if the application accepts the modified cookie without validation.

3. **Weak Password Policy**
   - Steps to reproduce:
     1. Register a new user account with a weak password that violates common password strength requirements (e.g., short length, no special characters).
     2. Verify if the application allows the registration with the weak password.
     3. Attempt to log in using the weak password to confirm that it is accepted by the authentication system.

4. **Lack of Account Lockout Mechanism**
   - Steps to reproduce:
     1. Identify a target user account.
     2. Attempt multiple failed login attempts with incorrect passwords for the target account.
     3. Observe if the application allows an unlimited number of failed attempts without enforcing an account lockout.
     4. Verify if the account remains accessible even after a high number of failed attempts.

5. **Potential SQL Injection in User Search**
   - Steps to reproduce:
     1. Identify the user search functionality within the application.
     2. Inject SQL-specific characters and syntax into the search input fields (e.g., `' OR 1=1--`, `' UNION SELECT username, password FROM users--`).
     3. Observe if the application returns unexpected results or errors, indicating potential SQL injection vulnerability.
     4. Attempt to extract sensitive information or manipulate the database using SQL injection techniques.

6. **Missing Security Headers**
   - Steps to reproduce:
     1. Access the application using a web browser.
     2. Inspect the HTTP response headers using the browser's developer tools or a proxy tool.
     3. Verify if important security headers, such as `X-XSS-Protection`, `X-Content-Type-Options`, and `Strict-Transport-Security`, are missing or misconfigured.
     4. Test if the absence of these headers allows for potential vulnerabilities, such as cross-site scripting (XSS) or content sniffing.

7. **Insecure Direct Object References in Admin Panel**
   - Steps to reproduce:
     1. Log in to the application as an admin user.
     2. Identify any functionality in the admin panel that accepts user-supplied input to reference objects (e.g., user IDs, order IDs).
     3. Modify the user-supplied input to reference objects that should not be accessible to the current admin user.
     4. Observe if the application allows access to the unauthorized objects without proper authorization checks.

8. **Sensitive Configuration Exposure in Version Control**
   - Steps to reproduce:
     1. Obtain access to the application's version control repository (e.g., Git, SVN).
     2. Search the repository for configuration files that may contain sensitive information (e.g., `database.yml`, `secrets.yml`).
     3. Verify if sensitive data, such as database credentials, API keys, or encryption keys, are exposed in the version control history.

9. **Outdated and Vulnerable Dependencies**
   - Steps to reproduce:
     1. Obtain the `Gemfile.lock` file from the application's codebase.
     2. Run `bundle-audit` tool to scan the `Gemfile.lock` for known vulnerabilities in the gem dependencies.
     3. Verify if any gems are flagged as vulnerable with associated CVEs.
     4. Attempt to exploit the identified vulnerabilities to confirm their impact on the application.

By following these steps, you can manually verify the presence of the identified vulnerabilities and assess their potential impact on the application. It's important to note that manual verification should be performed in a controlled testing environment and with proper authorization to avoid any unintended consequences or disruptions to the production system.
