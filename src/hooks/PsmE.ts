import { EnergyField, InformationParticle, FlowField, Attractor, Bond, Vector3D } from './types';

export class Flow {
  private field: FlowField;
  
  constructor() {
    this.field = {
      particles: [],
      energyFields: [],
      gradients: new Map(),
      barriers: [],
      attractors: []
    };
  }

  // Add information to the flow
  send(content: any, initial: Vector3D): InformationParticle {
    const particle: InformationParticle = {
      id: this.createId(),
      content,
      energy: 1,
      momentum: initial,
      spin: 0,
      lifetime: 1,
      bonds: []
    };

    this.field.particles.push(particle);
    this.balance();
    return particle;
  }

  // Create space for focused work
  focus(position: Vector3D): Attractor {
    const attractor: Attractor = {
      id: this.createId(),
      position,
      strength: 0.7,
      type: 'focus',
      resonance: [0.8, 0.3, 0.1]  // Attracts focused work
    };

    this.field.attractors.push(attractor);
    return attractor;
  }

  // Create space for discussion
  gather(position: Vector3D): Attractor {
    const attractor: Attractor = {
      id: this.createId(),
      position,
      strength: 0.5,
      type: 'discussion',
      resonance: [0.3, 0.8, 0.5]  // Attracts conversation
    };

    this.field.attractors.push(attractor);
    return attractor;
  }

  // Connect related information
  connect(a: string, b: string, type: Bond['type'] = 'context') {
    const source = this.field.particles.find(p => p.id === a);
    const target = this.field.particles.find(p => p.id === b);

    if (source && target) {
      const bond: Bond = {
        source: a,
        target: b,
        strength: 0.5,
        type,
        energy: Math.min(source.energy, target.energy)
      };

      source.bonds.push(bond);
      target.bonds.push(bond);
      this.balance();
    }
  }

  // Natural flow maintenance
  private balance() {
    // Let energy find its natural level
    this.field.particles.forEach(p => {
      // Adjust based on connections
      const bondEnergy = p.bonds.reduce((sum, b) => sum + b.energy, 0);
      p.energy = Math.min(1, p.energy + (bondEnergy * 0.1));

      // Decay over time
      p.lifetime *= 0.99;
      if (p.lifetime < 0.1) {
        p.energy *= 0.95;
      }

      // Respond to attractors
      this.field.attractors.forEach(a => {
        const distance = this.distance(p.momentum, a.position);
        if (distance < 5) {
          p.energy = Math.min(1, p.energy + (a.strength * 0.1));
        }
      });
    });

    // Remove depleted particles
    this.field.particles = this.field.particles.filter(p => 
      p.energy > 0.1 && p.lifetime > 0.1
    );

    // Update energy fields
    this.field.energyFields = this.field.particles.map(p => ({
      id: p.id,
      intensity: p.energy,
      velocity: p.momentum,
      gravity: p.bonds.length * 0.1,
      wavelength: p.spin,
      charge: p.lifetime > 0.5 ? 1 : -1
    }));
  }

  private createId(): string {
    return `f${Date.now()}${Math.random().toString(36).slice(2)}`;
  }

  private distance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
} 