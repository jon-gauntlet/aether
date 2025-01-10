#!/bin/bash
#gem install rubocop-capybara rubocop-graphql rubocop-rails
rubocop --only Security/CompoundHash,Security/Eval,Security/IoMethods,Security/JSONLoad,Security/MarshalLoad,Security/YAMLLoad --format json --out ~/security-assessment/findings/vulns/rubocop.json ~/git/app-sec-exercise
