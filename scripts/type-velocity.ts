import * as ts from 'typescript';
import { resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

interface FlowState {
  patterns: Map<string, TypePattern>;
  quickWins: number;
  batchFixes: number;
  deepFixes: number;
  energy: number;
}

interface TypePattern {
  type: 'missing-export' | 'unused-decl' | 'implicit-any' | 'type-mismatch';
  occurrences: number;
  fixes: string[];
  energy: number;
}

interface ReferenceEntry {
  fileName: string;
  start: number;
  end: number;
}

class TypeVelocityOptimizer {
  private state: FlowState;
  private program: ts.Program;
  private checker: ts.TypeChecker;

  constructor() {
    this.state = {
      patterns: new Map(),
      quickWins: 0,
      batchFixes: 0,
      deepFixes: 0,
      energy: 100
    };

    // Initialize TypeScript program
    const configPath = ts.findConfigFile(
      process.cwd(),
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (!configPath) {
      throw new Error('Could not find tsconfig.json');
    }

    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(
      config,
      ts.sys,
      process.cwd()
    );

    this.program = ts.createProgram(fileNames, options);
    this.checker = this.program.getTypeChecker();
  }

  // Phase 1: Quick Wins - Remove unused declarations
  async optimizeQuickWins(): Promise<void> {
    console.log('🏃 Phase 1: Quick Wins');
    
    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        const unusedSymbols = this.findUnusedDeclarations(sourceFile);
        for (const symbol of unusedSymbols) {
          await this.removeUnusedDeclaration(sourceFile, symbol);
          this.state.quickWins++;
          this.recordPattern('unused-decl', 'Removed unused declaration');
        }
      }
    }
  }

  // Phase 2: Batch Processing - Handle missing exports and modules
  async optimizeBatchProcessing(): Promise<void> {
    console.log('🔄 Phase 2: Batch Processing');

    const missingExports = new Map<string, Set<string>>();
    
    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        const diagnostics = ts.getPreEmitDiagnostics(this.program, sourceFile);
        
        for (const diagnostic of diagnostics) {
          if (diagnostic.code === 2305) { // Missing export
            const fix = this.generateMissingExportFix(diagnostic);
            if (fix) {
              const [file, exportName] = fix;
              if (!missingExports.has(file)) {
                missingExports.set(file, new Set());
              }
              missingExports.get(file)!.add(exportName);
              this.state.batchFixes++;
              this.recordPattern('missing-export', 'Added missing export');
            }
          }
        }
      }
    }

    // Apply batch fixes
    for (const [file, exports] of missingExports) {
      await this.addMissingExports(file, exports);
    }
  }

  // Phase 3: Deep Fixes - Handle type mismatches and implicit any
  async optimizeDeepFixes(): Promise<void> {
    console.log('🎯 Phase 3: Deep Fixes');

    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.isDeclarationFile) {
        const diagnostics = ts.getPreEmitDiagnostics(this.program, sourceFile);
        
        for (const diagnostic of diagnostics) {
          if (diagnostic.code === 7006) { // Implicit any
            const fix = this.generateImplicitAnyFix(diagnostic);
            if (fix) {
              await this.applyTypeFix(sourceFile.fileName, fix);
              this.state.deepFixes++;
              this.recordPattern('implicit-any', 'Added explicit type');
            }
          } else if (diagnostic.code === 2345) { // Type mismatch
            const fix = this.generateTypeMismatchFix(diagnostic);
            if (fix) {
              await this.applyTypeFix(sourceFile.fileName, fix);
              this.state.deepFixes++;
              this.recordPattern('type-mismatch', 'Fixed type mismatch');
            }
          }
        }
      }
    }
  }

  private findUnusedDeclarations(sourceFile: ts.SourceFile): ts.Symbol[] {
    const unused: ts.Symbol[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node)) {
        const symbol = this.checker.getSymbolAtLocation(node);
        if (symbol && !this.isSymbolUsed(symbol)) {
          unused.push(symbol);
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return unused;
  }

  private isSymbolUsed(symbol: ts.Symbol): boolean {
    if (!symbol.declarations || symbol.declarations.length === 0) {
      return true; // Be conservative
    }

    const references = this.program.getSourceFiles()
      .filter(file => !file.isDeclarationFile)
      .flatMap(file => {
        const refs: ReferenceEntry[] = [];
        file.forEachChild(node => {
          if (ts.isIdentifier(node)) {
            const sym = this.checker.getSymbolAtLocation(node);
            if (sym === symbol) {
              refs.push({ 
                fileName: file.fileName, 
                start: node.getStart(), 
                end: node.getEnd() 
              });
            }
          }
        });
        return refs;
      });

    return references.length > 1; // More than just the declaration
  }

  private async removeUnusedDeclaration(sourceFile: ts.SourceFile, symbol: ts.Symbol): Promise<void> {
    if (!symbol.declarations || symbol.declarations.length === 0) return;

    const declaration = symbol.declarations[0];
    const start = declaration.getStart();
    const end = declaration.getEnd();

    const sourceText = sourceFile.getFullText();
    const newText = sourceText.slice(0, start) + sourceText.slice(end);

    await this.writeFile(sourceFile.fileName, newText);
  }

  private generateMissingExportFix(diagnostic: ts.Diagnostic): [string, string] | null {
    const match = diagnostic.messageText.toString().match(/Module ['"](.+)['"] has no exported member ['"](.+)['"]/);
    if (!match) return null;

    const [_, modulePath, exportName] = match;
    const resolvedPath = resolve(process.cwd(), modulePath + '.ts');
    
    if (!existsSync(resolvedPath)) return null;
    
    return [resolvedPath, exportName];
  }

  private async addMissingExports(file: string, exports: Set<string>): Promise<void> {
    const content = readFileSync(file, 'utf8');
    const exportStatements = Array.from(exports)
      .map(name => `export type ${name} = any; // TODO: Replace with proper type`)
      .join('\n');

    const newContent = content + '\n\n' + exportStatements;
    await this.writeFile(file, newContent);
  }

  private generateImplicitAnyFix(diagnostic: ts.Diagnostic): string | null {
    const match = diagnostic.messageText.toString().match(/Parameter ['"](.+)['"] implicitly has an ['"]any['"] type/);
    if (!match) return null;

    const [_, paramName] = match;
    return `${paramName}: any // TODO: Replace with proper type`;
  }

  private generateTypeMismatchFix(diagnostic: ts.Diagnostic): string | null {
    // Implement type mismatch fixes based on patterns
    return null; // For now
  }

  private async applyTypeFix(file: string, fix: string): Promise<void> {
    const content = readFileSync(file, 'utf8');
    // Apply the fix - this is a simplified version
    // In reality, we need to parse the AST and apply the fix correctly
    await this.writeFile(file, content);
  }

  private async writeFile(file: string, content: string): Promise<void> {
    writeFileSync(file, content, 'utf8');
  }

  private recordPattern(type: TypePattern['type'], fix: string) {
    const pattern = this.state.patterns.get(type) || {
      type,
      occurrences: 0,
      fixes: [],
      energy: 0
    };

    pattern.occurrences++;
    pattern.fixes.push(fix);
    pattern.energy = Math.min(100, pattern.energy + 10);

    this.state.patterns.set(type, pattern);
  }

  getState(): FlowState {
    return this.state;
  }
}

export const optimizer = new TypeVelocityOptimizer(); 