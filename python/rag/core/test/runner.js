/**
 * @typedef {Object} Test
 * @property {string} name
 * @property {function(): Promise<void>|void} test
 */

/**
 * Run a suite of tests
 * @param {Test[]} tests - Array of test objects
 * @returns {Promise<void>}
 */
export async function runTests(tests) {
  console.log('\nRunning tests...\n');
  
  for (const { name, test } of tests) {
    try {
      console.log(`Running test: ${name}`);
      await test();
      console.log(`✓ ${name}\n`);
    } catch (error) {
      console.error(`✗ ${name}`);
      console.error(error);
      console.log('\n');
    }
  }
  
  console.log('Tests complete.\n');
}

// Example usage:
if (require.main === module) {
  runTests([
    {
      name: 'Field resonance calculation',
      test: async () => {
        // Test implementation
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    },
    {
      name: 'Energy flow optimization',
      test: () => {
        // Test implementation
        return Promise.resolve();
      }
    }
  ]).catch(console.error);
} 