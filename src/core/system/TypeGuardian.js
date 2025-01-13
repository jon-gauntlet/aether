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
  energy: number;
  mode: 'active' | 'passive' | 'protective';
  context: string[];
}

export class TypeGuardian {
  private state$ = new BehaviorSubject<TypeGuardianState>({
    isValidating: false,
    lastValidation: Date.now(),
    errors: [],
    typeMap: new Map(),
    healingAttempts: new Map(),
    autonomicRules: new Map(),
    energy: 1.0,
    mode: 'active',
    context: []
  });

  private fileWatcher!: ts.WatchOfConfigFile<ts.BuilderProgram>;
  private execAsync = promisify(exec);
  private readonly MAX_HEALING_ATTEMPTS = 3;
  private readonly ENERGY_DECAY_RATE = 0.1;
  private readonly ENERGY_RECOVERY_RATE = 0.2;

  constructor(private rootDir: string) {
    this.initializeWatcher();
    this.startContinuousValidation();
    this.initializeAutonomicRules();
    this.startEnergyManagement();
  }

  private startEnergyManagement() {
    setInterval(() => {
      const currentState = this.state$.value;
      const newEnergy = Math.max(0, Math.min(1, 
        currentState.energy + 
        (currentState.errors.length > 0 ? -this.ENERGY_DECAY_RATE : this.ENERGY_RECOVERY_RATE)
      ));

      // Update mode based on energy
      const newMode = this.determineMode(newEnergy);

      this.state$.next({
        ...currentState,
        energy: newEnergy,
        mode: newMode
      });
    }, 5000);
  }

  private determineMode(energy: number): 'active' | 'passive' | 'protective' {
    if (energy < 0.3) return 'protective';
    if (energy < 0.7) return 'passive';
    return 'active';
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

    // Rule: Missing exports
    this.state$.value.autonomicRules.set('missingExports', (diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      if (message.includes('has no exported member')) {
        const match = message.match(/member '(.+)'/);
        if (match) {
          const missingExport = match[1];
          return [`export type { ${missingExport} } from './base';`];
        }
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
    console.log(ts.formatDiagnostic(diagnostic, {
      getCanonicalFileName: path => path,
      getCurrentDirectory: () => this.rootDir,
      getNewLine: () => '\n'
    }));
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

  private startContinuousValidation() {
    // Run type check every 2 seconds during development
    if (process.env.NODE_ENV === 'development') {
      setInterval(async () => {
        await this.validateTypes();
      }, 2000);
    }
  }

  private async validateTypes(): Promise<void> {
    // Only validate if we have enough energy
    if (this.state$.value.energy < 0.3) {
      console.log('Energy too low for validation, entering protective mode');
      return;
    }

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

      // If we have errors and enough energy, attempt autonomic healing
      if (errors.length > 0 && this.state$.value.energy >= 0.5) {
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

      // Generate healing fixes based on current mode
      const fixes = await this.generateHealingFixes(error, sourceFile);
      
      // Apply fixes if possible and we have enough energy
      if (fixes.length > 0 && this.state$.value.energy >= 0.3) {
        await this.applyHealingFixes(error.file, fixes);
        this.state$.value.healingAttempts.set(error.file, attempts + 1);
      }
    }
  }

  private async generateHealingFixes(error: TypeValidationResult, sourceFile: ts.SourceFile): Promise<string[]> {
    const fixes: string[] = [];
    
    // Only apply rules appropriate for current mode
    for (const [ruleName, rule] of this.state$.value.autonomicRules) {
      if (this.shouldApplyRule(ruleName)) {
        const diagnostics = this.fileWatcher.getProgram()?.getSyntacticDiagnostics(sourceFile) || [];
        for (const diagnostic of diagnostics) {
          const ruleFixes = rule(diagnostic);
          fixes.push(...ruleFixes);
        }
      }
    }

    return fixes;
  }

  private shouldApplyRule(ruleName: string): boolean {
    const { mode, energy } = this.state$.value;
    
    switch (mode) {
      case 'protective':
        // Only apply safe rules in protective mode
        return ['missingExports'].includes(ruleName);
      case 'passive':
        // Apply non-destructive rules in passive mode
        return ['missingExports', 'missingProperties'].includes(ruleName);
      case 'active':
        // Apply all rules in active mode
        return true;
      default:
        return false;
    }
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

  public observeEnergy(): Observable<number> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  public observeMode(): Observable<'active' | 'passive' | 'protective'> {
    return this.state$.pipe(
      map(state => state.mode),
      distinctUntilChanged()
    );
  }
} 