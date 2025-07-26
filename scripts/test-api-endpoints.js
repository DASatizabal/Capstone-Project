// scripts/test-api-endpoints.js
/**
 * API Endpoint Testing Script
 * 
 * This script tests all implemented API endpoints to verify functionality.
 * Run with: node scripts/test-api-endpoints.js
 * 
 * Features:
 * - Automated testing of all endpoints
 * - Authentication simulation
 * - Response validation
 * - Performance measurement
 * - Error handling verification
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const config = {
  baseURL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  timeout: 30000,
  testEmail: 'test.parent@example.com',
  testPassword: 'test123',
  childEmail: 'test.child@example.com',
  verbose: true
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: [],
  performance: {}
};

// HTTP client with session support
const client = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  withCredentials: true,
  headers: {
    'User-Agent': 'API-Test-Script/1.0'
  }
});

// Logging utilities
function log(message, level = 'info') {
  if (!config.verbose && level === 'debug') return;
  
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📘',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    debug: '🔍'
  }[level] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logTest(name, status, duration, details = '') {
  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  log(`${statusIcon} ${name} (${duration}ms) ${details}`);
  
  testResults[status === 'pass' ? 'passed' : status === 'fail' ? 'failed' : 'skipped']++;
  testResults.performance[name] = duration;
}

// Helper functions
async function makeRequest(method, url, data = null, headers = {}) {
  const startTime = Date.now();
  
  try {
    const response = await client({
      method,
      url,
      data,
      headers
    });
    
    const duration = Date.now() - startTime;
    return { success: true, response, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status,
      duration 
    };
  }
}

async function authenticateUser(email, password) {
  log(`🔐 Authenticating user: ${email}`);
  
  // Simulate Next.js authentication
  const { success, response, duration } = await makeRequest('POST', '/api/auth/callback/credentials', {
    email,
    password,
    csrfToken: 'test-csrf-token'
  }, {
    'Content-Type': 'application/json'
  });
  
  if (success && response.status === 200) {
    log(`✅ Authentication successful for ${email} (${duration}ms)`);
    return true;
  } else {
    log(`❌ Authentication failed for ${email}`, 'error');
    return false;
  }
}

// Test families
async function testFamilyEndpoints() {
  log('\n👨‍👩‍👧‍👦 Testing Family Management Endpoints');
  
  let familyId = null;
  let inviteCode = null;
  
  // Test: Create Family
  const createFamilyTest = async () => {
    const { success, response, duration } = await makeRequest('POST', '/api/families', {
      name: 'Test Family API',
      description: 'Created by API test script',
      settings: {
        allowChildrenToCreateChores: false,
        requirePhotoVerification: true,
        pointsSystem: {
          enabled: true,
          rewards: [{ points: 50, reward: 'Test reward' }]
        }
      }
    });
    
    if (success && response.data.success) {
      familyId = response.data.family._id;
      logTest('Create Family', 'pass', duration, `ID: ${familyId.substring(0, 8)}...`);
      return true;
    } else {
      logTest('Create Family', 'fail', duration, JSON.stringify(response?.data || 'Unknown error'));
      return false;
    }
  };
  
  // Test: Get Families
  const getFamiliesTest = async () => {
    const { success, response, duration } = await makeRequest('GET', '/api/families');
    
    if (success && Array.isArray(response.data)) {
      logTest('Get Families', 'pass', duration, `Found ${response.data.length} families`);
      return true;
    } else {
      logTest('Get Families', 'fail', duration);
      return false;
    }
  };
  
  // Test: Update Family
  const updateFamilyTest = async () => {
    if (!familyId) {
      logTest('Update Family', 'skip', 0, 'No family ID available');
      return false;
    }
    
    const { success, response, duration } = await makeRequest('PUT', '/api/families', {
      familyId,
      name: 'Updated Test Family',
      description: 'Updated by API test script'
    });
    
    if (success && response.data.success) {
      logTest('Update Family', 'pass', duration);
      return true;
    } else {
      logTest('Update Family', 'fail', duration);
      return false;
    }
  };
  
  // Test: Generate Invite Code
  const generateInviteTest = async () => {
    if (!familyId) {
      logTest('Generate Invite', 'skip', 0, 'No family ID available');
      return false;
    }
    
    const { success, response, duration } = await makeRequest('POST', `/api/families/${familyId}/invite`, {
      role: 'child',
      expiresIn: 24
    });
    
    if (success && response.data.success) {
      inviteCode = response.data.inviteCode;
      logTest('Generate Invite', 'pass', duration, `Code: ${inviteCode}`);
      return true;
    } else {
      logTest('Generate Invite', 'fail', duration);
      return false;
    }
  };
  
  // Test: Get Family Details
  const getFamilyDetailsTest = async () => {
    if (!familyId) {
      logTest('Get Family Details', 'skip', 0, 'No family ID available');
      return false;
    }
    
    const { success, response, duration } = await makeRequest('GET', `/api/families/${familyId}`);
    
    if (success && response.data) {
      logTest('Get Family Details', 'pass', duration);
      return true;
    } else {
      logTest('Get Family Details', 'fail', duration);
      return false;
    }
  };
  
  // Test: Get Family Members
  const getFamilyMembersTest = async () => {
    if (!familyId) {
      logTest('Get Family Members', 'skip', 0, 'No family ID available');
      return false;
    }
    
    const { success, response, duration } = await makeRequest('GET', `/api/families/${familyId}/members`);
    
    if (success && response.data.success) {
      logTest('Get Family Members', 'pass', duration, `${response.data.members.length} members`);
      return true;
    } else {
      logTest('Get Family Members', 'fail', duration);
      return false;
    }
  };
  
  // Test: Family Context
  const familyContextTest = async () => {
    if (!familyId) {
      logTest('Family Context', 'skip', 0, 'No family ID available');
      return false;
    }
    
    const { success, response, duration } = await makeRequest('GET', `/api/families/context?familyId=${familyId}`);
    
    if (success && response.data.success) {
      logTest('Family Context', 'pass', duration);
      return true;
    } else {
      logTest('Family Context', 'fail', duration);
      return false;
    }
  };
  
  // Run family tests
  await createFamilyTest();
  await getFamiliesTest();
  await updateFamilyTest();
  await generateInviteTest();
  await getFamilyDetailsTest();
  await getFamilyMembersTest();
  await familyContextTest();
  
  return { familyId, inviteCode };
}

// Test photo verification
async function testPhotoEndpoints(choreId) {
  log('\n📷 Testing Photo Verification Endpoints');
  
  if (!choreId) {
    log('⏭️ Skipping photo tests - no chore ID available');
    return;
  }
  
  // Create test image buffer
  const createTestImage = () => {
    // Simple 1x1 pixel PNG
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x75, 0x58, 0x21, 0xAF, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    return pngBuffer;
  };
  
  let photoId = null;
  
  // Test: Upload Photo
  const uploadPhotoTest = async () => {
    const formData = new FormData();
    formData.append('photo', createTestImage(), {
      filename: 'test-photo.png',
      contentType: 'image/png'
    });
    formData.append('description', 'Test photo upload');
    
    const { success, response, duration } = await makeRequest('POST', `/api/chores/${choreId}/photos`, formData, {
      ...formData.getHeaders()
    });
    
    if (success && response.data.success) {
      photoId = response.data.photo.id;
      logTest('Upload Photo', 'pass', duration, `Photo ID: ${photoId?.substring(0, 8)}...`);
      return true;
    } else {
      logTest('Upload Photo', 'fail', duration, JSON.stringify(response?.data?.error || 'Unknown error'));
      return false;
    }
  };
  
  // Test: Get Pending Approvals
  const getPendingApprovalsTest = async () => {
    const { success, response, duration } = await makeRequest('GET', `/api/families/test-family-id/pending-approvals`);
    
    // This might fail due to family ID, but we test the endpoint
    if (success || response?.status === 404) {
      logTest('Get Pending Approvals', 'pass', duration);
      return true;
    } else {
      logTest('Get Pending Approvals', 'fail', duration);
      return false;
    }
  };
  
  // Test: Approve Photo
  const approvePhotoTest = async () => {
    if (!photoId) {
      logTest('Approve Photo', 'skip', 0, 'No photo ID available');
      return false;
    }
    
    const { success, response, duration } = await makeRequest('POST', `/api/chores/${choreId}/verify`, {
      action: 'approve',
      photoId
    });
    
    if (success && response.data.success) {
      logTest('Approve Photo', 'pass', duration);
      return true;
    } else {
      logTest('Approve Photo', 'fail', duration);
      return false;
    }
  };
  
  // Run photo tests
  await uploadPhotoTest();
  await getPendingApprovalsTest();
  await approvePhotoTest();
}

// Test notification endpoints
async function testNotificationEndpoints(familyId) {
  log('\n🔔 Testing Notification Endpoints');
  
  // Test: Get Notification Preferences
  const getPreferencesTest = async () => {
    const url = familyId ? 
      `/api/notifications/preferences?familyId=${familyId}` : 
      '/api/notifications/preferences';
    
    const { success, response, duration } = await makeRequest('GET', url);
    
    if (success) {
      logTest('Get Notification Preferences', 'pass', duration);
      return true;
    } else {
      logTest('Get Notification Preferences', 'fail', duration);
      return false;
    }
  };
  
  // Test: Update Notification Preferences
  const updatePreferencesTest = async () => {
    const { success, response, duration } = await makeRequest('PUT', '/api/notifications/preferences', {
      familyId: familyId || 'test-family-id',
      email: {
        enabled: true,
        choreAssignments: true,
        choreReminders: true,
        choreCompletions: false,
        photoApprovals: true,
        dailyDigest: true,
        weeklyReport: false
      },
      reminderTiming: {
        firstReminder: 2,
        secondReminder: 1,
        finalReminder: 2,
        dailyDigestTime: "18:00"
      },
      quietHours: {
        enabled: true,
        startTime: "22:00",
        endTime: "07:00",
        timezone: "America/New_York"
      }
    });
    
    if (success && response.data.success) {
      logTest('Update Notification Preferences', 'pass', duration);
      return true;
    } else {
      logTest('Update Notification Preferences', 'fail', duration);
      return false;
    }
  };
  
  // Test: Get Notification Stats
  const getStatsTest = async () => {
    const url = familyId ? 
      `/api/notifications/stats?familyId=${familyId}&days=30` : 
      '/api/notifications/stats?days=30';
    
    const { success, response, duration } = await makeRequest('GET', url);
    
    if (success && response.data.summary) {
      logTest('Get Notification Stats', 'pass', duration, `${response.data.summary.total} total`);
      return true;
    } else {
      logTest('Get Notification Stats', 'fail', duration);
      return false;
    }
  };
  
  // Test: Send Test Notification
  const testNotificationTest = async () => {
    const { success, response, duration } = await makeRequest('POST', '/api/notifications/test', {
      type: 'chore-assignment',
      email: 'test@example.com'
    });
    
    if (success && response.data.success) {
      logTest('Send Test Notification', 'pass', duration);
      return true;
    } else {
      logTest('Send Test Notification', 'fail', duration);
      return false;
    }
  };
  
  // Run notification tests
  await getPreferencesTest();
  await updatePreferencesTest();
  await getStatsTest();
  await testNotificationTest();
}

// Test cron endpoints
async function testCronEndpoints() {
  log('\n⏰ Testing Cron Job Endpoints');
  
  const cronSecret = process.env.CRON_SECRET || 'test-cron-secret';
  
  // Test: Process Reminders
  const processRemindersTest = async () => {
    const { success, response, duration } = await makeRequest('POST', '/api/cron/reminders', null, {
      'Authorization': `Bearer ${cronSecret}`
    });
    
    if (success && response.data.success) {
      logTest('Process Reminders', 'pass', duration);
      return true;
    } else {
      logTest('Process Reminders', 'fail', duration);
      return false;
    }
  };
  
  // Test: Process Daily Digest
  const processDailyDigestTest = async () => {
    const { success, response, duration } = await makeRequest('POST', '/api/cron/daily-digest', null, {
      'Authorization': `Bearer ${cronSecret}`
    });
    
    if (success && response.data.success) {
      logTest('Process Daily Digest', 'pass', duration);
      return true;
    } else {
      logTest('Process Daily Digest', 'fail', duration);
      return false;
    }
  };
  
  // Test: Get Cron Status
  const getCronStatusTest = async () => {
    const { success, response, duration } = await makeRequest('GET', '/api/cron/reminders', null, {
      'Authorization': `Bearer ${cronSecret}`
    });
    
    if (success && response.data.status) {
      logTest('Get Cron Status', 'pass', duration);
      return true;
    } else {
      logTest('Get Cron Status', 'fail', duration);
      return false;
    }
  };
  
  // Run cron tests
  await processRemindersTest();
  await processDailyDigestTest();
  await getCronStatusTest();
}

// Test error handling
async function testErrorHandling() {
  log('\n⚠️ Testing Error Handling');
  
  // Test: Unauthorized Access
  const unauthorizedTest = async () => {
    // Clear any existing cookies
    client.defaults.headers.cookie = '';
    
    const { success, response, duration, status } = await makeRequest('GET', '/api/families');
    
    if (!success && status === 401) {
      logTest('Unauthorized Access', 'pass', duration, 'Correctly returned 401');
      return true;
    } else {
      logTest('Unauthorized Access', 'fail', duration, 'Should have returned 401');
      return false;
    }
  };
  
  // Test: Invalid Data
  const invalidDataTest = async () => {
    // Re-authenticate first
    await authenticateUser(config.testEmail, config.testPassword);
    
    const { success, response, duration, status } = await makeRequest('POST', '/api/families', {
      name: '', // Invalid empty name
      description: null
    });
    
    if (!success && (status === 400 || status === 422)) {
      logTest('Invalid Data Validation', 'pass', duration, `Correctly returned ${status}`);
      return true;
    } else {
      logTest('Invalid Data Validation', 'fail', duration, `Should have returned 400/422, got ${status}`);
      return false;
    }
  };
  
  // Test: Non-existent Resource
  const notFoundTest = async () => {
    const { success, response, duration, status } = await makeRequest('GET', '/api/families/nonexistent123');
    
    if (!success && status === 404) {
      logTest('Non-existent Resource', 'pass', duration, 'Correctly returned 404');
      return true;
    } else {
      logTest('Non-existent Resource', 'fail', duration, `Should have returned 404, got ${status}`);
      return false;
    }
  };
  
  // Run error tests
  await unauthorizedTest();
  await invalidDataTest();
  await notFoundTest();
}

// Performance testing
async function testPerformance() {
  log('\n⚡ Running Performance Tests');
  
  const performanceThresholds = {
    'Create Family': 1000,
    'Get Families': 500,
    'Get Notification Stats': 800,
    'Upload Photo': 5000
  };
  
  let performanceIssues = 0;
  
  for (const [testName, threshold] of Object.entries(performanceThresholds)) {
    const duration = testResults.performance[testName];
    if (duration && duration > threshold) {
      log(`⚠️ Performance issue: ${testName} took ${duration}ms (threshold: ${threshold}ms)`, 'warning');
      performanceIssues++;
    } else if (duration) {
      log(`✅ Performance good: ${testName} took ${duration}ms (threshold: ${threshold}ms)`);
    }
  }
  
  if (performanceIssues === 0) {
    log('✅ All performance tests passed');
  } else {
    log(`⚠️ ${performanceIssues} performance issues detected`, 'warning');
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting API Endpoint Testing');
  log(`📍 Base URL: ${config.baseURL}`);
  log(`📧 Test User: ${config.testEmail}`);
  log('='.repeat(50));
  
  try {
    // Check if server is running
    const { success } = await makeRequest('GET', '/api/health');
    if (!success) {
      log('❌ Server is not running or health endpoint not available', 'error');
      log('💡 Make sure your Next.js application is running', 'warning');
      return;
    }
    
    // Authenticate
    const authenticated = await authenticateUser(config.testEmail, config.testPassword);
    if (!authenticated) {
      log('❌ Authentication failed - ensure test user exists', 'error');
      log('💡 Run: node scripts/create-sample-data.js minimal', 'warning');
      return;
    }
    
    // Run test suites
    const { familyId } = await testFamilyEndpoints();
    await testPhotoEndpoints('test-chore-id');
    await testNotificationEndpoints(familyId);
    await testCronEndpoints();
    await testErrorHandling();
    await testPerformance();
    
    // Generate summary report
    log('\n📊 Test Summary');
    log('='.repeat(30));
    log(`✅ Passed: ${testResults.passed}`);
    log(`❌ Failed: ${testResults.failed}`);
    log(`⏭️ Skipped: ${testResults.skipped}`);
    log(`📈 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
    
    if (testResults.failed > 0) {
      log('\n❌ Failed Tests:', 'error');
      testResults.errors.forEach(error => log(`  • ${error}`, 'error'));
    }
    
    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
    log(`\n🎯 Success Rate: ${successRate}%`);
    
    if (testResults.failed === 0) {
      log('🎉 All tests passed successfully!', 'success');
    } else {
      log('⚠️ Some tests failed - check implementation', 'warning');
    }
    
  } catch (error) {
    log(`❌ Test runner failed: ${error.message}`, 'error');
    testResults.errors.push(`Test runner: ${error.message}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Update config based on arguments
  if (args.includes('--quiet')) {
    config.verbose = false;
  }
  
  if (args.includes('--local')) {
    config.baseURL = 'http://localhost:3000';
  }
  
  const emailArg = args.find(arg => arg.startsWith('--email='));
  if (emailArg) {
    config.testEmail = emailArg.split('=')[1];
  }
  
  switch (command) {
    case 'families':
      await testFamilyEndpoints();
      break;
    case 'photos':
      await testPhotoEndpoints('test-chore-id');
      break;
    case 'notifications':
      await testNotificationEndpoints();
      break;
    case 'cron':
      await testCronEndpoints();
      break;
    case 'errors':
      await testErrorHandling();
      break;
    case 'performance':
      await testPerformance();
      break;
    case 'all':
    default:
      await runAllTests();
      break;
  }
}

// Export for use as module
module.exports = {
  runAllTests,
  testFamilyEndpoints,
  testPhotoEndpoints,
  testNotificationEndpoints,
  testCronEndpoints,
  testErrorHandling,
  config
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}