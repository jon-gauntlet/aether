import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, filter } from 'rxjs/operators';
import * as ts from 'typescript';
import * as path from 'path';

export interface ProtectionPattern {
  type: 'structural' | 'semantic' | 'flow';
  scope: 'file' | 'module' | 'system';
  triggers: {
    onEdit: boolean;
    onImport: boolean;
    onExport: boolean;
    onFlow: boolean;
  };
  actions: {
    prevent: string[];
    enforce: string[];
    preserve: string[];
  };
}

export interface ValidationStream {
  source: 'edit' | 'import' | 'flow';
  frequency: number;
  depth: number;
  patterns: string[];
  protection: {
    mode: 'prevent' | 'warn' | 'fix';
    scope: string[];
    rules: string[];
  };
}

export interface ProtectionState {
  mode: 'active' | 'passive' | 'protective';
  energy: number;
  context: string[];
  patterns: ProtectionPattern[];
  invariants: {
    types: Set<string>;
    patterns: Set<string>;
    relationships: Set<string>;
  };
  streams: ValidationStream[];
}

export class ProtectionGuardian {
  private state$ = new BehaviorSubject<ProtectionState>({
    mode: 'active',
    energy: 1.0,
    context: [],
    patterns: [],
    invariants: {
      types: new Set(),
      patterns: new Set(),
      relationships: new Set()
    },
    streams: []
  });

  private readonly CORE_INVARIANTS = [
    'FlowState must have metrics',
    'EnergyState must have level',
    'Protection must have type',
    'BaseMetrics must be normalized'
  ];

  constructor(private program: ts.Program) {
    this.initializeProtectionPatterns();
    this.startContinuousProtection();
  }

  private initializeProtectionPatterns() {
    // Core type structure protection
    this.addProtectionPattern({
      type: 'structural',
      scope: 'system',
      triggers: {
        onEdit: true,
        onImport: true,
        onExport: true,
        onFlow: true
      },
      actions: {
        prevent: [
          'deletion of core types',
          'invalid type extensions',
          'circular dependencies'
        ],
        enforce: [
          'consistent type hierarchy',
          'complete type exports',
          'valid type extensions'
        ],
        preserve: [
          'type relationships',
          'interface contracts',
          'type invariants'
        ]
      }
    });

    // Flow protection
    this.addProtectionPattern({
      type: 'flow',
      scope: 'module',
      triggers: {
        onEdit: true,
        onImport: false,
        onExport: false,
        onFlow: true
      },
      actions: {
        prevent: [
          'invalid flow transitions',
          'energy state violations',
          'context corruption'
        ],
        enforce: [
          'flow state consistency',
          'energy conservation',
          'context preservation'
        ],
        preserve: [
          'flow patterns',
          'energy states',
          'context depth'
        ]
      }
    });

    // Semantic protection
    this.addProtectionPattern({
      type: 'semantic',
      scope: 'file',
      triggers: {
        onEdit: true,
        onImport: true,
        onExport: true,
        onFlow: false
      },
      actions: {
        prevent: [
          'semantic inconsistencies',
          'invalid type usage',
          'pattern violations'
        ],
        enforce: [
          'semantic coherence',
          'pattern consistency',
          'type relationships'
        ],
        preserve: [
          'semantic meaning',
          'type intentions',
          'pattern context'
        ]
      }
    });
  }

  private startContinuousProtection() {
    // Create validation streams
    this.addValidationStream({
      source: 'edit',
      frequency: 1000,
      depth: 1,
      patterns: ['structural', 'semantic'],
      protection: {
        mode: 'prevent',
        scope: ['file', 'module'],
        rules: this.CORE_INVARIANTS
      }
    });

    this.addValidationStream({
      source: 'flow',
      frequency: 2000,
      depth: 2,
      patterns: ['flow', 'semantic'],
      protection: {
        mode: 'warn',
        scope: ['module', 'system'],
        rules: ['flow consistency', 'energy conservation']
      }
    });

    // Start continuous validation
    setInterval(() => {
      this.validateStreams();
    }, 1000);
  }

  private validateStreams() {
    const { streams, energy, mode } = this.state$.value;

    streams.forEach(stream => {
      if (this.shouldValidateStream(stream, energy, mode)) {
        this.validateStream(stream);
      }
    });
  }

  private shouldValidateStream(
    stream: ValidationStream,
    energy: number,
    mode: 'active' | 'passive' | 'protective'
  ): boolean {
    // Only validate if we have enough energy
    if (energy < 0.3) return false;

    // In protective mode, only validate prevent streams
    if (mode === 'protective' && stream.protection.mode !== 'prevent') {
      return false;
    }

    // In passive mode, don't validate fix streams
    if (mode === 'passive' && stream.protection.mode === 'fix') {
      return false;
    }

    return true;
  }

  private validateStream(stream: ValidationStream) {
    const sourceFiles = this.program.getSourceFiles();
    const { invariants } = this.state$.value;

    sourceFiles.forEach(sourceFile => {
      // Skip declaration files
      if (sourceFile.isDeclarationFile) return;

      // Validate based on stream type
      switch (stream.source) {
        case 'edit':
          this.validateEdits(sourceFile, stream, invariants);
          break;
        case 'import':
          this.validateImports(sourceFile, stream, invariants);
          break;
        case 'flow':
          this.validateFlow(sourceFile, stream, invariants);
          break;
      }
    });
  }

  private validateEdits(
    sourceFile: ts.SourceFile,
    stream: ValidationStream,
    invariants: ProtectionState['invariants']
  ) {
    // Validate type structure
    ts.forEachChild(sourceFile, node => {
      if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        this.validateTypeStructure(node, invariants);
      }
    });
  }

  private validateImports(
    sourceFile: ts.SourceFile,
    stream: ValidationStream,
    invariants: ProtectionState['invariants']
  ) {
    // Validate import consistency
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node)) {
        this.validateImportStructure(node, invariants);
      }
    });
  }

  private validateFlow(
    sourceFile: ts.SourceFile,
    stream: ValidationStream,
    invariants: ProtectionState['invariants']
  ) {
    // Validate flow patterns
    ts.forEachChild(sourceFile, node => {
      if (ts.isClassDeclaration(node)) {
        this.validateFlowPatterns(node, invariants);
      }
    });
  }

  private validateTypeStructure(
    node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration,
    invariants: ProtectionState['invariants']
  ) {
    const typeName = node.name.text;

    // Prevent deletion of core types
    if (this.CORE_INVARIANTS.some(inv => inv.includes(typeName))) {
      invariants.types.add(typeName);
    }

    // Validate type extensions
    if (ts.isInterfaceDeclaration(node) && node.heritageClauses) {
      node.heritageClauses.forEach(clause => {
        clause.types.forEach(t => {
          const baseType = t.expression.getText();
          invariants.relationships.add(`${typeName} extends ${baseType}`);
        });
      });
    }
  }

  private validateImportStructure(
    node: ts.ImportDeclaration,
    invariants: ProtectionState['invariants']
  ) {
    const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
    
    // Validate core imports
    if (importPath.includes('/types/')) {
      if (node.importClause && node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach(element => {
            invariants.types.add(element.name.text);
          });
        }
      }
    }
  }

  private validateFlowPatterns(
    node: ts.ClassDeclaration,
    invariants: ProtectionState['invariants']
  ) {
    if (!node.name) return;

    const className = node.name.text;
    
    // Validate flow-related classes
    if (className.includes('Flow') || className.includes('Energy')) {
      node.members.forEach(member => {
        if (ts.isMethodDeclaration(member) && member.name) {
          const methodName = member.name.getText();
          invariants.patterns.add(`${className}.${methodName}`);
        }
      });
    }
  }

  public addProtectionPattern(pattern: ProtectionPattern) {
    this.state$.next({
      ...this.state$.value,
      patterns: [...this.state$.value.patterns, pattern]
    });
  }

  public addValidationStream(stream: ValidationStream) {
    this.state$.next({
      ...this.state$.value,
      streams: [...this.state$.value.streams, stream]
    });
  }

  public observeProtection(): Observable<ProtectionState> {
    return this.state$.asObservable();
  }

  public getInvariants(): ProtectionState['invariants'] {
    return this.state$.value.invariants;
  }
} 