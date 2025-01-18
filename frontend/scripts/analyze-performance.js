const fs = require('fs')
const path = require('path')

function analyzePerformance() {
  const resultsPath = path.join(__dirname, '../test-results/performance.json')
  
  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    const testResults = results.testResults || []
    
    console.log('\nPerformance Test Analysis\n')
    console.log('=========================\n')
    
    let totalDuration = 0
    let totalTests = 0
    let failedTests = 0
    
    testResults.forEach(suite => {
      console.log(`Test Suite: ${suite.name}`)
      console.log('--------------------------')
      
      suite.assertionResults.forEach(test => {
        totalTests++
        const duration = test.duration || 0
        totalDuration += duration
        
        console.log(`\n${test.title}`)
        console.log(`Duration: ${duration.toFixed(2)}ms`)
        console.log(`Status: ${test.status}`)
        
        if (test.status === 'failed') {
          failedTests++
          console.log(`Error: ${test.failureMessages.join('\n')}`)
        }
      })
      
      console.log('\n')
    })
    
    console.log('Summary')
    console.log('=======')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Failed Tests: ${failedTests}`)
    console.log(`Average Duration: ${(totalDuration / totalTests).toFixed(2)}ms`)
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms`)
    
    // Performance budgets
    const budgets = {
      maxAverageDuration: 100,
      maxTotalDuration: 1000
    }
    
    console.log('\nPerformance Budgets')
    console.log('===================')
    console.log(`Average Duration: ${(totalDuration / totalTests).toFixed(2)}ms (Budget: ${budgets.maxAverageDuration}ms)`)
    console.log(`Total Duration: ${totalDuration.toFixed(2)}ms (Budget: ${budgets.maxTotalDuration}ms)`)
    
    const exceedsAverageBudget = (totalDuration / totalTests) > budgets.maxAverageDuration
    const exceedsTotalBudget = totalDuration > budgets.maxTotalDuration
    
    if (exceedsAverageBudget || exceedsTotalBudget) {
      console.log('\n⚠️ Performance budget exceeded!')
      process.exit(1)
    }
  } catch (error) {
    console.error('Error analyzing performance results:', error)
    process.exit(1)
  }
}

analyzePerformance() 