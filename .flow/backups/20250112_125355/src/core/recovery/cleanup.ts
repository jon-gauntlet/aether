import * as fs from 'fs';
import * as path from 'path';

interface HistoryFile {
  path: string;
  name: string;
  size: number;
  lines: number;
  timestamp: Date;
  content?: string;
}

interface SystemHistory {
  name: string;
  files: HistoryFile[];
  mainFile: string;
  evolutionChain: string[];
}

const SYSTEMS = [
  {
    name: 'Flow',
    dir: 'src/core/flow',
    mainFile: 'FlowSystem.ts',
    patterns: [/SpaceEngine/, /FlowSystem/, /useFlow/, /useFlowPattern/]
  },
  {
    name: 'Field',
    dir: 'src/core/fields',
    mainFile: 'FieldSystem.ts',
    patterns: [/FieldSystem/, /useField/]
  },
  {
    name: 'Protection',
    dir: 'src/core/protection',
    mainFile: 'ProtectionSystem.ts',
    patterns: [/ProtectionSystem/, /useProtection/]
  },
  {
    name: 'Metrics',
    dir: 'src/core/metrics',
    mainFile: 'MetricsSystem.ts',
    patterns: [/MetricsSystem/, /useMetrics/]
  }
];

async function analyzeHistoryFile(filePath: string): Promise<HistoryFile> {
  const content = await fs.promises.readFile(filePath, 'utf8');
  const lines = content.split('\n').length;
  const stats = await fs.promises.stat(filePath);
  
  return {
    path: filePath,
    name: path.basename(filePath),
    size: stats.size,
    lines,
    timestamp: stats.mtime,
    content
  };
}

async function analyzeSystem(system: typeof SYSTEMS[0]): Promise<SystemHistory> {
  const files = await fs.promises.readdir(system.dir);
  const historyFiles: HistoryFile[] = [];
  const evolutionChain: string[] = [];

  for (const file of files) {
    if (file.endsWith('.ts') && file !== system.mainFile) {
      const filePath = path.join(system.dir, file);
      const historyFile = await analyzeHistoryFile(filePath);
      
      // Check if file matches any system patterns
      const matchesPattern = system.patterns.some(pattern => 
        pattern.test(historyFile.content || '')
      );

      if (matchesPattern) {
        historyFiles.push(historyFile);
        evolutionChain.push(file);
      }
    }
  }

  // Sort by timestamp
  historyFiles.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return {
    name: system.name,
    files: historyFiles,
    mainFile: system.mainFile,
    evolutionChain: evolutionChain
  };
}

async function cleanupSystem(history: SystemHistory): Promise<void> {
  const archiveDir = path.join(history.files[0].path, '../.history');
  
  // Create archive directory
  await fs.promises.mkdir(archiveDir, { recursive: true });

  // Move history files to archive
  for (const file of history.files) {
    const archivePath = path.join(archiveDir, file.name);
    await fs.promises.rename(file.path, archivePath);
  }
}

async function main() {
  console.log('Starting system cleanup...');

  for (const system of SYSTEMS) {
    console.log(`\nAnalyzing ${system.name} System...`);
    const history = await analyzeSystem(system);
    
    console.log(`Found ${history.files.length} history files`);
    console.log('Evolution chain:', history.evolutionChain.join(' -> '));
    
    await cleanupSystem(history);
    console.log(`Cleaned up ${system.name} System`);
  }

  console.log('\nCleanup complete!');
}

main().catch(console.error); 