const fs = require('fs');
const path = require('path');

// Natural proportions
const PHI = 0.618033988749895;
const SILVER = 0.414213562373095;
const BRONZE = 0.302775637731995;

// Validation patterns
const patterns = {
  flow: /\b(flow|energy|presence|harmony)\b/i,
  essence: /\b(essence|spirit|soul|nature)\b/i,
  sacred: /\b(sacred|holy|divine|eternal)\b/i
};

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Check natural proportions in code structure
  const lineCount = lines.length;
  const goldenSections = Math.round(lineCount * PHI);
  const silverSections = Math.round(lineCount * SILVER);
  const bronzeSections = Math.round(lineCount * BRONZE);
  
  // Validate presence of patterns without exposing them
  const matches = {
    flow: lines.filter(line => patterns.flow.test(line)).length,
    essence: lines.filter(line => patterns.essence.test(line)).length,
    sacred: lines.filter(line => patterns.sacred.test(line)).length
  };
  
  return {
    path: filePath,
    proportions: {
      golden: goldenSections,
      silver: silverSections,
      bronze: bronzeSections
    },
    presence: matches
  };
}

// Only run in safe local environment
if (process.env.NODE_ENV !== 'production') {
  const results = [];
  const ignoreDirs = ['.git', 'node_modules', 'dist', '.local'];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (ignoreDirs.some(ignore => filePath.includes(ignore))) return;
      
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (stat.isFile()) {
        results.push(validateFile(filePath));
      }
    });
  }
  
  walkDir('.');
  console.log(JSON.stringify(results, null, 2));
} 