# Command Injection Vulnerabilities

## Findings

1. `app/jobs/data_export_job.rb`:
   - The `data_export` method uses user input from `params[:directory]` to construct a shell command without proper validation or sanitization:
     ```ruby
     def data_export
       system("tar -czf export-#{Time.now.to_i}.tar.gz #{params[:directory]}")
     end
     ```
   - This allows attackers to inject arbitrary commands, potentially leading to unauthorized access or malicious actions.
   - To fix this, avoid passing user input directly into shell commands. Instead, use safer alternatives like dedicated libraries or carefully validate and sanitize all user input using allowlists.
   - Risk:
     - Likelihood: High (user input is directly passed into a shell command)
     - Impact: High (potential for arbitrary command execution and system compromise)

2. `lib/tasks/db_backup.rake`:
   - The `db_backup` task uses string interpolation to construct a shell command, potentially allowing command injection if the `DIR` environment variable is user-controlled:
     ```ruby
     task :db_backup => :environment do
       backup_dir = ENV['DIR'] || '/backups'
       system("pg_dump #{database} > #{backup_dir}/db.psql")
     end
     ```
   - To mitigate this risk, avoid using environment variables for sensitive parameters like filesystem paths. If environment variables must be used, ensure they are set by trusted sources and can only contain expected values.
   - Consider using dedicated backup libraries instead of shelling out to `pg_dump`.
   - Risk:
     - Likelihood: Medium (depends on the source and control of the `DIR` environment variable)
     - Impact: High (potential for arbitrary command execution and system compromise)

## Key Takeaways

- Never pass user input directly into shell commands without proper validation and sanitization.
- Use safer alternatives to shell commands, such as dedicated libraries or APIs, whenever possible.
- If shell commands must be used, implement strict input validation and sanitization using allowlists to ensure only expected values are accepted.
- Be cautious when using environment variables for sensitive parameters, as they may introduce command injection vulnerabilities if not properly controlled.
- Regularly review and test code that interacts with the underlying operating system or executes shell commands to identify and remediate command injection vulnerabilities. 