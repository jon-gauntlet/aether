import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';
import * as ts from 'typescript';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  file: string;
  timestamp: number;
}

interface TypeGuardianState {
  isValidating: boolean;
  lastValidation: number;
  errors: TypeValidationResult[];
  typeMap: Map<string, Set<string>>;
}

export class TypeGuardian {
  private state$ = new BehaviorSubject<TypeGuardianState>({
    isValidating: false,
    lastValidation: Date.now(),
    errors: [],
    typeMap: new Map()
  });

  private fileWatcher: ts.WatchOfConfigFile<ts.BuilderProgram>;
  private execAsync = promisify(exec);

  constructor(private rootDir: string) {
    this.initializeWatcher();
    this.startContinuousValidation();
  }

  private initializeWatcher() {
    const configPath = ts.findConfigFile(
      this.rootDir,
      ts.sys.fileExists,
      'tsconfig.json'
    );

    if (!configPath) {
      throw new Error('Could not find tsconfig.json');
    }

    const host = ts.createWatchCompilerHost(
      configPath,
      {},
      ts.sys,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      this.reportDiagnostic.bind(this),
      this.reportWatchStatus.bind(this)
    );

    this.fileWatcher = ts.createWatchProgram(host);
  }

  private startContinuousValidation() {
    // Run type check every 2 seconds during development
    if (process.env.NODE_ENV === 'development') {
      setInterval(async () => {
        await this.validateTypes();
      }, 2000);
    }
  }

  private async validateTypes(): Promise<void> {
    this.state$.next({
      ...this.state$.value,
      isValidating: true
    });

    try {
      // Run tsc in noEmit mode to check types
      await this.execAsync('tsc --noEmit');
      
      this.state$.next({
        ...this.state$.value,
        isValidating: false,
        lastValidation: Date.now(),
        errors: []
      });
    } catch (error: any) {
      // Parse tsc output for errors
      const errors = this.parseTscOutput(error.stdout);
      
      this.state$.next({
        ...this.state$.value,
        isValidating: false,
        lastValidation: Date.now(),
        errors
      });

      // If we have errors, attempt automatic fixes
      if (errors.length > 0) {
        await this.attemptAutoFix(errors);
      }
    }
  }

  private parseTscOutput(output: string): TypeValidationResult[] {
    return output
      .split('\n')
      .filter(line => line.includes('error TS'))
      .map(error => {
        const [file, ...message] = error.split(':');
        return {
          isValid: false,
          errors: [message.join(':').trim()],
          file: path.relative(this.rootDir, file),
          timestamp: Date.now()
        };
      });
  }

  private async attemptAutoFix(errors: TypeValidationResult[]) {
    const program = this.fileWatcher.getProgram();
    if (!program) return;

    for (const error of errors) {
      const sourceFile = program.getSourceFile(error.file);
      if (!sourceFile) continue;

      // Analyze imports and types
      const imports = this.analyzeImports(sourceFile);
      const types = this.analyzeTypes(sourceFile);

      // Update type map
      this.updateTypeMap(error.file, imports, types);

      // Generate fixes
      const fixes = this.generateFixes(error, imports, types);
      
      // Apply fixes if possible
      if (fixes.length > 0) {
        await this.applyFixes(error.file, fixes);
      }
    }
  }

  private analyzeImports(sourceFile: ts.SourceFile): Set<string> {
    const imports = new Set<string>();
    
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
        imports.add(importPath);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return imports;
  }

  private analyzeTypes(sourceFile: ts.SourceFile): Set<string> {
    const types = new Set<string>();
    
    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        types.add(node.name.text);
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
    return types;
  }

  private updateTypeMap(file: string, imports: Set<string>, types: Set<string>) {
    this.state$.next({
      ...this.state$.value,
      typeMap: new Map([
        ...this.state$.value.typeMap,
        [file, types]
      ])
    });
  }

  private generateFixes(
    error: TypeValidationResult,
    imports: Set<string>,
    types: Set<string>
  ): string[] {
    const fixes: string[] = [];
    
    // Analyze error patterns and generate appropriate fixes
    for (const errorMsg of error.errors) {
      if (errorMsg.includes('no exported member')) {
        const missingType = errorMsg.match(/member '(\w+)'/)?.[1];
        if (missingType) {
          // Find file that exports this type
          for (const [file, fileTypes] of this.state$.value.typeMap) {
            if (fileTypes.has(missingType)) {
              fixes.push(`import { ${missingType} } from '${file}';`);
              break;
            }
          }
        }
      }
    }

    return fixes;
  }

  private async applyFixes(file: string, fixes: string[]) {
    // Apply fixes through your file editing system
    // This would integrate with your existing edit_file functionality
    console.log(`Would apply fixes to ${file}:`, fixes);
  }

  private reportDiagnostic(diagnostic: ts.Diagnostic) {
    const errors = this.state$.value.errors;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    
    if (diagnostic.file) {
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      
      errors.push({
        isValid: false,
        errors: [`Line ${line + 1}, Column ${character + 1}: ${message}`],
        file: diagnostic.file.fileName,
        timestamp: Date.now()
      });
    }

    this.state$.next({
      ...this.state$.value,
      errors
    });
  }

  private reportWatchStatus(diagnostic: ts.Diagnostic) {
    // Handle watch status changes
  }

  // Public API
  public observeValidation(): Observable<TypeValidationResult[]> {
    return this.state$.pipe(
      map(state => state.errors),
      distinctUntilChanged()
    );
  }

  public async validateFile(file: string): Promise<TypeValidationResult> {
    const program = this.fileWatcher.getProgram();
    if (!program) {
      return {
        isValid: false,
        errors: ['No program available'],
        file,
        timestamp: Date.now()
      };
    }

    const sourceFile = program.getSourceFile(file);
    if (!sourceFile) {
      return {
        isValid: false,
        errors: ['File not found in program'],
        file,
        timestamp: Date.now()
      };
    }

    const diagnostics = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile)
    ];

    return {
      isValid: diagnostics.length === 0,
      errors: diagnostics.map(d => 
        ts.flattenDiagnosticMessageText(d.messageText, '\n')
      ),
      file,
      timestamp: Date.now()
    };
  }

  public getTypeMap(): Map<string, Set<string>> {
    return this.state$.value.typeMap;
  }
} 