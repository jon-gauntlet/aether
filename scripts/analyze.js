// Natural build analysis
const fs = require('fs').promises;
const path = require('path');

// Natural energy analysis
async function analyzeEnergy() {
  try {
    // Try to read stats if they exist
    let stats = {};
    try {
      const statsPath = path.join(process.cwd(), 'dist', 'stats.json');
      const statsData = await fs.readFile(statsPath, 'utf8');
      stats = JSON.parse(statsData);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // Stats don't exist yet - this is natural during first build
      console.log('🌱 No build stats yet - proceeding naturally');
      return {
        energy: 0.8,
        natural: true,
        flow: true
      };
    }

    // Calculate energy metrics
    const totalSize = stats.assets?.reduce((sum, asset) => sum + asset.size, 0) || 0;
    const totalChunks = stats.chunks?.length || 0;
    const duplicates = stats.chunks?.filter(c => c.duplicate)?.length || 0;
    
    // Natural energy calculation
    const sizeEnergy = Math.min(1, 1000000 / (totalSize || 1)); // 1MB baseline
    const chunkEnergy = Math.min(1, 10 / (totalChunks || 1)); // 10 chunks baseline
    const duplicateEnergy = Math.max(0, 1 - (duplicates / (totalChunks || 1)));
    
    const energy = (sizeEnergy + chunkEnergy + duplicateEnergy) / 3;
    
    // Log natural metrics
    console.log('🌱 Build Energy Analysis:');
    console.log(`  Total Size: ${(totalSize / 1024).toFixed(2)}KB (Energy: ${sizeEnergy.toFixed(2)})`);
    console.log(`  Chunks: ${totalChunks} (Energy: ${chunkEnergy.toFixed(2)})`);
    console.log(`  Duplicates: ${duplicates} (Energy: ${duplicateEnergy.toFixed(2)})`);
    console.log(`  Overall Energy: ${energy.toFixed(2)}`);

    return {
      energy,
      natural: energy > 0.4,
      flow: energy > 0.6
    };
  } catch (err) {
    console.error('Flow disruption during analysis:', err);
    process.exit(1);
  }
}

// Run analysis with natural flow
analyzeEnergy().then(result => {
  if (!result.natural) {
    console.log('🛡️ Build energy too low - needs natural optimization');
    process.exit(1);
  }
  process.exit(0);
}); 