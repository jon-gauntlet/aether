#!/bin/bash
cd ~/git/binti-app
semgrep ci --json > ~/security-assessment/findings/vulns/semgrep-ci.json
