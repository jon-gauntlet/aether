import { TestHarness } from './TestHarness';

export async function runTests(tests: Array<{name: string, test: () => Promise<void> | void}>) {
  const harness = new TestHarness();
  
  console.log('Starting test run...\n');
  
  for (const { name, test } of tests) {
    const result = await harness.measure(name, test);
    const status = result.valid ? '✓' : '✗';
    const duration = result.metrics?.duration.toFixed(2) || '?';
    
    console.log(`${status} ${name} (${duration}ms)`);
    
    if (!result.valid && result.errors?.length) {
      console.log('  Errors:');
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
  }
  
  const metrics = harness.getMetrics();
  console.log('\nTest Run Summary:');
  console.log(`  Total Tests: ${harness.getResults().length}`);
  console.log(`  Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
  console.log(`  Coverage: ${(metrics.coverage * 100).toFixed(1)}%`);
  console.log(`  Performance: ${(metrics.performance * 100).toFixed(1)}%`);
  console.log(`  Flow Velocity: ${(metrics.velocity * 100).toFixed(1)}%`);
  console.log(`  Conductivity: ${(metrics.conductivity * 100).toFixed(1)}%`);
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