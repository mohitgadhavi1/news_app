import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  // Ignore transformation for all node_modules except for ESM packages that need to be transformed
  // Allow transformation of all ESM packages in node_modules
  transformIgnorePatterns: [
    '/node_modules/(?!.*.mjs$)'
  ],
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',

  // Setup files - IMPORTANT: Uncomment this
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Ensure manual mocks for @/lib/newsService are found
    '^@/lib/newsService$': '<rootDir>/lib/newsService.ts',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/__test__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],

  // Transform settings (optional, but good to have explicit)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['@swc/jest', {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)