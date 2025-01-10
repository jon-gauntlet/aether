# SQL Injection Flaws in `app/views`

## Findings

1. `app/views/users/show.html.erb`:
   - The view directly interpolates the `params[:id]` value into a SQL query using `<%= %>` tags:
     ```erb
     <h1>User Details</h1>
     <% @user = User.find_by_sql("SELECT * FROM users WHERE id = #{params[:id]}").first %>
     <p>Name: <%= @user.name %></p>
     <p>Email: <%= @user.email %></p>
     ```
   - This practice is highly vulnerable to SQL Injection attacks, as user input is directly executed as part of the SQL query.
   - To fix this, the query should be moved to the corresponding controller action or model method, using parameterized queries or Active Record methods:
     ```ruby
     # app/controllers/users_controller.rb
     def show
       @user = User.find(params[:id])
     end
     ```
     ```erb
     <h1>User Details</h1>
     <p>Name: <%= @user.name %></p>
     <p>Email: <%= @user.email %></p>
     ```
   - Risk:
     - Likelihood: High (user input is directly interpolated into the SQL query)
     - Impact: High (potential for unauthorized access to user records and sensitive information)

2. `app/views/posts/index.html.erb`:
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
   - This approach is susceptible to SQL Injection attacks, as the user input is not properly sanitized.
   - To mitigate this risk, the search functionality should be moved to the corresponding controller action or model method, using parameterized queries and input sanitization:
     ```ruby
     # app/controllers/posts_controller.rb
     def index
       search_query = params[:search]
       @posts = Post.search(search_query)
     end
     ```
     ```ruby
     # app/models/post.rb
     def self.search(query)
       sanitized_query = "%#{query}%"
       Post.where("title LIKE ?", sanitized_query)
     end
     ```
     ```erb
     <h1>Search Posts</h1>
     <ul>
       <% @posts.each do |post| %>
         <li><%= post.title %></li>
       <% end %>
     </ul>
     ```
   - Risk:
     - Likelihood: Medium (depends on how the search functionality is exposed and used)
     - Impact: Medium (potential for unauthorized access to post data and information leakage)

## Key Takeaways

- Avoid executing SQL queries directly in views using string interpolation or concatenation.
- Move database queries to controller actions or model methods, leveraging parameterized queries and Active Record's built-in methods for input sanitization.
- Be cautious when using user input in SQL queries, even in views, as they can introduce SQL Injection vulnerabilities if not properly handled.
- Regularly review and update views that interact with user input and database queries to ensure they follow secure coding practices and separation of concerns. 