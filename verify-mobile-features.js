#!/usr/bin/env node

/**
 * Mobile Features Verification Script
 * Checks that all mobile components and functions are properly defined
 */

import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const checkResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

const addCheck = (name, status, message = '') => {
  checkResults.checks.push({ name, status, message });
  if (status === 'PASS') checkResults.passed++;
  else if (status === 'FAIL') checkResults.failed++;
  else if (status === 'WARN') checkResults.warnings++;
};

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Read file content
const readFile = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
};

// Check if function is properly defined in file
const checkFunction = (filePath, functionName) => {
  const content = readFile(filePath);
  if (!content) return false;
  
  // Check for function declaration or arrow function
  const functionRegex = new RegExp(`(const|let|var)\\s+${functionName}\\s*=|function\\s+${functionName}\\s*\\(`, 'g');
  return functionRegex.test(content);
};

// Check if import exists
const checkImport = (filePath, importName) => {
  const content = readFile(filePath);
  if (!content) return false;
  
  const importRegex = new RegExp(`import.*${importName}.*from`, 'g');
  return importRegex.test(content);
};

// Check if component is used in JSX
const checkJSXUsage = (filePath, componentName) => {
  const content = readFile(filePath);
  if (!content) return false;
  
  const jsxRegex = new RegExp(`<${componentName}[\\s>]`, 'g');
  return jsxRegex.test(content);
};

async function runVerification() {
  log('🔍 Starting Mobile Features Verification', 'blue');
  log('=' .repeat(50), 'blue');

  // Check 1: Mobile component files exist
  const mobileComponents = [
    'src/components/MobilePinDropper.jsx',
    'src/components/MobilePhotoUpload.jsx',
    'src/components/MobileContextMenu.jsx',
    'src/hooks/useMobileLocation.js',
    'src/utils/mobileUtils.js'
  ];

  mobileComponents.forEach(component => {
    const exists = fileExists(component);
    addCheck(
      `File exists: ${component}`,
      exists ? 'PASS' : 'FAIL',
      exists ? 'File found' : 'File missing'
    );
  });

  // Check 2: Main App.jsx imports
  const mainAppPath = 'src/App.jsx';
  const requiredImports = [
    'MobilePinDropper',
    'NotificationSystem',
    'SocialPanel'
  ];

  requiredImports.forEach(importName => {
    const hasImport = checkImport(mainAppPath, importName);
    addCheck(
      `Import in App.jsx: ${importName}`,
      hasImport ? 'PASS' : 'FAIL',
      hasImport ? 'Import found' : 'Import missing'
    );
  });

  // Check 3: Critical functions in App.jsx
  const criticalFunctions = [
    'handleMobilePinDrop',
    'handleFeedItemClick',
    'handlePinAction',
    'handleCreatePin'
  ];

  criticalFunctions.forEach(funcName => {
    const hasFunction = checkFunction(mainAppPath, funcName);
    addCheck(
      `Function in App.jsx: ${funcName}`,
      hasFunction ? 'PASS' : 'FAIL',
      hasFunction ? 'Function defined' : 'Function missing or malformed'
    );
  });

  // Check 4: JSX component usage
  const jsxComponents = [
    'MobilePinDropper',
    'SocialPanel',
    'NotificationSystem'
  ];

  jsxComponents.forEach(componentName => {
    const isUsed = checkJSXUsage(mainAppPath, componentName);
    addCheck(
      `JSX usage: ${componentName}`,
      isUsed ? 'PASS' : 'FAIL',
      isUsed ? 'Component used in JSX' : 'Component not found in JSX'
    );
  });

  // Check 5: Mobile-specific state variables
  const appContent = readFile(mainAppPath);
  const mobileStateVars = [
    'mobilePinDropMode',
    'isMobile',
    'showSocialPanel',
    'showNotifications'
  ];

  mobileStateVars.forEach(stateVar => {
    const hasState = appContent && appContent.includes(`[${stateVar},`);
    addCheck(
      `State variable: ${stateVar}`,
      hasState ? 'PASS' : 'WARN',
      hasState ? 'State variable found' : 'State variable not found or different pattern'
    );
  });

  // Check 6: Mobile utility functions
  const mobileUtilsPath = 'src/utils/mobileUtils.js';
  const utilityExports = [
    'hapticFeedback',
    'deviceDetection',
    'touchUtils',
    'cameraUtils',
    'locationUtils'
  ];

  if (fileExists(mobileUtilsPath)) {
    const utilsContent = readFile(mobileUtilsPath);
    utilityExports.forEach(utilName => {
      const hasUtil = utilsContent && utilsContent.includes(utilName);
      addCheck(
        `Mobile utility: ${utilName}`,
        hasUtil ? 'PASS' : 'WARN',
        hasUtil ? 'Utility found' : 'Utility not found'
      );
    });
  }

  // Check 7: Hook implementation
  const hookPath = 'src/hooks/useMobileLocation.js';
  if (fileExists(hookPath)) {
    const hookContent = readFile(hookPath);
    const hookFunctions = [
      'getCurrentLocation',
      'startWatching',
      'stopWatching',
      'requestPermission'
    ];

    hookFunctions.forEach(funcName => {
      const hasFunc = hookContent && hookContent.includes(funcName);
      addCheck(
        `Hook function: ${funcName}`,
        hasFunc ? 'PASS' : 'WARN',
        hasFunc ? 'Function found in hook' : 'Function not found in hook'
      );
    });
  }

  // Print Results
  log('\n' + '='.repeat(50), 'blue');
  log('📋 Verification Results', 'blue');
  log('='.repeat(50), 'blue');
  
  checkResults.checks.forEach(check => {
    let symbol, color;
    switch (check.status) {
      case 'PASS':
        symbol = '✅';
        color = 'green';
        break;
      case 'FAIL':
        symbol = '❌';
        color = 'red';
        break;
      case 'WARN':
        symbol = '⚠️';
        color = 'yellow';
        break;
    }
    
    log(`${symbol} ${check.name}`, color);
    if (check.message) {
      log(`   ${check.message}`, 'reset');
    }
  });
  
  log(`\n📊 Summary:`, 'blue');
  log(`   Passed: ${checkResults.passed}`, 'green');
  log(`   Failed: ${checkResults.failed}`, checkResults.failed > 0 ? 'red' : 'green');
  log(`   Warnings: ${checkResults.warnings}`, checkResults.warnings > 0 ? 'yellow' : 'green');
  log(`   Total:  ${checkResults.passed + checkResults.failed + checkResults.warnings}`, 'blue');
  
  if (checkResults.failed === 0) {
    log('\n🎉 Mobile features verification passed! All critical components are properly configured.', 'green');
  } else {
    log('\n⚠️  Some critical issues found. Please check the failed items above.', 'red');
    process.exit(1);
  }

  if (checkResults.warnings > 0) {
    log('\n💡 Some warnings found. These may not affect functionality but should be reviewed.', 'yellow');
  }
}

// Run verification
runVerification().catch(error => {
  log(`\n💥 Verification failed: ${error.message}`, 'red');
  process.exit(1);
});
