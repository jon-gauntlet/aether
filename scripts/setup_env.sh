#!/bin/bash

# Get the API key from pass
export ANTHROPIC_API_KEY=$(pass show anthropic/api-key)

# Execute the command passed as arguments with the environment set
exec "$@" 