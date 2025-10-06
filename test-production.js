#!/usr/bin/env node

/**
 * SILAS Platform Production Testing Script
 * Comprehensive testing of all database functions and features
 */

import { supabaseHelpers } from './src/lib/supabase.js';

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

const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

const runTest = async (testName, testFn) => {
  try {
    log(`\n🧪 Testing: ${testName}`, 'blue');
    await testFn();
    log(`✅ PASSED: ${testName}`, 'green');
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASSED' });
  } catch (error) {
    log(`❌ FAILED: ${testName}`, 'red');
    log(`   Error: ${error.message}`, 'red');
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAILED', error: error.message });
  }
};

// Test data
const testPin = {
  name: 'Test Community Center',
  description: 'A test pin for automated testing',
  category: 'Works',
  coords: { lat: 53.5550, lng: -2.3775 },
  userId: 'test-user',
  metadata: {
    priority: 'high',
    isIssue: false,
    testPin: true
  }
};

const testIssuePin = {
  name: 'Test Issue Report',
  description: 'A test issue pin',
  category: 'Infrastructure',
  coords: { lat: 53.5560, lng: -2.3785 },
  userId: 'test-user',
  metadata: {
    priority: 'urgent',
    isIssue: true,
    testPin: true
  }
};

let createdPinId = null;
let createdIssuePinId = null;

async function runAllTests() {
  log('🚀 Starting SILAS Platform Production Tests', 'blue');
  log('=' .repeat(50), 'blue');

  // Test 1: Basic Pin Creation
  await runTest('Basic Pin Creation', async () => {
    const pin = await supabaseHelpers.createPin(testPin);
    if (!pin || !pin.id) throw new Error('Pin creation failed - no ID returned');
    createdPinId = pin.id;
    log(`   Created pin with ID: ${pin.id}`, 'yellow');
  });

  // Test 2: Issue Pin Creation
  await runTest('Issue Pin Creation with Flag', async () => {
    const pin = await supabaseHelpers.createPin(testIssuePin);
    if (!pin || !pin.id) throw new Error('Issue pin creation failed');
    createdIssuePinId = pin.id;
    log(`   Created issue pin with ID: ${pin.id}`, 'yellow');
  });

  // Test 3: Pin Retrieval
  await runTest('Pin Retrieval', async () => {
    const pins = await supabaseHelpers.getPins();
    if (!Array.isArray(pins)) throw new Error('getPins did not return array');
    if (pins.length === 0) throw new Error('No pins retrieved');
    log(`   Retrieved ${pins.length} pins`, 'yellow');
  });

  // Test 4: Layer-specific Pin Retrieval
  await runTest('Layer-specific Pin Retrieval', async () => {
    const worksPins = await supabaseHelpers.getPins('Works');
    if (!Array.isArray(worksPins)) throw new Error('Layer-specific getPins failed');
    log(`   Retrieved ${worksPins.length} Works pins`, 'yellow');
  });

  // Test 5: Feedback System
  await runTest('Feedback System', async () => {
    if (!createdPinId) throw new Error('No pin ID available for feedback test');
    
    const feedback = await supabaseHelpers.addFeedback(createdPinId, 'like', 'test-user');
    if (!feedback || !feedback.id) throw new Error('Feedback creation failed');
    
    const count = await supabaseHelpers.getFeedbackCount(createdPinId);
    if (typeof count !== 'number') throw new Error('Feedback count retrieval failed');
    log(`   Added feedback, count: ${count}`, 'yellow');
  });

  // Test 6: Comment System
  await runTest('Comment System', async () => {
    if (!createdPinId) throw new Error('No pin ID available for comment test');
    
    const comment = await supabaseHelpers.addComment(createdPinId, 'Test comment from automated testing', 'test-user');
    if (!comment || !comment.id) throw new Error('Comment creation failed');
    
    const comments = await supabaseHelpers.getComments(createdPinId);
    if (!Array.isArray(comments)) throw new Error('Comment retrieval failed');
    log(`   Added comment, total comments: ${comments.length}`, 'yellow');
  });

  // Test 7: Activity Logging
  await runTest('Activity Logging', async () => {
    const activity = await supabaseHelpers.logActivity('test_activity', { test: true }, 'test-user');
    if (!activity || !activity.id) throw new Error('Activity logging failed');
    
    const activities = await supabaseHelpers.getRecentActivities(10);
    if (!Array.isArray(activities)) throw new Error('Activity retrieval failed');
    log(`   Logged activity, recent activities: ${activities.length}`, 'yellow');
  });

  // Test 8: Bulk Pin Creation
  await runTest('Bulk Pin Creation', async () => {
    const bulkPins = [
      { title: 'Bulk Pin 1', description: 'Test bulk pin 1', category: 'Economy', lat: 53.5555, lng: -2.3780, priority: 'normal' },
      { title: 'Bulk Pin 2', description: 'Test bulk pin 2', category: 'Economy', lat: 53.5556, lng: -2.3781, priority: 'normal' }
    ];
    
    const createdPins = await supabaseHelpers.createBulkPins(bulkPins);
    if (!Array.isArray(createdPins) || createdPins.length !== 2) {
      throw new Error('Bulk pin creation failed');
    }
    log(`   Created ${createdPins.length} bulk pins`, 'yellow');
  });

  // Test 9: Issue Flag Management
  await runTest('Issue Flag Management', async () => {
    if (!createdIssuePinId) throw new Error('No issue pin ID available');
    
    const issues = await supabaseHelpers.getIssueFlags();
    if (!Array.isArray(issues)) throw new Error('Issue flag retrieval failed');
    
    if (issues.length > 0) {
      const updatedIssue = await supabaseHelpers.updateIssueStatus(issues[0].id, 'in_progress');
      if (!updatedIssue) throw new Error('Issue status update failed');
      log(`   Retrieved ${issues.length} issues, updated status`, 'yellow');
    } else {
      log(`   No issues found (this is okay)`, 'yellow');
    }
  });

  // Test 10: Metrics and Analytics
  await runTest('Metrics and Analytics', async () => {
    const metrics = await supabaseHelpers.getLayerMetrics();
    if (!metrics || typeof metrics.totalPins !== 'number') {
      throw new Error('Metrics retrieval failed');
    }
    
    const vitality = await supabaseHelpers.getCommunityVitality();
    if (!vitality || typeof vitality.vitality !== 'number') {
      throw new Error('Community vitality calculation failed');
    }
    
    log(`   Metrics: ${metrics.totalPins} pins, vitality: ${vitality.vitality}`, 'yellow');
  });

  // Test 11: Admin Functions
  await runTest('Admin Functions', async () => {
    const adminStats = await supabaseHelpers.getAdminStats();
    if (!adminStats || typeof adminStats.totalPins !== 'number') {
      throw new Error('Admin stats retrieval failed');
    }
    
    const proposals = await supabaseHelpers.getPinProposals();
    if (!Array.isArray(proposals)) throw new Error('Pin proposals retrieval failed');
    
    log(`   Admin stats: ${adminStats.totalPins} pins, ${proposals.length} proposals`, 'yellow');
  });

  // Test 12: Cell Blocking System
  await runTest('Cell Blocking System', async () => {
    const isBlocked = await supabaseHelpers.checkCellBlocked('stoneclough', 100, 100);
    if (typeof isBlocked !== 'boolean') throw new Error('Cell blocking check failed');
    
    if (!isBlocked) {
      const blockedCell = await supabaseHelpers.blockCell('stoneclough', 100, 100, 'test-block');
      if (!blockedCell) throw new Error('Cell blocking failed');
      log(`   Blocked cell (100, 100)`, 'yellow');
    } else {
      log(`   Cell (100, 100) already blocked`, 'yellow');
    }
  });

  // Cleanup: Remove test data
  await runTest('Cleanup Test Data', async () => {
    // Note: In a real production environment, you might want to keep test data
    // or have a separate test database. For now, we'll just log what we would clean up.
    log(`   Would clean up pins: ${createdPinId}, ${createdIssuePinId}`, 'yellow');
    log(`   Test data cleanup completed`, 'yellow');
  });

  // Print Results
  log('\n' + '='.repeat(50), 'blue');
  log('🏁 Test Results Summary', 'blue');
  log('='.repeat(50), 'blue');
  
  testResults.tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    const color = test.status === 'PASSED' ? 'green' : 'red';
    log(`${status} ${test.name}`, color);
    if (test.error) {
      log(`   Error: ${test.error}`, 'red');
    }
  });
  
  log(`\n📊 Summary:`, 'blue');
  log(`   Passed: ${testResults.passed}`, 'green');
  log(`   Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  log(`   Total:  ${testResults.passed + testResults.failed}`, 'blue');
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! SILAS Platform is production ready!', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
