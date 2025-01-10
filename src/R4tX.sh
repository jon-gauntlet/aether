#!/bin/bash
cd ~/git/binti-app
bundle-audit check --format json > ~/security-assessment/findings/vulns/bundle-audit.json
