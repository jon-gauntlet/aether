#!/bin/bash
cd ~/git/app-sec-exercise
bundle-audit check --format json > ~/security-assessment/findings/vulns/bundle-audit.json
