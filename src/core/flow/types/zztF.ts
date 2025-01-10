import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { NaturalFlow } from './NaturalFlow';

interface NavigationNode {
  id: string;
  depth: number;
  energy: number;
  connections: Map<string, number>; // Target node ID -> Connection strength
}

interface NavigationPath {
  nodes: string[];
  strength: number;
  depth: number;
}

export class NaturalNavigation {
  private nodes: Map<string, NavigationNode>;
  private paths: BehaviorSubject<NavigationPath[]>;
  private flow: NaturalFlow;
  
  private readonly PATH_THRESHOLD = 0.3;
  private readonly CONNECTION_STRENGTH = 0.1;
  private readonly ENERGY_DECAY = 0.95;

  constructor(flow: NaturalFlow) {
    this.flow = flow;
    this.nodes = new Map();
    this.paths = new BehaviorSubject<NavigationPath[]>([]);
    
    // Observe flow changes to adapt navigation
    this.flow.observeDepth().subscribe(depth => {
      this.adaptToDepth(depth);
    });
  }

  // Record navigation to node
  async navigateTo(nodeId: string) {
    const previousNode = Array.from(this.nodes.values())
      .find(node => node.energy > 0.8);
      
    // Create or update target node
    let node = this.nodes.get(nodeId);
    if (!node) {
      node = {
        id: nodeId,
        depth: 0,
        energy: 1,
        connections: new Map()
      };
      this.nodes.set(nodeId, node);
    } else {
      node.energy = Math.min(1, node.energy + 0.2);
    }

    // Strengthen connection if coming from another node
    if (previousNode) {
      const currentStrength = previousNode.connections.get(nodeId) || 0;
      previousNode.connections.set(
        nodeId,
        Math.min(1, currentStrength + this.CONNECTION_STRENGTH)
      );
      
      // Update paths
      this.updatePaths();
    }

    // Natural state transition
    await this.flow.transitionTo({
      depth: node.depth,
      energy: node.energy
    });
  }

  // Adapt navigation to current depth
  private adaptToDepth(depth: number) {
    // Deeper states prefer stronger paths
    this.paths.next(
      this.paths.value
        .filter(path => path.strength > this.PATH_THRESHOLD + depth * 0.3)
        .map(path => ({
          ...path,
          depth: Math.max(path.depth, depth)
        }))
    );
  }

  // Update natural paths
  private updatePaths() {
    const newPaths: NavigationPath[] = [];
    
    // Find paths between high-energy nodes
    const activeNodes = Array.from(this.nodes.values())
      .filter(node => node.energy > 0.5);
      
    activeNodes.forEach(start => {
      this.findPaths(start, [], 0).forEach(path => {
        if (path.strength > this.PATH_THRESHOLD) {
          newPaths.push(path);
        }
      });
    });

    this.paths.next(newPaths);
  }

  // Recursively find paths from node
  private findPaths(
    node: NavigationNode,
    visited: string[],
    depth: number
  ): NavigationPath[] {
    if (depth > 3) return []; // Limit path depth
    
    const paths: NavigationPath[] = [];
    const currentPath = [...visited, node.id];
    
    // Add current path if it ends in a high-energy node
    if (visited.length > 0 && node.energy > 0.5) {
      paths.push({
        nodes: currentPath,
        strength: this.calculatePathStrength(currentPath),
        depth: this.calculatePathDepth(currentPath)
      });
    }

    // Explore connections
    node.connections.forEach((strength, targetId) => {
      if (!visited.includes(targetId) && strength > this.PATH_THRESHOLD) {
        const targetNode = this.nodes.get(targetId);
        if (targetNode) {
          paths.push(
            ...this.findPaths(targetNode, currentPath, depth + 1)
          );
        }
      }
    });

    return paths;
  }

  // Calculate natural path strength
  private calculatePathStrength(nodeIds: string[]): number {
    let strength = 1;
    
    for (let i = 1; i < nodeIds.length; i++) {
      const node = this.nodes.get(nodeIds[i - 1]);
      const connection = node?.connections.get(nodeIds[i]) || 0;
      strength *= connection;
    }

    return Math.pow(strength, 1 / nodeIds.length);
  }

  // Calculate natural path depth
  private calculatePathDepth(nodeIds: string[]): number {
    return Math.max(
      ...nodeIds.map(id => this.nodes.get(id)?.depth || 0)
    );
  }

  // Get suggested paths from current node
  getSuggestedPaths(nodeId: string): NavigationPath[] {
    return this.paths.value
      .filter(path => path.nodes.includes(nodeId))
      .sort((a, b) => b.strength - a.strength);
  }

  // Get natural next steps
  getNextSteps(nodeId: string): string[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return Array.from(node.connections.entries())
      .filter(([_, strength]) => strength > this.PATH_THRESHOLD)
      .sort(([_, a], [__, b]) => b - a)
      .map(([id]) => id);
  }

  // Observe path changes
  observePaths(): Observable<NavigationPath[]> {
    return this.paths.asObservable();
  }

  // Natural cleanup
  private cleanup() {
    // Decay node energy
    this.nodes.forEach(node => {
      node.energy *= this.ENERGY_DECAY;
      
      // Remove weak connections
      node.connections.forEach((strength, targetId) => {
        if (strength < 0.1) {
          node.connections.delete(targetId);
        }
      });
    });

    // Remove inactive nodes
    this.nodes.forEach((node, id) => {
      if (node.energy < 0.1 && node.connections.size === 0) {
        this.nodes.delete(id);
      }
    });

    // Update paths after cleanup
    this.updatePaths();
  }
} 