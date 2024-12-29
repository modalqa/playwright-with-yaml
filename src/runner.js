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

//Generate Project
const command = process.argv[2];

if (command === 'setup') {
  const projectStructure = {
    config: ['test-config.yaml'],
    src: ['executor.js', 'runner.js'],
    tests: ['login-test.yaml'],
  };

  const basePath = process.cwd();

  // Create directories and files
  Object.entries(projectStructure).forEach(([folder, files]) => {
    const folderPath = path.join(basePath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`Created folder: ${folderPath}`);
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `# ${file} content placeholder`);
        console.log(`Created file: ${filePath}`);
      }
    });
  });

  // Generate package.json and README.md if not present
  const additionalFiles = {
    'package.json': JSON.stringify(
      {
        name: 'playwright-with-yaml',
        version: '1.0.0',
        description: 'Run Playwright tests using YAML configuration files.',
        main: 'src/runner.js',
        scripts: {
          start: 'node src/runner.js',
        },
        author: 'Your Name',
        license: 'MIT',
      },
      null,
      2
    ),
    'README.md': '# Playwright with YAML\n\nGenerated project structure.',
  };

  Object.entries(additionalFiles).forEach(([fileName, content]) => {
    const filePath = path.join(basePath, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`Created file: ${filePath}`);
    }
  });

  console.log('\nProject setup complete!');
} else {
  console.log('Unknown command. Use "playwright-yaml setup" to initialize a project.');
}
