// src/runner.js
const { runTest, loadTestCases } = require('./executor');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Membaca konfigurasi umum dari file YAML
const config = yaml.load(fs.readFileSync(path.join(__dirname, '../config/test-config.yaml'), 'utf8'));

// Membaca test case dari file YAML
const testCase = loadTestCases(path.join(__dirname, '../tests/login-test.yaml'));

// Menjalankan pengujian
runTest(testCase, config).catch((err) => {
  console.error('Test failed', err);
});


