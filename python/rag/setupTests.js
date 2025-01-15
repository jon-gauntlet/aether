import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers); 