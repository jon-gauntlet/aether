interface Range {
  [key: string]: any
}

interface MatcherResult {
  [key: string]: any
}

export let toBeInRange: any;

interface Matchers<R = any> {
  toBeInRange(...args: any[]): R;
}

// ... existing code for matcher implementation ...

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInRange(...args: any[]): R;
    }
  }
}