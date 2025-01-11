#!/bin/bash

# Create temporary directory for build
mkdir -p .tmp-build
cp -r src .tmp-build/
cp -r public .tmp-build/
cp package.json .tmp-build/
cp tsconfig.json .tmp-build/

# Remove Redis-related files
find .tmp-build -type f -name "*.ts" -exec sed -i 's/import.*redis.*//gI' {} \;
find .tmp-build -type f -name "*.ts" -exec sed -i 's/export.*redis.*//gI' {} \;

# Build from temporary directory
cd .tmp-build

# Install dependencies with legacy peer deps
DISABLE_ESLINT_PLUGIN=true CI=false npm install --legacy-peer-deps

# Run build
DISABLE_ESLINT_PLUGIN=true CI=false npm run build

# Copy build back
cd ..
rm -rf build
mv .tmp-build/build ./

# Clean up
rm -rf .tmp-build 