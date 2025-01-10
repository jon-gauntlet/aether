import { useEffect, useState } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';

interface Path {
  nodes: string[];
  strength: number;
}

class NavigationEngine {
  private paths = new BehaviorSubject<Path[]>([]);
  private currentNode = new BehaviorSubject<string>('start');

  public observePaths(): Observable<Path[]> {
    return this.paths.asObservable();
  }

  public getNextSteps(node: string): string[] {
    return this.paths.value
      .filter(path => path.nodes.includes(node))
      .flatMap(path => {
        const index = path.nodes.indexOf(node);
        return index < path.nodes.length - 1 ? [path.nodes[index + 1]] : [];
      });
  }

  public navigateTo(node: string) {
    this.currentNode.next(node);
  }

  public addPath(nodes: string[], strength: number = 1) {
    const newPaths = [...this.paths.value, { nodes, strength }];
    this.paths.next(newPaths);
  }
}

const navigationEngine = new NavigationEngine();

export function useNavigation() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentNode, setCurrentNode] = useState<string>('start');

  useEffect(() => {
    const subscription = navigationEngine.observePaths()
      .subscribe(setPaths);
    return () => subscription.unsubscribe();
  }, []);

  return {
    paths,
    currentNode,
    observePaths: () => navigationEngine.observePaths(),
    getNextSteps: (node: string) => navigationEngine.getNextSteps(node),
    navigateTo: (node: string) => navigationEngine.navigateTo(node),
    addPath: (nodes: string[], strength?: number) => navigationEngine.addPath(nodes, strength)
  };
} 