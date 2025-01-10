#!/bin/bash

# Create main directory structure
mkdir -p {practice,learn,review,quiz}

# Practice directory - for hands-on coding
mkdir -p practice/{easy,medium,hard,templates}
mkdir -p practice/templates/{array,string,tree,graph,dp}

# Learning directory - for structured learning
mkdir -p learn/{concepts,implementations,visualizations}
mkdir -p learn/concepts/{data_structures,algorithms,patterns}

# Review directory - for quick reference
mkdir -p review/{flashcards,cheatsheets,summaries}
mkdir -p review/flashcards/{python,dsa,patterns}

# Quiz directory - for assessment preparation
mkdir -p quiz/{mock_tests,solutions,timing}

# Move existing resources to new structure
mv resources/templates/* practice/templates/
mv resources/flashcards/* review/flashcards/
mv resources/quick_review/* review/summaries/
mv resources/algorithms/* learn/implementations/
mv resources/practice/* practice/

# Create symbolic links for quick access
ln -s practice/templates templates
ln -s review/flashcards flashcards
ln -s review/cheatsheets cheatsheets
ln -s quiz/mock_tests mock_tests

# Clean up old structure
rm -rf resources 