#!/bin/bash
cd ~/git/app-sec-exercise
semgrep --json . > ~/security-assessment/findings/vulns/semgrep.json
semgrep ci --json > ~/security-assessment/findings/vulns/semgrep-ci.json
