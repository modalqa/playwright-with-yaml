// const { chromium } = require('playwright'); // Mengimpor Playwright untuk kontrol browser
// const yaml = require('js-yaml'); // Mengimpor js-yaml untuk memproses file YAML
// const fs = require('fs'); // Mengimpor fs untuk membaca file
// const path = require('path'); // Mengimpor path untuk menangani path file

// // Membaca file YAML dan mengonversinya ke objek JavaScript
// function loadTestCases(filePath) {
//   const file = fs.readFileSync(filePath, 'utf8'); // Membaca file YAML
//   return yaml.load(file); // Mengonversi YAML menjadi objek JavaScript
// }

// // Menjalankan test case menggunakan Playwright
// async function runTest(testCase, config) {
//   const browser = await chromium.launch({ headless: false }); // Menjalankan browser dalam mode tidak headless untuk debugging
//   const page = await browser.newPage(); // Membuka halaman baru di browser

//   // Ganti placeholder dengan nilai dari config di file YAML
//   testCase.steps.forEach(step => {
//     if (step.url) step.url = step.url.replace("{{base_url}}", config.base_url); // Ganti {{base_url}}
//     if (step.value) {
//       step.value = step.value.replace("{{credentials.username}}", config.credentials.username) // Ganti username
//                                .replace("{{credentials.password}}", config.credentials.password); // Ganti password
//     }
//   });

//   // Menjalankan setiap langkah uji
//   for (let step of testCase.steps) {
//     console.log(`Executing step: ${step.action}`); // Menampilkan langkah yang sedang dieksekusi

//     switch (step.action) {
//       case 'open':
//         await page.goto(step.url, { timeout: config.timeout }); // Membuka URL yang ditentukan
//         break;

//       case 'type':
//         await page.fill(step.selector, step.value); // Mengisi elemen dengan nilai yang ditentukan
//         break;

//       case 'click':
//         await page.click(step.selector); // Mengklik elemen yang ditentukan
//         break;

//       case 'wait':
//         // Tunggu elemen sampai terlihat di halaman setelah klik atau aksi lainnya
//         await page.waitForSelector(step.selector, { state: 'visible', timeout: config.timeout });
//         break;

//       case 'verify':
//         if (step.condition === 'visible') {
//           const elementVisible = await page.isVisible(step.selector); // Memeriksa apakah elemen terlihat
//           if (!elementVisible) {
//             throw new Error(`Element ${step.selector} is not visible`); // Jika tidak terlihat, lemparkan error
//           }
//         }
//         break;

//       default:
//         console.log('Unknown action:', step.action); // Menangani aksi yang tidak dikenal
//     }
//   }

//   await browser.close(); // Menutup browser setelah pengujian selesai
// }

// // Menyediakan fungsi untuk ekspor agar bisa dipanggil di file lain
// module.exports = { runTest, loadTestCases };

const { chromium } = require('playwright');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Membaca file YAML dan mengonversinya ke objek JavaScript
function loadTestCases(filePath) {
  const file = fs.readFileSync(filePath, 'utf8');
  return yaml.load(file);
}

// Membaca file konfigurasi
function loadConfig(configPath) {
  const file = fs.readFileSync(configPath, 'utf8');
  return yaml.load(file);
}

// Menjalankan test case menggunakan Playwright
async function runTest(testCase, config) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Ganti placeholder dengan nilai dari config
  testCase.steps.forEach(step => {
    if (step.url) step.url = step.url.replace("{{base_url}}", config.base_url);
    if (step.value) step.value = step.value.replace("{{credentials.username}}", config.credentials.username).replace("{{credentials.password}}", config.credentials.password);
  });

  for (let step of testCase.steps) {
    console.log(`Executing step: ${step.action}`);
    switch (step.action) {
      case 'open':
        await page.goto(step.url, { timeout: config.timeout });
        break;
      case 'type':
        await page.fill(step.selector, step.value);
        await page.waitForTimeout(config.timeout);  // Menggunakan timeout dari konfigurasi
        break;
      case 'click':
        await page.click(step.selector);
        await page.waitForTimeout(config.timeout);  // Menggunakan timeout dari konfigurasi
        break;
      case 'wait':
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: config.timeout });
        }
        await page.waitForTimeout(config.timeout);  // Menggunakan timeout dari konfigurasi
        break;
      case 'verify':
        if (step.condition === 'visible') {
          const element = await page.isVisible(step.selector);
          if (!element) {
            throw new Error(`Element ${step.selector} is not visible`);
          }
        }
        break;
      default:
        console.log('Unknown action:', step.action);
    }
  }

  await browser.close();
}

module.exports = { runTest, loadTestCases, loadConfig };

