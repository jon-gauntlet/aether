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
  suggestedFixes?: string[];
}

interface TypeGuardianState {
  isValidating: boolean;
  lastValidation: number;
  errors: TypeValidationResult[];
  typeMap: Map<string, Set<string>>;
  healingAttempts: Map<string, number>;
  autonomicRules: Map<string, (diagnostic: ts.Diagnostic) => string[]>;
}

export class TypeGuardian {
  private state$ = new BehaviorSubject<TypeGuardianState>({
    isValidating: false,
    lastValidation: Date.now(),
    errors: [],
    typeMap: new Map(),
    healingAttempts: new Map(),
    autonomicRules: new Map()
  });

  private fileWatcher: ts.WatchOfConfigFile<ts.BuilderProgram>;
  private execAsync = promisify(exec);
  private readonly MAX_HEALING_ATTEMPTS = 3;

  constructor(private rootDir: string) {
    this.initializeWatcher();
    this.startContinuousValidation();
    this.initializeAutonomicRules();
  }

  private initializeAutonomicRules() {
    // Rule: Missing properties in interface
    this.state$.value.autonomicRules.set('missingProperties', (diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      const match = message.match(/Property '(.+)' is missing/);
      if (match) {
        const missingProp = match[1];
        return [`${missingProp}: any; // Auto-added by TypeGuardian`];
      }
      return [];
    });

    // Rule: Type mismatch
    this.state$.value.autonomicRules.set('typeMismatch', (diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      if (message.includes('is not assignable to type')) {
        return ['// @ts-ignore // Temporarily suppressed by TypeGuardian - needs review'];
      }
      return [];
    });
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
      {
        noEmit: true,
        strict: true,
        isolatedModules: true
      },
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

      // If we have errors, attempt autonomic healing
      if (errors.length > 0) {
        await this.attemptAutonomicHealing(errors);
      }
    }
  }

  private async attemptAutonomicHealing(errors: TypeValidationResult[]) {
    const program = this.fileWatcher.getProgram();
    if (!program) return;

    for (const error of errors) {
      const attempts = this.state$.value.healingAttempts.get(error.file) || 0;
      if (attempts >= this.MAX_HEALING_ATTEMPTS) {
        console.warn(`Max healing attempts reached for ${error.file}`);
        continue;
      }

      const sourceFile = program.getSourceFile(error.file);
      if (!sourceFile) continue;

      // Generate healing fixes
      const fixes = await this.generateHealingFixes(error, sourceFile);
      
      // Apply fixes if possible
      if (fixes.length > 0) {
        await this.applyHealingFixes(error.file, fixes);
        this.state$.value.healingAttempts.set(error.file, attempts + 1);
      }
    }
  }

  private async generateHealingFixes(error: TypeValidationResult, sourceFile: ts.SourceFile): Promise<string[]> {
    const fixes: string[] = [];
    
    for (const [ruleName, rule] of this.state$.value.autonomicRules) {
      const diagnostics = this.fileWatcher.getProgram()?.getSyntacticDiagnostics(sourceFile) || [];
      for (const diagnostic of diagnostics) {
        const ruleFixes = rule(diagnostic);
        fixes.push(...ruleFixes);
      }
    }

    return fixes;
  }

  private async applyHealingFixes(file: string, fixes: string[]) {
    // Apply fixes through your file editing system
    console.log(`TypeGuardian would apply fixes to ${file}:`, fixes);
  }

  // Public API
  public observeValidation(): Observable<TypeValidationResult[]> {
    return this.state$.pipe(
      map(state => state.errors),
      distinctUntilChanged()
    );
  }

  public getTypeMap(): Map<string, Set<string>> {
    return this.state$.value.typeMap;
  }

  public addAutonomicRule(name: string, rule: (diagnostic: ts.Diagnostic) => string[]) {
    this.state$.value.autonomicRules.set(name, rule);
  }

  public getHealingAttempts(file: string): number {
    return this.state$.value.healingAttempts.get(file) || 0;
  }
} 