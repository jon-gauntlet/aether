# Rails Security Guide Notes
[src](https://guides.rubyonrails.org/security.html)

Skim headings, then read thoroughly.

Headings:
1. Introduction
2. Sessions
3. Cross-Site Request Forgery (CSRF)
4. Redirection and Files
5. User Management
6. Injection
7. Unsafe Query Generation
8. HTTP Security Headers
9. Intranet and Admin Security
10. Environmental Security
11. Dependency Management and CVEs
12. Additional Resources



Notes: 
- Section 4 includes "file uploads" which is a functionality of the application (@codebase[app]])
- Section 5 includes Privilege Escalation which I should test on the application (@codebase[app]])


## 2. Sessions
- The session ID in the cookie identifies the session.
- Stealing cookies: XSS, sniffing unencrypted traffic, public terminal, etc.

- Session storage: Rails `CookieStore` 
  + eliminates the need for a session-id
  + uses the encrypted cookie jar to provide a secure, encrypted location to store session data
- Try: have your application invalidate old session cookies using a stored timestamp

