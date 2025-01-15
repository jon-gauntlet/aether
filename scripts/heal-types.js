// <!-- LLM:component FLOW_SLED_COMPONENT type_healing core_protection -->
// Flow Sled type system healing
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Flow protection
const shield = {
  active: true,
  energy: 1.0,
  natural: true,
  patterns: new Map()
};

// Natural healing
async function healTypes() {
  console.log('\n🌱 Natural Type Healing\n');
  
  try {
    // Get type errors
    const output = execSync('npm run typecheck', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    processOutput(output);
  } catch (error) {
    if (error.stdout) {
      processOutput(error.stdout);
    } else {
      shield.energy = 0.5;
      shield.natural = false;
      console.error('Flow disruption:', error);
      process.exit(1);
    }
  }
}

// Process error output
function processOutput(output) {
  const errors = parseErrors(output);
  
  // Pattern recognition
  for (const error of errors) {
    const pattern = identifyPattern(error);
    if (pattern) {
      shield.patterns.set(pattern.type, {
        count: (shield.patterns.get(pattern.type)?.count || 0) + 1,
        examples: [...(shield.patterns.get(pattern.type)?.examples || []), error]
      });
    }
  }
  
  // Natural growth
  console.log('Pattern Recognition:');
  for (const [type, data] of shield.patterns) {
    console.log(`\n${type}: ${data.count} occurrences`);
    console.log('Example:', data.examples[0]);
  }
  
  // Energy guidance
  console.log('\nHealing Guidance:');
  for (const [type, data] of shield.patterns) {
    console.log(`\n${type}:`);
    console.log(getGuidance(type, data));
  }
  
  // Flow summary
  console.log('\nFlow Summary:');
  console.log(`Total Patterns: ${shield.patterns.size}`);
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Energy Level: ${shield.energy}`);
  console.log(`Natural Flow: ${shield.natural}`);
}

// Pattern identification
function identifyPattern(error) {
  if (error.includes('Property') && error.includes('does not exist')) {
    return { type: 'MissingProperty', error };
  }
  if (error.includes('Cannot find module')) {
    return { type: 'MissingModule', error };
  }
  if (error.includes('is declared but') && error.includes('never')) {
    return { type: 'UnusedDeclaration', error };
  }
  if (error.includes('implicitly has an \'any\' type')) {
    return { type: 'ImplicitAny', error };
  }
  if (error.includes('is not assignable to type')) {
    return { type: 'TypeMismatch', error };
  }
  return { type: 'Other', error };
}

// Natural guidance
function getGuidance(type, data) {
  switch (type) {
    case 'MissingProperty':
      return '- Add missing properties to interfaces\n- Use optional properties where appropriate\n- Consider using type guards';
    case 'MissingModule':
      return '- Create missing modules\n- Fix import paths\n- Add type declarations';
    case 'UnusedDeclaration':
      return '- Remove unused declarations\n- Or use them in implementation\n- Consider marking as intentionally unused';
    case 'ImplicitAny':
      return '- Add explicit type annotations\n- Use type inference where possible\n- Consider using generics';
    case 'TypeMismatch':
      return '- Check type compatibility\n- Use type assertions when safe\n- Update type definitions if needed';
    default:
      return '- Review each case individually\n- Look for patterns\n- Apply natural fixes';
  }
}

// Parse error output
function parseErrors(output) {
  return output
    .split('\n')
    .filter(line => line.includes('error TS'))
    .map(line => line.trim());
}

// Natural error handling
healTypes().catch(error => {
  shield.energy = 0.5;
  shield.natural = false;
  console.error('Flow disruption:', error);
  process.exit(1);
}); 