#!/bin/sh
set -e

# Create a temporary directory for kaniko
mkdir -p /tmp/kaniko
cd /tmp/kaniko

# Copy the build context
cp -r /app/* .

# Run kaniko
/kaniko/executor \
  --context=/tmp/kaniko \
  --dockerfile=Dockerfile \
  --destination=061051250133.dkr.ecr.us-west-2.amazonaws.com/aether-backend:latest \
  --force 