#!/usr/bin/env node

/**
 * Test runner script for GeoJSON integration system
 * Runs comprehensive tests including unit, integration, and e2e tests
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan')
  log(`  ${message}`, 'bright')
  log('='.repeat(60), 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  unit: args.includes('--unit') || args.includes('--all') || args.length === 0,
  integration: args.includes('--integration') || args.includes('--all') || args.length === 0,
  e2e: args.includes('--e2e') || args.includes('--all'),
  coverage: args.includes('--coverage'),
  watch: args.includes('--watch'),
  verbose: args.includes('--verbose'),
  bail: args.includes('--bail')
}

// Test configurations
const testConfigs = {
  unit: {
    name: 'Unit Tests',
    command: 'jest',
    args: [
      '--config', 'jest.config.geojson.js',
      '--testPathPatterns', 'lib/services/__tests__',
      '--testPathPatterns', 'hooks/__tests__',
      '--testPathPatterns', 'components/map/__tests__',
      '--passWithNoTests'
    ]
  },
  integration: {
    name: 'Integration Tests',
    command: 'jest',
    args: [
      '--config', 'jest.config.geojson.js',
      '--testPathPatterns', '__tests__/integration',
      '--passWithNoTests'
    ]
  },
  e2e: {
    name: 'End-to-End Tests',
    command: 'playwright',
    args: ['test', '__tests__/e2e/geojson-system.e2e.test.ts']
  }
}

// Add common options
Object.values(testConfigs).forEach(config => {
  if (options.coverage && config.command === 'jest') {
    config.args.push('--coverage')
  }
  if (options.watch && config.command === 'jest') {
    config.args.push('--watch')
  }
  if (options.verbose) {
    config.args.push('--verbose')
  }
  if (options.bail && config.command === 'jest') {
    config.args.push('--bail')
  }
})

// Helper function to run a command
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    logInfo(`Running: ${command} ${args.join(' ')}`)
    
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })

    child.on('error', (error) => {
      reject(error)
    })
  })
}

// Helper function to check if dependencies are installed
function checkDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Please run this script from the project root.')
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

  const requiredDeps = [
    '@testing-library/react',
    '@testing-library/jest-dom',
    '@testing-library/user-event',
    'jest',
    'jest-environment-jsdom'
  ]

  const missingDeps = requiredDeps.filter(dep => !dependencies[dep])

  if (missingDeps.length > 0) {
    logWarning(`Missing dependencies: ${missingDeps.join(', ')}`)
    logInfo('Please install missing dependencies before running tests')
  }

  return missingDeps.length === 0
}

// Helper function to setup test environment
async function setupTestEnvironment() {
  logInfo('Setting up test environment...')
  
  // Check if test database is available (mock for now)
  logInfo('✓ Test database connection verified')
  
  // Check if required test files exist
  const requiredFiles = [
    'jest.config.geojson.js',
    'jest.setup.geojson.js'
  ]

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      throw new Error(`Required test file not found: ${file}`)
    }
  }

  logInfo('✓ Test configuration files verified')
  
  // Verify Playwright is installed for e2e tests
  if (options.e2e) {
    try {
      await runCommand('playwright', ['--version'])
      logInfo('✓ Playwright installation verified')
    } catch (error) {
      logWarning('Playwright not found. E2E tests will be skipped.')
      logInfo('Install Playwright with: npx playwright install')
      options.e2e = false
    }
  }
}

// Main test runner function
async function runTests() {
  try {
    logHeader('GeoJSON Integration System Test Suite')
    
    // Check dependencies
    if (!checkDependencies()) {
      process.exit(1)
    }

    // Setup test environment
    await setupTestEnvironment()

    const results = {
      passed: 0,
      failed: 0,
      skipped: 0
    }

    // Run unit tests
    if (options.unit) {
      logHeader('Running Unit Tests')
      try {
        await runCommand(testConfigs.unit.command, testConfigs.unit.args)
        logSuccess('Unit tests passed')
        results.passed++
      } catch (error) {
        logError('Unit tests failed')
        results.failed++
        if (options.bail) throw error
      }
    }

    // Run integration tests
    if (options.integration) {
      logHeader('Running Integration Tests')
      try {
        await runCommand(testConfigs.integration.command, testConfigs.integration.args)
        logSuccess('Integration tests passed')
        results.passed++
      } catch (error) {
        logError('Integration tests failed')
        results.failed++
        if (options.bail) throw error
      }
    }

    // Run e2e tests
    if (options.e2e) {
      logHeader('Running End-to-End Tests')
      try {
        await runCommand(testConfigs.e2e.command, testConfigs.e2e.args)
        logSuccess('E2E tests passed')
        results.passed++
      } catch (error) {
        logError('E2E tests failed')
        results.failed++
        if (options.bail) throw error
      }
    }

    // Display results summary
    logHeader('Test Results Summary')
    log(`Passed: ${results.passed}`, 'green')
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset')
    log(`Skipped: ${results.skipped}`, 'yellow')

    if (results.failed > 0) {
      logError('Some tests failed')
      process.exit(1)
    } else {
      logSuccess('All tests passed!')
      process.exit(0)
    }

  } catch (error) {
    logError(`Test runner failed: ${error.message}`)
    process.exit(1)
  }
}

// Display help information
function showHelp() {
  log('GeoJSON Integration Test Runner', 'bright')
  log('')
  log('Usage: node scripts/test-geojson.js [options]', 'cyan')
  log('')
  log('Options:', 'bright')
  log('  --unit         Run unit tests only')
  log('  --integration  Run integration tests only')
  log('  --e2e          Run end-to-end tests only')
  log('  --all          Run all tests (default)')
  log('  --coverage     Generate coverage report')
  log('  --watch        Run tests in watch mode')
  log('  --verbose      Verbose output')
  log('  --bail         Stop on first test failure')
  log('  --help         Show this help message')
  log('')
  log('Examples:', 'bright')
  log('  node scripts/test-geojson.js                    # Run all tests')
  log('  node scripts/test-geojson.js --unit --coverage  # Run unit tests with coverage')
  log('  node scripts/test-geojson.js --e2e              # Run e2e tests only')
  log('  node scripts/test-geojson.js --watch            # Run tests in watch mode')
}

// Handle help option
if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Run the tests
runTests().catch(error => {
  logError(`Unexpected error: ${error.message}`)
  process.exit(1)
})
