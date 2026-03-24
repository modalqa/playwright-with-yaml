const { runTest, loadTestCases, loadConfig } = require('./src/executor');
const path = require('path');

// Get test file name from command line argument
const testFile = process.argv[2];

if (!testFile) {
  console.log('Usage: node run-single.js <test-file.yaml>');
  console.log('Example: node run-single.js login-test.yaml');
  console.log('\nAvailable test files:');
  console.log('  - login-test.yaml');
  console.log('  - multi-user-login-test.yaml');
  console.log('  - complete-feature-demo.yaml');
  console.log('  - ecommerce-flow-test.yaml');
  console.log('  - advanced-features-test.yaml');
  process.exit(1);
}

// Load configuration
const config = loadConfig(path.join(__dirname, 'config/test-config.yaml'));

// Load test case
const testCase = loadTestCases(path.join(__dirname, 'tests', testFile));

// Run the test
runTest(testCase, config)
  .then(() => {
    console.log(`\n✅ Test file ${testFile} executed successfully!\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n❌ Test file ${testFile} failed:`, error.message);
    process.exit(1);
  });
