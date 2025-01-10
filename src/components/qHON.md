# Security Assessment assignemnt

Your task is to review the application for any security issues and
report on these in a way that describes the threat, one or more
options for fixing any vulnerabilities, and ways to prevent
introducing similar vulnerabilities in the future. If you have
ideas on how to detect if a vulnerability has been exploited
in the past, that is also appreciated!

You **do not** need to provide automated exploits or complex fixes
beyond a few example lines of code.

For any areas you investigate and do not find security issues,
please also note what potential issues you were looking for and
why you believe the code you looked at may not be vulnerable.

Feel free to use any resources you might normally use in evaluating
code, e.g. Google, Stack Overflow, IDE tools, etc.

## Key Objectives
1. Review the application code for common web app vulnerabilities (OWASP Top 10)  
2. Assess the application's adherence to Rails security best practices
3. Identify any outdated or vulnerable dependencies 
4. Suggest improvements to harden the application's security posture
5. Document findings in a clear, actionable report

## Relevant Context 
This example application is an email sending tool with the following features:

1. Users can add individual recipients to their account
2. Users can select a group of recipients to whom to send a rich
   text email
3. Users may import a CSV of recipients and see conflicting
   names with imported users and existing users

[See this video for a guided tour of the application](https://www.loom.com/share/4dbd717b4eae4a509851aef58c23ad1f)

This application is implemented in Ruby on Rails, using
[ActiveAdmin](https://github.com/activeadmin/activeadmin) and other
stack components very similar to that in Binti's own stack.

You don't need to be specifically familiar with any or all of these, but for your references, we use:

- [ActiveAdmin](https://github.com/activeadmin/activeadmin) to implement most of the structure of the application and its user interface
- [Devise](https://github.com/heartcombo/devise) to implement authentication
- [Pundit](https://github.com/varvet/pundit) to implement authorization
- [ActionText](https://guides.rubyonrails.org/action_text_overview.html) to implement rich text entry for HTML emails
- [React](https://react.dev/) to implement bulk recipient imports
- [Apollo](https://www.apollographql.com/docs/react/) to handle frontend GraphQL communication for bulk recipient imports
- [GraphQL Ruby](https://graphql-ruby.org/) for server side GraphQL implementation

### Setting up the application

The application can be run on your host, but is easier to set up
dependencies and run via docker:

```shell
docker build -t app-sec-exercise:testing .
docker run -p 3000:3000 app-sec-exercise:testing
```

At this point you should be able to login to
[http://localhost:3000](http://localhost:3000) using these credentials:

- Username: `admin@example.com`
- Password: `password_1234`

Other non-privileged users you may login as using the same password:
- `carla_reynolds@cruickshank.example`
- `patrick_stanton@bayer.test`
- `ruby_ebert@hamill.test`
- `shirleen.cartwright@franecki.example`
- `tyree.nikolaus@howe.test`

## Using the application

The most important concepts and models in the application are:

1. Users - these includes the admin user above as well as a number
   of non-privileged users who may send emails to Recipients in
   their account.
2. Recipients - these are names and emails associated with a User
   who may receive emails. Recipients are not Users themselves,
   though it's possible a Recipient and User share an email address.
3. Emails - these are emails with subjects, rich text body contents,
   and an associated list of Recipients to whom the emails are sent.
   (The application doesn't actually send any real emails.)

The application is setup with seed data of a number of users, each
with their own recipients.

You may login as any of the users by finding their email address on
the Users dashboard and the password `password_1234`.


### Application Repository
@codebase[repo] /home/jon/git/binti-app

The `binti-app` repository contains the source code for the Rails application to be assessed. Clone this repo locally and perform a thorough code review as part of the security assessment.

### Related Project
@codebase[project] /home/jon/git/appsec-project 

The `appsec-project` repository may contain additional context, tools, or resources related to application security that could be helpful for the assessment.

### Useful References
@web[owasp_top_10](https://owasp.org/www-project-top-ten/)
@web[owasp_rails_cheat_sheet] https://cheatsheetseries.owasp.org/cheatsheets/Ruby_on_Rails_Cheat_Sheet.html 
@web[rails_security_guide](https://guides.rubyonrails.org/v7.1/security.html)
@web[rails_security_advisories](https://discuss.rubyonrails.org/c/security-announcements/9)

These web resources provide valuable information on common web app vulnerabilities (OWASP Top 10), Rails-specific security best practices, and known Rails security issues to look out for during the assessment.

### Additional Context
@web[*] *
@codebase[home] /home/jon
@codebase[bookmarks] /home/jon/.config/BraveSoftware/Brave-Browser/Default/Bookmarks
