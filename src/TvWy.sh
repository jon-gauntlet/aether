#!/bin/bash

# Create directories
mkdir -p deliverable notes/meeting-notes notes/research scripts

# Move files to the appropriate directories if they exist
if [ -f "assignment-prompt.md" ]; then
    mv assignment-prompt.md deliverable/prompt.md
fi

if [ -f "notes/security-assessment-categories.md" ]; then
    mv notes/security-assessment-categories.md deliverable/
fi

if [ -f "methodology/assessment-methodology.md" ]; then
    mv methodology/assessment-methodology.md deliverable/
fi

if [ -f "methodology/findings-schema-and-scoring.md" ]; then
    mv methodology/findings-schema-and-scoring.md deliverable/
fi

if [ -f "reports/final-report.md" ]; then
    mv reports/final-report.md deliverable/
fi

if [ -f "notes/meeting-notes-wayne.md" ]; then
    mv notes/meeting-notes-wayne.md notes/meeting-notes/wayne-meeting-notes.md
fi

if [ -f "notes/rails-security-guide-notes.md" ]; then
    mv notes/rails-security-guide-notes.md notes/research/
fi

# Remove empty directories if they exist
if [ -d "methodology" ] && [ -z "$(ls -A methodology)" ]; then
    rmdir methodology
fi

if [ -d "reports" ] && [ -z "$(ls -A reports)" ]; then
    rmdir reports
fi

echo "Project reorganized successfully!"