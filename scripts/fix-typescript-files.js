import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'src/core/types/energy/state2.ts',
  'src/core/types/energy/utils1.ts',
  'src/core/types/flow.ts',
  'src/core/types/flow/system.ts',
  'src/core/types/space/core1.ts',
  'src/core/types/space/core2.ts',
  'src/core/types/space/core3.ts',
  'src/core/types/space/core4.ts',
  'src/core/types/space/core5.ts',
  'src/core/types/space/core6.ts',
  'src/core/types/space/core7.ts',
  'src/core/types/space/core8.ts',
  'src/core/types/space/core9.ts',
  'src/core/types/space/space4.ts',
  'src/core/types/space/space5.ts',
  'src/core/types/space/space7.ts',
  'src/core/types/utils/state.ts',
  'src/core/types/utils/state1.ts',
  'src/core/types/utils/state10.ts',
  'src/core/types/utils/state2.ts',
  'src/core/types/utils/state3.ts',
  'src/core/types/utils/state4.ts',
  'src/core/types/utils/state5.ts',
  'src/core/types/utils/state6.ts',
  'src/core/types/utils/state7.ts',
  'src/core/types/utils/state8.ts',
  'src/core/types/utils/state9.ts',
  'src/core/types/utils/utils2.ts',
  'src/core/types/utils/utils3.ts',
  'src/core/types/utils/utils4.ts',
  'src/core/types/utils/utils5.ts',
  'src/core/types/utils/utils6.ts',
  'src/core/types/utils/utils7.ts',
  'src/core/types/utils/utils8.ts',
  'src/core/types/utils/utils9.ts'
];

function isTypeDefinitionFile(filePath) {
  return filePath.includes('/types/');
}

function isArrowFunction(line) {
  return line.includes('=>') && !line.includes('interface') && !line.includes('type');
}

function isRegularFunction(line) {
  return line.includes('function') && !line.includes('interface') && !line.includes('type');
}

function fixTypeScriptFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Count opening and closing braces
    let braceCount = 0;
    let inFunction = false;
    let inArrowFunction = false;
    let arrowFunctionHasBody = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (isArrowFunction(line)) {
        inArrowFunction = true;
        // Check if arrow function has a body (uses braces)
        arrowFunctionHasBody = line.includes('{');
      } else if (isRegularFunction(line)) {
        inFunction = true;
      }
      
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;
      
      if (braceCount === 0) {
        inFunction = false;
        inArrowFunction = false;
        arrowFunctionHasBody = false;
      }
    }
    
    // Add missing closing braces
    if (braceCount > 0) {
      // Only add return statement for implementation functions in non-type files
      if (!isTypeDefinitionFile(filePath) && (inFunction || (inArrowFunction && arrowFunctionHasBody))) {
        lines.push('  return {};');
      }
      
      // Add missing closing braces
      for (let i = 0; i < braceCount; i++) {
        lines.push('}');
      }
      
      // Write back to file
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`Fixed ${filePath} - Added ${braceCount} closing brace(s)`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Process each file
files.forEach(file => {
  const filePath = path.join(path.dirname(__dirname), file);
  if (fs.existsSync(filePath)) {
    fixTypeScriptFile(filePath);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}); 