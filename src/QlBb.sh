#!/bin/bash

# Create directories
mkdir -p references tasks log

# Create task files
touch tasks/task-01-injection-flaws.md
touch tasks/task-02-authentication-session-management.md
touch tasks/task-03-cross-site-scripting.md
touch tasks/task-04-insecure-direct-object-references.md
touch tasks/task-05-security-misconfiguration.md
touch tasks/task-06-sensitive-data-exposure.md
touch tasks/task-07-missing-function-level-access-control.md
touch tasks/task-08-cross-site-request-forgery.md
touch tasks/task-09-using-components-with-known-vulnerabilities.md
touch tasks/task-10-unvalidated-redirects-forwards.md

# Create log files
touch log/progress-log.md
touch log/challenges-log.md
touch log/decisions-log.md

# Initialize versioning for the security assessment report
git add deliverables/security-assessment-report.md
git commit -m "Initialize security assessment report"

# Update readme.md
echo "# Security Assessment Project" > readme.md
echo "" >> readme.md
echo "This repository contains the documentation, notes, and findings related to the security assessment of the Rails 7.1 application codebase for Binti. The project aims to identify potential vulnerabilities, provide recommendations for remediation, and deliver a high-quality report by January 3, 2025." >> readme.md