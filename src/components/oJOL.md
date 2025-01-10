# Security Assessment assignemnt
Security Assessment assignment

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

## Setting up the application

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

## Security Assessment assignment

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
