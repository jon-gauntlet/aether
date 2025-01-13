import { validateTypeDefinitions } from './TypeValidator';

async function main() {
  try {
    await validateTypeDefinitions();
    console.log('✅ Type validation passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Type validation failed:', error);
    process.exit(1);
  }
}

main();