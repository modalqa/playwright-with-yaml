const { runTest, loadTestCases } = require('./executor');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Membaca konfigurasi umum dari file YAML
const config = yaml.load(fs.readFileSync(path.join(__dirname, '../config/test-config.yaml'), 'utf8'));

// Membaca semua file dengan ekstensi .yaml dari folder tests
const testFolder = path.join(__dirname, '../tests');
const testFiles = fs.readdirSync(testFolder).filter(file => file.endsWith('.yaml'));

// Menjalankan semua test case
(async () => {
  for (const file of testFiles) {
    try {
      console.log(`\nRunning test file: ${file}`);
      const testCase = loadTestCases(path.join(testFolder, file));
      await runTest(testCase, config);
      console.log(`Test file ${file} executed successfully.\n`);
    } catch (err) {
      console.error(`Test file ${file} failed`, err);
    }
  }
})();
