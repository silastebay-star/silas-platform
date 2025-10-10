/**
 * Jest configuration specifically for GeoJSON integration tests
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  displayName: 'GeoJSON Integration Tests',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Test patterns for GeoJSON-related tests
  testMatch: [
    '<rootDir>/lib/services/__tests__/geojson-service.test.ts',
    '<rootDir>/hooks/__tests__/useGeoJSONData.test.ts',
    '<rootDir>/components/map/__tests__/GeoJSONOverlay.test.tsx',
    '<rootDir>/components/map/__tests__/CensusDataVisualization.test.tsx',
    '<rootDir>/__tests__/integration/geojson-integration.test.ts'
  ],
  
  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverageFrom: [
    'lib/services/geojson-service.ts',
    'hooks/useGeoJSONData.ts',
    'components/map/GeoJSONOverlay.tsx',
    'components/map/CensusDataVisualization.tsx',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/geojson',
  
  // Test timeout
  testTimeout: 10000,
  
  // Setup files
  setupFiles: ['<rootDir>/jest.setup.geojson.js'],
  
  // Global test configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
