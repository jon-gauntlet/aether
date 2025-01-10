declare global {
  const describe: (name: string, fn: () => void) => void;
  const beforeEach: (fn: () => void) => void;
  const afterEach: (fn: () => void) => void;
  const it: (name: string, fn: (done?: (error?: any) => void) => void) => void;
  const expect: any;
}

export {}; 