# LDAP Injection Vulnerabilities

## Findings

1. `app/controllers/users_controller.rb`:
   - The `search` action uses user input from `params[:query]` to construct an LDAP search filter without proper validation or sanitization:
     ```ruby
     def search
       ldap = Net::LDAP.new(host: 'ldap.example.com', port: 389)
       filter = Net::LDAP::Filter.construct("(cn=#{params[:query]}*)")
       results = ldap.search(base: 'dc=example,dc=com', filter: filter)
       @users = results.map { |entry| entry[:mail].first }
     end
     ```
   - This allows attackers to inject arbitrary LDAP search filters, potentially leading to unauthorized access to sensitive information.
   - To fix this, use parameterized LDAP queries or carefully validate and sanitize all user input using allowlists.
   - Risk:
     - Likelihood: High (user input is directly used to construct an LDAP search filter)
     - Impact: High (potential for unauthorized access to sensitive user information)

2. `app/models/user.rb`:
   - The `authenticate` method uses string interpolation to construct an LDAP filter based on user input:
     ```ruby
     def self.authenticate(username, password)
       ldap = Net::LDAP.new(host: 'ldap.example.com', port: 389)
       filter = Net::LDAP::Filter.construct("(uid=#{username})")
       result = ldap.bind_as(base: 'dc=example,dc=com', filter: filter, password: password)
       result ? User.find_by(username: username) : nil
     end
     ```
   - While the impact of this vulnerability is limited to the specific user's account, it still allows for potential LDAP injection if the `username` parameter is not properly validated.
   - To mitigate this risk, use parameterized LDAP queries or sanitize the `username` input to only allow expected characters.
   - Risk:
     - Likelihood: Medium (depends on the validation and format of the `username` parameter)
     - Impact: Medium (limited to the specific user's account)

## Key Takeaways

- Use parameterized LDAP queries or prepared statements to avoid LDAP injection vulnerabilities.
- Validate and sanitize all user input used in LDAP filters, ensuring only expected characters and formats are allowed.
- Be cautious when constructing LDAP filters using string concatenation or interpolation, as this can easily lead to injection vulnerabilities.
- Regularly review and test code that interacts with LDAP services to identify and remediate LDAP injection vulnerabilities.
- Consider using LDAP libraries that provide built-in protection against injection attacks, such as escaping special characters in user input. 