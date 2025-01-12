#!/usr/bin/env node

console.log('🌿 Creating development snapshot...\n');

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Ensure states directory exists
console.log('🕊️ Preparing backup location...');
const statesDir = '.states';
if (!fs.existsSync(statesDir)) {
  fs.mkdirSync(statesDir);
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const statePath = path.join(statesDir, `state-${timestamp}`);

// Create state directory
fs.mkdirSync(statePath);

// Save git state
console.log('🦅 Recording repository state...');
try {
  const gitStatus = execSync('git status --porcelain').toString();
  const gitBranch = execSync('git branch --show-current').toString();
  const gitLog = execSync('git log -1 --pretty=format:"%h %s"').toString();
  
  fs.writeFileSync(path.join(statePath, 'git-state'), 
    `Status:\n${gitStatus}\nBranch:\n${gitBranch}\nLast Commit:\n${gitLog}`);
} catch (error) {
  console.log('⚠️ Repository state not fully captured');
}

// Save environment
console.log('🛡️ Backing up environment...');
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  fs.writeFileSync(path.join(statePath, 'env-backup'), envContent);
} catch (error) {
  console.log('⚠️ Environment backup incomplete');
}

// Save dependencies
console.log('⚔️ Saving dependency state...');
try {
  const packageJson = fs.readFileSync('package.json', 'utf8');
  const packageLock = fs.readFileSync('package-lock.json', 'utf8');
  fs.writeFileSync(path.join(statePath, 'dependencies'), 
    `package.json:\n${packageJson}\n\npackage-lock.json:\n${packageLock}`);
} catch (error) {
  console.log('⚠️ Dependency state not fully saved');
}

// Save TypeScript config
console.log('🔮 Storing TypeScript configuration...');
try {
  const tsconfig = fs.readFileSync('tsconfig.json', 'utf8');
  fs.writeFileSync(path.join(statePath, 'tsconfig-backup'), tsconfig);
} catch (error) {
  console.log('⚠️ TypeScript configuration not saved');
}

// Save working changes
console.log('⚡ Capturing current changes...');
try {
  execSync(`git diff > "${path.join(statePath, 'pending-changes')}"`, { stdio: 'ignore' });
} catch (error) {
  console.log('⚠️ Current changes not captured');
}

// Create manifest
const manifest = {
  timestamp,
  branch: execSync('git branch --show-current').toString().trim(),
  commit: execSync('git rev-parse HEAD').toString().trim(),
  files: fs.readdirSync(statePath)
};

fs.writeFileSync(
  path.join(statePath, 'manifest.json'), 
  JSON.stringify(manifest, null, 2)
);

console.log('\n✨ Development state preserved');
console.log(`🌿 State saved to: ${statePath}`); 