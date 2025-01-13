import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function validateTypeDefinitions() {
  try {
    await execAsync('tsc --noEmit');
    return true;
  } catch (error: any) {
    throw new Error(`Type validation failed: ${error.message}`);
  }
}