import { Flow, Message, Field, Center, Connection, Point } from './types';

export class Stream {
  private field: Field;
  
  constructor() {
    this.field = {
      messages: [],
      flows: [],
      paths: new Map(),
      bounds: [],
      centers: []
    };
  }

  // Share new information
  share(content: any, place: Point): Message {
    const message: Message = {
      id: this.createId(),
      content,
      vitality: 1,
      movement: place,
      activity: 0,
      presence: 1,
      ties: []
    };

    this.field.messages.push(message);
    this.tend();
    return message;
  }

  // Create space for deep work
  deepen(place: Point): Center {
    const center: Center = {
      id: this.createId(),
      place,
      strength: 0.7,
      kind: 'deep',
      harmony: [0.8, 0.3, 0.1]  // Draws deep work
    };

    this.field.centers.push(center);
    return center;
  }

  // Create space for lively discussion
  gather(place: Point): Center {
    const center: Center = {
      id: this.createId(),
      place,
      strength: 0.5,
      kind: 'lively',
      harmony: [0.3, 0.8, 0.5]  // Draws conversation
    };

    this.field.centers.push(center);
    return center;
  }

  // Connect related messages
  tie(a: string, b: string, kind: Connection['kind'] = 'theme') {
    const from = this.field.messages.find(m => m.id === a);
    const to = this.field.messages.find(m => m.id === b);

    if (from && to) {
      const connection: Connection = {
        from: a,
        to: b,
        strength: 0.5,
        kind,
        flow: Math.min(from.vitality, to.vitality)
      };

      from.ties.push(connection);
      to.ties.push(connection);
      this.tend();
    }
  }

  // Natural maintenance
  private tend() {
    // Let vitality find its level
    this.field.messages.forEach(m => {
      // Strengthen through connections
      const tieFlow = m.ties.reduce((sum, t) => sum + t.flow, 0);
      m.vitality = Math.min(1, m.vitality + (tieFlow * 0.1));

      // Natural fading
      m.presence *= 0.99;
      if (m.presence < 0.1) {
        m.vitality *= 0.95;
      }

      // Response to centers
      this.field.centers.forEach(c => {
        const space = this.span(m.movement, c.place);
        if (space < 5) {
          m.vitality = Math.min(1, m.vitality + (c.strength * 0.1));
        }
      });
    });

    // Let go of faded messages
    this.field.messages = this.field.messages.filter(m => 
      m.vitality > 0.1 && m.presence > 0.1
    );

    // Update flows
    this.field.flows = this.field.messages.map(m => ({
      id: m.id,
      strength: m.vitality,
      direction: m.movement,
      draw: m.ties.length * 0.1,
      nature: m.activity,
      effect: m.presence > 0.5 ? 1 : -1
    }));
  }

  private createId(): string {
    return `f${Date.now()}${Math.random().toString(36).slice(2)}`;
  }

  private span(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
} 