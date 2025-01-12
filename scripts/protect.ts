import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

// Protection through quiet excellence
const protectDeployment = async () => {
  try {
    // Gather wisdom
    console.log('🕊️ Gathering wisdom...')
    const gitStatus = execSync('git status --porcelain').toString()
    const testsPassing = execSync('npm test -- --silent').toString().includes('PASS')
    const buildExists = existsSync(path.join(process.cwd(), 'build'))
    const typeCheck = execSync('npm run typecheck').toString()

    // Examine state
    console.log('📿 Examining state...')
    if (gitStatus !== '') {
      console.log('🙏 Preserving current work...')
      execSync('git add . && git commit -m "chore(protect): preserve work before deployment"')
    }

    // Ensure harmony
    console.log('💫 Ensuring harmony...')
    
    // Verify stability
    if (!testsPassing) {
      console.error('⚠️ Tests reveal instability')
      process.exit(1)
    }

    // Prepare path
    if (buildExists) {
      console.log('🧹 Preparing path...')
      execSync('rm -rf build')
    }

    // Verify integrity
    console.log('✨ Verifying integrity...')
    if (typeCheck.includes('error')) {
      console.error('⚠️ Type errors found')
      process.exit(1)
    }

    // Space prepared
    console.log('🕊️ Sacred space prepared')
    
  } catch (error) {
    console.error('💔 Protection interrupted:', error)
    process.exit(1)
  }
}

// Through grace
protectDeployment() 