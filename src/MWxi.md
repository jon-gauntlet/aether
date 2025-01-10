# SQL Injection Vulnerabilities

## Findings

1. `app/controllers/users_controller.rb`:
   - The `search` action uses string interpolation to construct a SQL query based on user input:
     ```ruby
     def search
       query = params[:query]
       @users = User.where("name LIKE '%#{query}%'")
     end
     ```
   - This allows attackers to inject arbitrary SQL statements and potentially access sensitive data or modify the database.
   - To fix this, use parameterized queries or ActiveRecord's `where` method with placeholders:
     ```ruby
     def search
       query = params[:query]
       @users = User.where("name LIKE ?", "%#{query}%")
     end
     ```
   - Risk:
     - Likelihood: High (user input is directly interpolated into the SQL query)
     - Impact: High (potential for unauthorized access to sensitive data and database modification)

2. `app/models/user.rb`:
   - The `find_by_email` method uses string interpolation to construct a SQL query:
     ```ruby
     def self.find_by_email(email)
       User.where("email = '#{email}'").first
     end
     ```
   - To fix this, use parameterized queries instead:
     ```ruby
     def self.find_by_email(email)
       User.where(email: email).first
     end
     ```
   - Risk:
     - Likelihood: High (user input is directly used in the SQL query)
     - Impact: High (potential for unauthorized access to user records and sensitive information)

3. `app/models/post.rb`:
   - The `search` method uses string interpolation to construct a SQL LIKE query:
     ```ruby
     def self.search(query)
       Post.where("title LIKE '%#{query}%'")
     end
     ```
   - To mitigate this, use parameterized queries and sanitize the input:
     ```ruby
     def self.search(query)
       sanitized_query = "%#{query}%"
       Post.where("title LIKE ?", sanitized_query)
     end
     ```
   - Risk:
     - Likelihood: Medium (depends on how the search functionality is exposed and used)
     - Impact: Medium (potential for unauthorized access to post data and information leakage)

4. `app/views/users/show.html.erb`:
   - The view directly interpolates the `params[:id]` value into a SQL query using `<%= %>` tags:
     ```erb
     <h1>User Details</h1>
     <% @user = User.find_by_sql("SELECT * FROM users WHERE id = #{params[:id]}").first %>
     <p>Name: <%= @user.name %></p>
     <p>Email: <%= @user.email %></p>
     ```
   - To fix this, move the query to the corresponding controller action or model method, using parameterized queries or ActiveRecord methods.
   - Risk:
     - Likelihood: High (user input is directly interpolated into the SQL query)
     - Impact: High (potential for unauthorized access to user records and sensitive information)

5. `app/views/posts/index.html.erb`:
   - The view uses string interpolation to construct a SQL LIKE query based on user input:
     ```erb
     <h1>Search Posts</h1>
     <% search_query = params[:search] %>
     <% @posts = Post.where("title LIKE '%#{search_query}%'") %>
     <ul>
       <% @posts.each do |post| %>
         <li><%= post.title %></li>
       <% end %>
     </ul>
     ```
   - To mitigate this risk, move the search functionality to the corresponding controller action or model method, using parameterized queries and input sanitization.
   - Risk:
     - Likelihood: Medium (depends on how the search functionality is exposed and used)
     - Impact: Medium (potential for unauthorized access to post data and information leakage)

6. `lib/tasks/data_migration.rake`:
   - The `migrate_legacy_data` task uses string interpolation to construct SQL queries based on user input:
     ```ruby
     task migrate_legacy_data: :environment do
       legacy_data = JSON.parse(File.read('legacy_data.json'))
       legacy_data.each do |record|
         User.connection.execute("INSERT INTO users (name, email) VALUES ('#{record['name']}', '#{record['email']}')")
       end
     end
     ```
   - To mitigate this risk, use parameterized queries or ActiveRecord methods for data insertion.
   - Risk:
     - Likelihood: Medium (depends on the source and validation of the `legacy_data.json` file)
     - Impact: High (potential for unauthorized data manipulation and insertion of malicious records)

7. `app/services/user_importer.rb`:
   - The `import_users` method uses string interpolation to construct SQL queries based on data from an external CSV file:
     ```ruby
     def import_users(csv_file)
       CSV.foreach(csv_file) do |row|
         name, email = row
         User.connection.execute("INSERT INTO users (name, email) VALUES ('#{name}', '#{email}')")
       end
     end
     ```
   - To fix this, use parameterized queries or ActiveRecord methods for data insertion.
   - Risk:
     - Likelihood: Medium (depends on the source and validation of the CSV file)
     - Impact: High (potential for unauthorized data manipulation and insertion of malicious records)

## Key Takeaways

- Avoid using string interpolation or concatenation to construct SQL queries.
- Use parameterized queries and ActiveRecord's built-in methods to sanitize user input.
- Be cautious when using user input in SQL LIKE queries, as they can still be vulnerable to SQL Injection if not properly sanitized.
- Regularly review and update code that interacts with the database to ensure adherence to secure coding practices.
- Implement proper input validation and sanitization mechanisms when dealing with external data sources to mitigate the risk of SQL Injection attacks.
- Move database queries from views to controller actions or model methods to maintain separation of concerns and improve security. 