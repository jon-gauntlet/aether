## 2. Sessions

### 2.1 What are Sessions?
- Sessions allow applications to maintain user-specific state while the user interacts with the app
- Rails provides a session object for each user that accesses the application
- Session data is stored using `ActionDispatch::Session::CookieStore` by default in Rails

### 2.2 Session Hijacking
- Stealing a user's session ID lets an attacker use the web app as that user
- Countermeasures:
  - _Always use HTTPS_ - set `config.force_ssl = true` 
  - Provide a _log out button_ and make it prominent
  - Protect against cross-site scripting (XSS) which can be used to steal cookies

### 2.3 Session Storage
- Rails uses `ActionDispatch::Session::CookieStore` by default to store session hash in a cookie on the client-side
- Cookies have a 4KB size limit, so store only minimal data
- Cookies can be read by the client, so avoid storing sensitive data
- To secure cookies, Rails encrypts them by default using the app's `secret_key_base`

### 2.4 Rotating Encrypted and Signed Cookies Configurations
- Rails allows rotating the ciphers and digests used for encrypted and signed cookies
- Rotation enables seamless migration to new algorithms while allowing old cookies to still be read and eventually upgraded

### 2.5 Replay Attacks for CookieStore Sessions
- Attacker can copy a cookie and submit it later to replay the session 
- Countermeasure: Don't store sensitive data like credit in a cookie, store it server-side instead

### 2.6 Session Fixation
- Attacker forces user's browser to use a session ID known to the attacker
- Vulnerable if authenticating based on session ID alone

### 2.7 Session Fixation - Countermeasures
- _Reset the session_ with `reset_session` after successful login
- This generates a new session ID not known to the attacker

## Key Recommendations for Secure Session Management in @codebase[app]
Based on [Section 2 - Sessions](https://guides.rubyonrails.org/security.html#sessions) of the Rails Security Guide.

1. Ensure that the `config/initializers/session_store.rb` file is configured to use a secure session store like `:cookie_store` with a unique, random `session_key`.

2. In `config/environments/production.rb`, set `config.force_ssl = true` to enforce HTTPS for all requests, protecting session data in transit.

3. Review the `config/initializers/session_store.rb` file and ensure that the `same_site` option is set to `:lax` or `:strict` to prevent CSRF attacks.

4. Audit the codebase for any instances of `session[:user_id]` or similar session keys. Replace these with methods like `current_user` or `user_signed_in?` provided by authentication libraries like Devise.

5. If the application requires long-lived sessions, consider implementing a session timeout mechanism in `app/controllers/application_controller.rb` to automatically log out users after a period of inactivity. This can be done by storing a timestamp in the session and checking it on each request.

6. Implement a mechanism to regenerate session IDs on successful login and logout to prevent session fixation attacks. This can be done in the `app/controllers/sessions_controller.rb` file or using authentication libraries like Devise.

7. Review the third-party gems used in the application (as listed in the `Gemfile`) that handle session management, such as `activerecord-session_store` or `redis-session-store`. Ensure these gems are up to date and free of known session-related vulnerabilities. If any vulnerabilities are found, update the gems to patched versions or consider alternative secure session storage solutions.

