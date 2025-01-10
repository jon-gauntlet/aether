## 3 Cross-Site Request Forgery (CSRF)

### 3.1 What is CSRF?
- CSRF is an attack that forces a user to execute unwanted actions on a web app in which they're authenticated
- Inherits identity and privileges of victim to perform an undesired function on victim's behalf
- Unauthorized commands transmitted from a website trusted by the user to a website that trusts the user
- CSRF attacks target state-changing requests like changing email, transferring funds, etc.

### 3.2 CSRF Countermeasures
- _Synchronizer token pattern_
  - Include a token in the session and as a hidden field in forms
  - Verify the token on the server before processing form submission
  - Rails enables this by default with `protect_from_forgery` in `ApplicationController`
- _SameSite Cookie Attribute_
  - Prevents the browser from sending the session cookie along with cross-site requests
  - Helps protect against CSRF attacks
  - Rails sets SameSite protection to `Lax` by default
- _Verifying Same Origin with Standard Headers_
  - Check standard headers to verify origin of a request
  - Use `Origin` header for normal requests, `Referer` header for GET requests
  - Verify that origin/referer matches expected value before processing request

### 3.3 CSRF Protection in Rails
- Rails has built-in CSRF protection with `protect_from_forgery`
- Enabled by default in `ApplicationController`
- Includes a random token in the session and in a hidden field in every form
- Raises an exception if the token doesn't match what's expected
- Can be disabled for specific controller actions with `skip_before_action :verify_authenticity_token`

### 3.4 Custom CSRF Handling
- Can customize CSRF behavior by overriding methods in `ApplicationController`
- `handle_unverified_request` - called when a request fails CSRF verification
- `valid_authenticity_token?` - verify the token for non-GET requests that don't have a form
- `verified_request?` - returns true if a request is GET or HEAD, or if CSRF token is valid
