#!/bin/bash
cd ~/git/binti-app
brakeman --output ~/security-assessment/findings/vulns/brakeman.json
