#!/bin/bash

# Create directories
mkdir -p deliverable notes/meeting-notes notes/research scripts

# Move files to the appropriate directories
mv assignment-prompt.md deliverable/prompt.md
mv notes/security-assessment-categories.md deliverable/
mv methodology/assessment-methodology.md deliverable/
mv methodology/findings-schema-and-scoring.md deliverable/
mv reports/final-report.md deliverable/

mv notes/meeting-notes-wayne.md notes/meeting-notes/wayne-meeting-notes.md
mv notes/rails-security-guide-notes.md notes/research/

# Remove empty directories
rmdir methodology reports

echo "Project reorganized successfully!"