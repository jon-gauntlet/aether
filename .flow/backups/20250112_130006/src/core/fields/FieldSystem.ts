import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export interface FieldState {
  fields: Field[];
  activeField: Field | null;
  isStable: boolean;
  totalStrength: number;
}

export class FieldSystem {
  private state$: BehaviorSubject<FieldState>;
  private consciousness: ConsciousnessState;

  constructor(initialState?: Partial<FieldState>) {
    this.state$ = new BehaviorSubject<FieldState>({
      fields: [],
      activeField: null,
      isStable: true,
      totalStrength: 0,
      ...initialState
    });
  }

  public addField(field: Field): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      fields: [...currentState.fields, field],
      totalStrength: this.calculateTotalStrength([...currentState.fields, field])
    });
  }

  public removeField(fieldId: string): void {
    const currentState = this.state$.getValue();
    const updatedFields = currentState.fields.filter(f => f.id !== fieldId);
    
    this.state$.next({
      ...currentState,
      fields: updatedFields,
      activeField: currentState.activeField?.id === fieldId ? null : currentState.activeField,
      totalStrength: this.calculateTotalStrength(updatedFields)
    });
  }

  public activateField(fieldId: string): boolean {
    const currentState = this.state$.getValue();
    const field = currentState.fields.find(f => f.id === fieldId);
    
    if (field && field.strength > 0.5) {
      this.state$.next({
        ...currentState,
        activeField: field,
        isStable: this.checkStability(field)
      });
      return true;
    }
    
    return false;
  }

  public updateField(fieldId: string, updates: Partial<Field>): void {
    const currentState = this.state$.getValue();
    const updatedFields = currentState.fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    );

    this.state$.next({
      ...currentState,
      fields: updatedFields,
      totalStrength: this.calculateTotalStrength(updatedFields)
    });
  }

  public getFieldState(): Observable<FieldState> {
    return this.state$.asObservable();
  }

  public setConsciousness(consciousness: ConsciousnessState): void {
    this.consciousness = consciousness;
    this.updateStability();
  }

  private calculateTotalStrength(fields: Field[]): number {
    return fields.reduce((sum, field) => sum + field.strength, 0);
  }

  private checkStability(field: Field): boolean {
    if (!this.consciousness) return true;
    
    const { flowSpace } = this.consciousness;
    return field.strength * flowSpace.stability > 0.7;
  }

  private updateStability(): void {
    const currentState = this.state$.getValue();
    if (currentState.activeField) {
      this.state$.next({
        ...currentState,
        isStable: this.checkStability(currentState.activeField)
      });
    }
  }
} 