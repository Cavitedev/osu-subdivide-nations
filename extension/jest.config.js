/** @type {import('ts-jest').JestConfigWithTsJest} */

import path from 'path';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/extension/src/**/*.test.ts'],
  "moduleNameMapper": {
    "^webextension-polyfill$": path.join(process.cwd(), "src", "__mocks__", "browser.ts"),
    // Add other mocks if needed
  }
};