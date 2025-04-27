# Frontend Tests

![Vitest](https://img.shields.io/badge/vitest-0.34.1-6E9F18.svg) ![React Testing Library](https://img.shields.io/badge/React_Testing_Library-14.0.0-E33332.svg) ![JSDOM](https://img.shields.io/badge/jsdom-22.1.0-yellow.svg) ![Coverage](https://img.shields.io/badge/coverage-included-83B81A.svg)

This directory contains tests for the Team Balancer frontend using Vitest and React Testing Library.

## Test Structure

The tests are organized by component, with each component having its own test file:

- `App.test.jsx` - Tests for the main App component
- `components/BalanceButton.test.jsx` - Tests for the BalanceButton component
- `components/LanguageSwitcher.test.jsx` - Tests for the LanguageSwitcher component
- `components/PlayerTable.test.jsx` - Tests for the PlayerTable component
- `components/TeamCopyText.test.jsx` - Tests for the TeamCopyText component
- `components/TeamsDisplay.test.jsx` - Tests for the TeamsDisplay component
- `utils/utils.test.js` - Tests for utility functions

## Running Tests

To run all tests:

```bash
# Navigate to the frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode (tests will re-run when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Setup

The test setup is configured in:

- `vite.config.js` - Configures Vitest to use jsdom for browser environment simulation
- `src/test/setup.js` - Sets up global test environment, mocks, and cleanup

## Test Utilities

Common test utilities are available in:

- `src/test/test-utils.jsx` - Contains mock data and helper functions for tests

## Writing New Tests

When adding new tests:

1. Follow the naming convention: test files should be named `*.test.jsx` or `*.test.js`
2. Use React Testing Library's queries to find elements (prefer user-centric queries)
3. Use the mock data and utilities from `test-utils.jsx` where appropriate
4. Test component behavior, not implementation details
5. For components with state updates, wrap interactions in `act()` to ensure all updates are processed

## Coverage

The test coverage report shows which parts of the code are covered by tests. To view the coverage report:

```bash
npm run test:coverage
```

This will generate a coverage report in the terminal and a detailed HTML report in the `coverage` directory.
