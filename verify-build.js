#!/usr/bin/env node

/**
 * Build Verification Script for SILAS Platform
 * Checks for common build issues before deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyBuild() {
  console.log('🔍 SILAS Platform Build Verification');
  console.log('=====================================');

// Check if required files exist
const requiredFiles = [
  'src/App.jsx',
  'src/utils/censusData.js',
  'package.json',
  'vite.config.js'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check App.jsx imports
console.log('\n📦 Checking imports in App.jsx...');
try {
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');
  
  // Check for correct census data import
  const hasCorrectImport = appContent.includes("from './utils/censusData.js'");
  const hasIncorrectImport = appContent.includes("from '../utils/censusData.js'");
  
  console.log(`${hasCorrectImport ? '✅' : '❌'} Correct census data import: ./utils/censusData.js`);
  console.log(`${!hasIncorrectImport ? '✅' : '❌'} No incorrect imports found`);
  
  // Check for other common import issues
  const importLines = appContent.split('\n').filter(line => line.trim().startsWith('import'));
  console.log(`📊 Total imports found: ${importLines.length}`);
  
} catch (error) {
  console.log('❌ Error reading App.jsx:', error.message);
  allFilesExist = false;
}

// Check census data file
console.log('\n📊 Checking census data...');
try {
  const censusModule = await import('./src/utils/censusData.js');
  const hasData = censusModule.censusData && censusModule.censusData.stoneclough;
  console.log(`${hasData ? '✅' : '❌'} Census data structure is valid`);

  if (hasData) {
    const population = censusModule.censusData.stoneclough.totalPopulation;
    console.log(`📈 Stoneclough population: ${population}`);
  }
} catch (error) {
  console.log('❌ Error loading census data:', error.message);
  allFilesExist = false;
}

// Check package.json
console.log('\n📋 Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Package name: ${pkg.name}`);
  console.log(`✅ Build script: ${pkg.scripts.build}`);
  console.log(`📦 Dependencies: ${Object.keys(pkg.dependencies).length}`);
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
  allFilesExist = false;
}

// Final result
console.log('\n🎯 Build Verification Result');
console.log('============================');
if (allFilesExist) {
  console.log('✅ All checks passed! Build should succeed.');
  process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

// Run the verification
verifyBuild().catch(error => {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
});
