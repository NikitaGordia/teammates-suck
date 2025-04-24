import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Mock i18next
vi.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (str) => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'uk'
      },
    };
  },
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

// Mock clipboard API
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    configurable: true,
  });
} else {
  // If clipboard already exists, just mock the writeText method
  vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => Promise.resolve());
}

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
