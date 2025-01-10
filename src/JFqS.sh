#!/bin/bash
snyk test --all-projects ~/git/app-sec-exercise --json > ~/security-assessment/findings/vulns/snyk-test.json
snyk code test --all-projects ~/git/app-sec-exercise --json > ~/security-assessment/findings/vulns/snyk-code-test.json
