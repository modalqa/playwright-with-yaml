const { chromium, firefox, webkit } = require('playwright');
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

// Substitute variables in step
function substituteVariables(step, config, testVariables) {
  const processedStep = JSON.parse(JSON.stringify(step)); // Deep clone
  
  // Replace config variables
  if (processedStep.url) {
    processedStep.url = processedStep.url.replace("{{base_url}}", config.base_url);
  }
  
  if (processedStep.value) {
    processedStep.value = processedStep.value
      .replace("{{credentials.username}}", config.credentials?.username || '')
      .replace("{{credentials.password}}", config.credentials?.password || '');
  }
  
  // Replace test-specific variables
  Object.keys(testVariables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    if (processedStep.value) processedStep.value = processedStep.value.replace(regex, testVariables[key]);
    if (processedStep.url) processedStep.url = processedStep.url.replace(regex, testVariables[key]);
    if (processedStep.selector) processedStep.selector = processedStep.selector.replace(regex, testVariables[key]);
  });
  
  return processedStep;
}

// Menjalankan test case menggunakan Playwright
async function runTest(testCase, config) {
  // Setup browser options
  const browserType = testCase.browser || 'chromium';
  const launchOptions = {
    headless: testCase.headless ?? false,
    slowMo: config.slowMo || 0,
  };

  // Launch browser based on type
  let browser;
  switch (browserType.toLowerCase()) {
    case 'firefox':
      browser = await firefox.launch(launchOptions);
      break;
    case 'webkit':
      browser = await webkit.launch(launchOptions);
      break;
    default:
      browser = await chromium.launch(launchOptions);
  }

  // Create context with options
  const contextOptions = {
    viewport: testCase.viewport || { width: 1280, height: 720 },
    userAgent: testCase.userAgent || config.userAgent || 'Mozilla/5.0',
    locale: testCase.locale || 'en-US',
    timezoneId: testCase.timezone || 'UTC',
    ignoreHTTPSErrors: testCase.ignoreHTTPSErrors ?? true,
  };

  if (testCase.device) {
    // Support for device emulation
    const devices = require('playwright').devices;
    const device = devices[testCase.device];
    if (device) {
      Object.assign(contextOptions, device);
    }
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // Enable tracing if configured
  if (testCase.tracing) {
    await context.tracing.start({ screenshots: true, snapshots: true });
  }

  // Process steps with variable substitution
  const steps = testCase.steps || [];
  const variables = testCase.variables || {};
  
  // Check if this is a multi-user test
  const users = testCase.users || [];
  
  if (users.length > 0) {
    // Run test for each user
    for (const user of users) {
      console.log(`\n=== Running test for user: ${user.username} ===`);
      const userVariables = { ...variables, user };
      
      for (let step of steps) {
        // Substitute variables including user data
        const processedStep = substituteVariables(step, config, userVariables);
        
        // Handle conditional_verify action
        if (processedStep.action.toLowerCase() === 'conditional_verify') {
          await handleConditionalVerify(page, processedStep, config, context, browser, userVariables);
          continue;
        }
        
        console.log(`Executing step: ${processedStep.action}`);
        await executeAction(page, processedStep, config, context, browser);
      }
      
      // Navigate back to base URL for next user if needed
      if (users.indexOf(user) < users.length - 1) {
        try {
          await page.goto(config.base_url);
        } catch (err) {
          console.log('Navigation error, continuing to next user...');
        }
      }
    }
  } else {
    // Single test run
    for (let step of steps) {
      // Substitute variables in step
      const processedStep = substituteVariables(step, config, variables);
      
      // Handle conditional_verify action
      if (processedStep.action.toLowerCase() === 'conditional_verify') {
        await handleConditionalVerify(page, processedStep, config, context, browser, variables);
        continue;
      }
      
      console.log(`Executing step: ${processedStep.action}`);
      await executeAction(page, processedStep, config, context, browser);
    }
  }

  // Save trace if enabled
  if (testCase.tracing) {
    const tracePath = `./traces/${testCase.test_name.replace(/\s+/g, '-')}-${Date.now()}.zip`;
    await context.tracing.stop({ path: tracePath });
    console.log(`Trace saved at: ${tracePath}`);
  }

  // Take screenshot if configured
  if (testCase.screenshot) {
    const screenshotPath = `./screenshots/${testCase.test_name.replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: testCase.fullPageScreenshot ?? false });
    console.log(`Screenshot saved at: ${screenshotPath}`);
  }

  await browser.close();
}

// Execute action based on type
async function executeAction(page, step, config, context, browser) {
  const timeout = step.timeout || config.timeout || 30000;
  
  try {
    // Handle actions that should be skipped or are markers
    if (step.action.toLowerCase() === 'conditional_verify') {
      // Conditional verify is handled separately in runTest
      return;
    }
    
    if (step.action.toLowerCase() === 'video') {
      // Video is handled at context level, this is just a marker
      return;
    }
    
    switch (step.action.toLowerCase()) {
      // Navigation Actions
      case 'open':
      case 'navigate':
      case 'goto':
        await page.goto(step.url, { timeout, waitUntil: step.waitUntil || 'load' });
        break;

      case 'go_back':
      case 'back':
        await page.goBack({ timeout });
        break;

      case 'go_forward':
      case 'forward':
        await page.goForward({ timeout });
        break;

      case 'reload':
        await page.reload({ timeout });
        break;

      // Input Actions
      case 'type':
      case 'fill':
      case 'input':
        await page.fill(step.selector, step.value, { timeout });
        break;

      case 'press':
      case 'keypress':
        await page.press(step.selector, step.key || step.value, { timeout });
        break;

      case 'check':
        await page.check(step.selector, { timeout });
        break;

      case 'uncheck':
        await page.uncheck(step.selector, { timeout });
        break;

      case 'select':
        await page.selectOption(step.selector, step.value, { timeout });
        break;

      // Mouse Actions
      case 'click':
        await page.click(step.selector, { 
          timeout, 
          button: step.button || 'left',
          clickCount: step.clickCount || 1,
          modifiers: step.modifiers || []
        });
        break;

      case 'dblclick':
      case 'double_click':
        await page.dblclick(step.selector, { timeout });
        break;

      case 'right_click':
      case 'context_menu':
        await page.click(step.selector, { button: 'right', timeout });
        break;

      case 'hover':
        await page.hover(step.selector, { timeout });
        break;

      case 'drag':
        await page.dragAndDrop(step.source, step.target, { timeout });
        break;

      case 'scroll':
        await page.evaluate((selector) => {
          document.querySelector(selector)?.scrollIntoView();
        }, step.selector);
        break;

      // Wait Actions
      case 'wait':
      case 'wait_for_element':
        if (step.selector) {
          await page.waitForSelector(step.selector, { 
            state: step.state || 'visible', 
            timeout 
          });
        }
        if (step.duration) {
          await page.waitForTimeout(step.duration);
        }
        break;

      case 'wait_for_load':
        await page.waitForLoadState(step.state || 'load', { timeout });
        break;

      case 'wait_for_navigation':
        await page.waitForNavigation({ timeout, waitUntil: step.waitUntil || 'load' });
        break;

      case 'wait_for_request':
        await page.waitForRequest(step.urlPattern || step.url, { timeout });
        break;

      case 'wait_for_response':
        await page.waitForResponse(step.urlPattern || step.url, { timeout });
        break;

      // Verification Actions
      case 'verify':
      case 'assert':
        await executeVerification(page, step, timeout);
        break;

      case 'verify_text':
      case 'assert_text':
        const text = await page.textContent(step.selector);
        if (step.contains) {
          if (!text.includes(step.contains)) {
            throw new Error(`Expected text to contain "${step.contains}", but got: ${text}`);
          }
        } else if (step.equals) {
          if (text !== step.equals) {
            throw new Error(`Expected text to be "${step.equals}", but got: ${text}`);
          }
        }
        break;

      case 'verify_url':
      case 'assert_url':
        const currentUrl = page.url();
        if (step.contains && !currentUrl.includes(step.contains)) {
          throw new Error(`Expected URL to contain "${step.contains}", but got: ${currentUrl}`);
        }
        if (step.equals && currentUrl !== step.equals) {
          throw new Error(`Expected URL to be "${step.equals}", but got: ${currentUrl}`);
        }
        break;

      case 'verify_title':
      case 'assert_title':
        const title = await page.title();
        if (step.contains && !title.includes(step.contains)) {
          throw new Error(`Expected title to contain "${step.contains}", but got: ${title}`);
        }
        if (step.equals && title !== step.equals) {
          throw new Error(`Expected title to be "${step.equals}", but got: ${title}`);
        }
        break;

      // Screenshot & Media
      case 'screenshot':
        const screenshotPath = step.path || `./screenshots/screenshot-${Date.now()}.png`;
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: step.fullPage ?? false,
          clip: step.clip || undefined
        });
        console.log(`Screenshot saved at: ${screenshotPath}`);
        break;

      case 'video':
        // Video is handled at context level, this is just a marker
        break;

      // File Operations
      case 'upload':
      case 'upload_file':
        const input = await page.$(step.selector);
        await input.setInputFiles(step.files, { timeout });
        break;

      case 'download':
        const downloadPromise = page.waitForEvent('download');
        await page.click(step.selector, { timeout });
        const download = await downloadPromise;
        if (step.savePath) {
          await download.saveAs(step.savePath);
        }
        break;

      // Dialog Handling
      case 'accept_dialog':
      case 'accept_alert':
        page.once('dialog', dialog => dialog.accept());
        await page.click(step.selector, { timeout });
        break;

      case 'dismiss_dialog':
      case 'dismiss_alert':
        page.once('dialog', dialog => dialog.dismiss());
        await page.click(step.selector, { timeout });
        break;

      // Frame Handling
      case 'switch_to_frame':
        const frame = page.frame(step.selector || step.name || step.url);
        if (frame) {
          page = frame;
        }
        break;

      case 'switch_to_main':
        page = page.mainFrame();
        break;

      // Tab/Window Handling
      case 'new_tab':
      case 'new_page':
        page = await context.newPage();
        if (step.url) {
          await page.goto(step.url, { timeout });
        }
        break;

      case 'close_tab':
      case 'close_page':
        await page.close();
        const pages = context.pages();
        if (pages.length > 0) {
          page = pages[pages.length - 1];
        } else {
          // If no pages left, create a new one
          page = await context.newPage();
        }
        break;

      case 'switch_to_tab':
        const pages_list = context.pages();
        if (step.index !== undefined && pages_list[step.index]) {
          page = pages_list[step.index];
        }
        break;

      // Cookie Handling
      case 'set_cookie':
        await context.addCookies([{
          name: step.name,
          value: step.value,
          url: step.url || config.base_url,
          domain: step.domain,
          path: step.path || '/',
          expires: step.expires,
          httpOnly: step.httpOnly ?? false,
          secure: step.secure ?? false,
          sameSite: step.sameSite || 'Lax'
        }]);
        break;

      case 'clear_cookies':
        await context.clearCookies();
        break;

      case 'delete_cookie':
        const cookies = await context.cookies();
        const filtered = cookies.filter(c => c.name !== step.name);
        await context.clearCookies();
        await context.addCookies(filtered);
        break;

      // Storage & State
      case 'save_storage':
        await context.storageState({ path: step.path || './storage/state.json' });
        break;

      case 'load_storage':
        await context.storageState({ path: step.path || './storage/state.json' });
        break;

      // Console & Debugging
      case 'log':
      case 'console_log':
        console.log(step.message || step.value);
        break;

      case 'evaluate':
      case 'execute_js':
        const result = await page.evaluate(step.script || step.code);
        if (step.variable) {
          testVariables[step.variable] = result;
        }
        break;

      // Network Mocking
      case 'mock':
      case 'mock_api':
        await page.route(step.urlPattern || step.url, route => {
          route.fulfill({
            status: step.status || 200,
            contentType: step.contentType || 'application/json',
            body: JSON.stringify(step.body || {})
          });
        });
        break;

      case 'abort_request':
        await page.route(step.urlPattern || step.url, route => route.abort());
        break;

      // Clipboard
      case 'copy':
        await page.evaluate(text => navigator.clipboard.writeText(text), step.text);
        break;

      case 'paste':
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        await page.fill(step.selector, clipboardText);
        break;

      // Geolocation
      case 'set_geolocation':
        await context.setGeolocation({ latitude: step.latitude, longitude: step.longitude });
        break;

      // Permissions
      case 'grant_permission':
        await context.grantPermissions([step.permission], { origin: step.origin });
        break;

      case 'clear_permissions':
        await context.clearPermissions();
        break;

      // Viewport & Emulation
      case 'set_viewport':
        await page.setViewportSize({ width: step.width, height: step.height });
        break;

      case 'emulate':
        const device = require('playwright').devices[step.device];
        if (device) {
          await context.updateContextOptions(device);
        }
        break;

      default:
        console.warn(`Unknown action: ${step.action}`);
    }
  } catch (error) {
    console.error(`Error executing action "${step.action}":`, error.message);
    if (step.onError === 'continue') {
      console.log('Continuing despite error...');
    } else {
      throw error;
    }
  }
}

// Execute verification actions
async function executeVerification(page, step, timeout) {
  switch (step.condition) {
    case 'visible':
      const isVisible = await page.isVisible(step.selector, { timeout });
      if (!isVisible) {
        throw new Error(`Element ${step.selector} is not visible`);
      }
      break;

    case 'hidden':
      const isHidden = await page.isHidden(step.selector, { timeout });
      if (!isHidden) {
        throw new Error(`Element ${step.selector} is not hidden`);
      }
      break;

    case 'enabled':
      const isEnabled = await page.isEnabled(step.selector, { timeout });
      if (!isEnabled) {
        throw new Error(`Element ${step.selector} is not enabled`);
      }
      break;

    case 'disabled':
      const isDisabled = await page.isDisabled(step.selector, { timeout });
      if (!isDisabled) {
        throw new Error(`Element ${step.selector} is not disabled`);
      }
      break;

    case 'editable':
      const isEditable = await page.isEditable(step.selector, { timeout });
      if (!isEditable) {
        throw new Error(`Element ${step.selector} is not editable`);
      }
      break;

    case 'checked':
      const isChecked = await page.isChecked(step.selector, { timeout });
      if (!isChecked) {
        throw new Error(`Element ${step.selector} is not checked`);
      }
      break;

    case 'exists':
      const exists = await page.$(step.selector);
      if (!exists) {
        throw new Error(`Element ${step.selector} does not exist`);
      }
      break;

    case 'count':
      const elements = await page.$$(step.selector);
      const expectedCount = step.expectedCount ?? step.count;
      if (elements.length !== expectedCount) {
        throw new Error(`Expected ${expectedCount} elements, found ${elements.length}`);
      }
      break;

    case 'attribute':
      const attributeValue = await page.getAttribute(step.selector, step.attribute, { timeout });
      if (step.equals && attributeValue !== step.equals) {
        throw new Error(`Expected attribute ${step.attribute} to be "${step.equals}", got "${attributeValue}"`);
      }
      if (step.contains && !attributeValue.includes(step.contains)) {
        throw new Error(`Expected attribute ${step.attribute} to contain "${step.contains}", got "${attributeValue}"`);
      }
      break;

    case 'css_class':
      const classList = await page.$eval(step.selector, el => Array.from(el.classList));
      if (!classList.includes(step.class)) {
        throw new Error(`Element ${step.selector} does not have class "${step.class}"`);
      }
      break;

    default:
      console.warn(`Unknown verification condition: ${step.condition}`);
  }
}

// Handle conditional verify action
async function handleConditionalVerify(page, step, config, context, browser, testVariables = {}) {
  // First substitute variables in the condition itself
  const processedStep = substituteVariables(step, config, testVariables);
  const condition = processedStep.condition;
  
  // Determine which steps to execute based on condition
  if (condition === 'success' || condition === true || condition === 'true') {
    console.log('Executing success path...');
    if (step.success_steps) {
      for (const subStep of step.success_steps) {
        const processedSubStep = substituteVariables(subStep, config, testVariables);
        if (processedSubStep.action.toLowerCase() !== 'conditional_verify') {
          console.log(`Executing step: ${processedSubStep.action}`);
          await executeAction(page, processedSubStep, config, context, browser);
        }
      }
    }
  } else if (condition === 'fail' || condition === false || condition === 'false') {
    console.log('Executing fail path...');
    if (step.fail_steps) {
      for (const subStep of step.fail_steps) {
        const processedSubStep = substituteVariables(subStep, config, testVariables);
        if (processedSubStep.action.toLowerCase() !== 'conditional_verify') {
          console.log(`Executing step: ${processedSubStep.action}`);
          await executeAction(page, processedSubStep, config, context, browser);
        }
      }
    }
  } else {
    console.warn(`Unknown conditional_verify condition: ${condition}`);
  }
}

module.exports = { runTest, loadTestCases, loadConfig };
