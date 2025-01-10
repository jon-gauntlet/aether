import '@testing-library/jest-dom';

// Configure Jest globals
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.describe = describe;
global.it = it;
global.expect = expect; 