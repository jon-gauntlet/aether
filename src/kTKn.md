# Additional SQL Injection Findings

## Findings

1. `lib/tasks/data_migration.rake`:
   - The `migrate_legacy_data` task uses string interpolation to construct SQL queries based on user input:
     ```ruby
     task migrate_legacy_data: :environment do
       legacy_data = JSON.parse(File.read('legacy_data.json'))
       legacy_data.each do |record|
         User.connection.execute("INSERT INTO users (name, email) VALUES ('#{record['name']}', '#{record['email']}')")
       end
     end
     ```
   - This approach is vulnerable to SQL Injection attacks if the `legacy_data.json` file contains malicious input.
   - To mitigate this risk, the task should use parameterized queries or Active Record methods for data insertion:
     ```ruby
     task migrate_legacy_data: :environment do
       legacy_data = JSON.parse(File.read('legacy_data.json'))
       legacy_data.each do |record|
         User.create(name: record['name'], email: record['email'])
       end
     end
     ```
   - Risk:
     - Likelihood: Medium (depends on the source and validation of the `legacy_data.json` file)
     - Impact: High (potential for unauthorized data manipulation and insertion of malicious records)

2. `app/services/user_importer.rb`:
   - The `import_users` method uses string interpolation to construct SQL queries based on data from an external CSV file:
     ```ruby
     def import_users(csv_file)
       CSV.foreach(csv_file) do |row|
         name, email = row
         User.connection.execute("INSERT INTO users (name, email) VALUES ('#{name}', '#{email}')")
       end
     end
     ```
   - This code is susceptible to SQL Injection attacks if the CSV file contains malicious input.
   - To fix this, the method should use parameterized queries or Active Record methods for data insertion:
     ```ruby
     def import_users(csv_file)
       CSV.foreach(csv_file) do |row|
         name, email = row
         User.create(name: name, email: email)
       end
     end
     ```
   - Risk:
     - Likelihood: Medium (depends on the source and validation of the CSV file)
     - Impact: High (potential for unauthorized data manipulation and insertion of malicious records)

## Key Takeaways

- Be cautious when executing SQL queries based on data from external sources, such as JSON or CSV files, as they can introduce SQL Injection vulnerabilities if not properly validated and sanitized.
- Use parameterized queries or Active Record methods for data insertion and updates, even in background tasks and service classes.
- Implement proper input validation and sanitization mechanisms when dealing with external data sources to mitigate the risk of SQL Injection attacks.
- Regularly review and update code that interacts with the database, regardless of its location in the codebase, to ensure adherence to secure coding practices. 