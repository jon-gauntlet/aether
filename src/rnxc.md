# SQL Injection Flaws in `app/models`

## Findings

1. `app/models/user.rb`:
   - The `find_by_email` method uses string interpolation to construct a SQL query, which is susceptible to SQL Injection:
     ```ruby
     def self.find_by_email(email)
       User.where("email = '#{email}'").first
     end
     ```
   - To fix this, the method should use parameterized queries instead:
     ```ruby
     def self.find_by_email(email)
       User.where(email: email).first
     end
     ```
   - Risk:
     - Likelihood: High (user input is directly used in the SQL query)
     - Impact: High (potential for unauthorized access to user records and sensitive information)

2. `app/models/post.rb`:
   - The `search` method uses string interpolation to construct a SQL LIKE query, which is vulnerable to SQL Injection:
     ```ruby
     def self.search(query)
       Post.where("title LIKE '%#{query}%'")
     end
     ```
   - To mitigate this, the method should use parameterized queries and sanitize the input:
     ```ruby
     def self.search(query)
       sanitized_query = "%#{query}%"
       Post.where("title LIKE ?", sanitized_query)
     end
     ```
   - Risk:
     - Likelihood: Medium (depends on how the search functionality is exposed and used)
     - Impact: Medium (potential for unauthorized access to post data and information leakage)

## Key Takeaways

- Avoid using string interpolation or concatenation to construct SQL queries.
- Use parameterized queries and Active Record's built-in methods to sanitize user input.
- Be cautious when using user input in SQL LIKE queries, as they can still be vulnerable to SQL Injection if not properly sanitized.
- Regularly review and update model methods that interact with the database to ensure they follow secure coding practices. 