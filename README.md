
# Automation Testing Framework with Playwright and YAML

This is a simple automation testing framework designed to execute web application tests using **Playwright** with test scenarios written in **YAML** format. The framework allows easy configuration and flexibility in defining test steps for a variety of web interactions.

## Project Structure

The project is organized as follows:

```
my-automation-framework/
│
├── config/           # Framework configuration files
│   ├── test-config.yaml  # YAML configuration for global settings (base URL, credentials, timeout, etc.)
│
├── tests/            # Contains test files
│   └── login-test.yaml  # Example test case in YAML (Login Test)
│
├── src/              # Core code for running tests
│   ├── runner.js     # Script to load and run tests
│   └── executor.js   # Executor for performing actions defined in YAML test cases
│
├── package.json      # Node.js dependencies and scripts
└── README.md         # This documentation
```

### Configuration File (`test-config.yaml`)

In the `config` directory, the `test-config.yaml` file holds global configurations for the tests, such as the base URL of the application, credentials, and timeout values.

#### Example `test-config.yaml`

```yaml
base_url: "https://www.saucedemo.com"   # Base URL for your web application
credentials:
  username: "standard_user"             # Username for login
  password: "secret_sauce"              # Password for login
timeout: 5000                           # Timeout for each action (in milliseconds)
```

### Test Case File (`login-test.yaml`)

In the `tests` directory, YAML files describe the test cases. The steps for each test case include actions like opening a page, typing in a field, clicking buttons, waiting for elements, and verifying visibility.

#### Example `login-test.yaml`

```yaml
test_name: "Login Test"
steps:
  - action: "open"
    url: "{{base_url}}"
  
  - action: "type"
    selector: "#user-name"
    value: "{{credentials.username}}"
  
  - action: "type"
    selector: "#password"
    value: "{{credentials.password}}"
  
  - action: "click"
    selector: "#login-button"

  - action: "wait"
    selector: ".inventory_list"  # Wait for the element that confirms the page is loaded
  
  - action: "verify"
    selector: ".inventory_list"
    condition: "visible"
```

### Core Files

#### `src/executor.js`

The core file that interprets the YAML test steps and interacts with the browser using **Playwright**.

- Opens the browser.
- Fills forms, clicks buttons, and waits for elements.
- Verifies the visibility of elements as defined in the test.

#### `src/runner.js`

This file loads the test case and configuration files, then runs the tests using the `executor.js` functions.

```javascript
const { runTest, loadTestCases, loadConfig } = require('./executor');
const path = require('path');

// Load configuration and test case
const config = loadConfig(path.join(__dirname, '../config/test-config.yaml'));
const testCase = loadTestCases(path.join(__dirname, '../tests/login-test.yaml'));

// Run the test
runTest(testCase, config).catch(error => console.error(error));
```

### Installation

To get started with this automation testing framework, follow the steps below:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate into the project folder:
   ```bash
   cd my-automation-framework
   ```

3. Install the dependencies:
   ```bash
   npm install
   ```

4. You may need to install **Playwright** separately if it isn't already installed:
   ```bash
   npx playwright install
   ```

### Running the Tests

To run the tests, simply execute the `runner.js` file with Node.js:

```bash
node src/runner.js
```

This will load the test case defined in `login-test.yaml` and execute it based on the configuration from `test-config.yaml`.

## Advanced Test Configuration

### Browser & Device Configuration

You can configure browser type, viewport, device emulation, and more at the test case level:

```yaml
test_name: "Mobile Responsive Test"
browser: "chromium"  # chromium, firefox, webkit
headless: false
viewport:
  width: 375
  height: 667
device: "iPhone 13"  # Optional: use predefined device emulation
userAgent: "Mozilla/5.0..."
locale: "en-US"
timezone: "America/New_York"
ignoreHTTPSErrors: true
tracing: true  # Enable tracing for debugging
screenshot: true  # Take screenshot at end of test
fullPageScreenshot: true
steps:
  - action: "open"
    url: "{{base_url}}"
```

### Variables Support

Define test-specific variables that can be used throughout the test:

```yaml
test_name: "Dynamic Data Test"
variables:
  productName: "Premium Plan"
  expectedPrice: "$99"
  testEmail: "test@example.com"
steps:
  - action: "type"
    selector: "#email"
    value: "{{testEmail}}"
  - action: "verify_text"
    selector: ".product-name"
    equals: "{{productName}}"
```

### Conditional Execution

Handle different scenarios based on conditions:

```yaml
test_name: "Conditional Test"
users:
  - username: "standard_user"
    expected: "success"
  - username: "locked_out_user"
    expected: "fail"
steps:
  - action: "type"
    selector: "#user-name"
    value: "{{user.username}}"
  
  - action: "conditional_verify"
    condition: "{{user.expected}}"
    success_steps:
      - action: "verify"
        selector: ".dashboard"
        condition: "visible"
    fail_steps:
      - action: "verify"
        selector: ".error-message"
        condition: "visible"
```

### Error Handling

Control behavior when actions fail:

```yaml
test_name: "Resilient Test"
steps:
  - action: "click"
    selector: ".optional-element"
    onError: "continue"  # Continue even if this fails
    timeout: 2000
  
  - action: "verify"
    selector: ".main-content"
    condition: "visible"
```

### Network Mocking

Mock API responses for testing:

```yaml
test_name: "API Mocking Test"
steps:
  - action: "mock"
    urlPattern: "**/api/users/*"
    status: 200
    contentType: "application/json"
    body:
      id: 1
      name: "Mocked User"
  
  - action: "open"
    url: "https://example.com/users/1"
  
  - action: "verify_text"
    selector: ".user-name"
    equals: "Mocked User"
```

### Multi-Tab Testing

Test scenarios involving multiple tabs:

```yaml
test_name: "Multi-Tab Test"
steps:
  - action: "open"
    url: "https://example.com"
  
  - action: "new_tab"
    url: "https://example.com/dashboard"
  
  - action: "switch_to_tab"
    index: 0
  
  - action: "verify_url"
    contains: "example.com"
  
  - action: "close_tab"
```

### File Upload & Download

Handle file operations:

```yaml
test_name: "File Operations Test"
steps:
  - action: "upload"
    selector: "#file-upload"
    files:
      - "./test-files/document.pdf"
  
  - action: "click"
    selector: "#download-link"
  
  - action: "download"
    savePath: "./downloads/downloaded-file.pdf"
```

### Screenshot & Tracing

Capture test execution for debugging:

```yaml
test_name: "Debug Test"
tracing: true
steps:
  - action: "open"
    url: "{{base_url}}"
  
  - action: "screenshot"
    path: "./screenshots/before-action.png"
    fullPage: true
  
  - action: "click"
    selector: "#button"
```

### Cookie Management

Test cookie-based scenarios:

```yaml
test_name: "Cookie Test"
steps:
  - action: "set_cookie"
    name: "session_id"
    value: "abc123xyz"
    domain: ".example.com"
    secure: true
    httpOnly: true
  
  - action: "open"
    url: "https://example.com"
  
  - action: "verify"
    selector: ".logged-in-indicator"
    condition: "visible"
```

### Geolocation Testing

Test location-based features:

```yaml
test_name: "Geolocation Test"
steps:
  - action: "grant_permission"
    permission: "geolocation"
    origin: "https://example.com"
  
  - action: "set_geolocation"
    latitude: 40.7128
    longitude: -74.0060
  
  - action: "open"
    url: "https://example.com/map"
  
  - action: "verify"
    selector: ".location-marker"
    condition: "visible"
```

### JavaScript Execution

Execute custom JavaScript:

```yaml
test_name: "Custom JS Test"
steps:
  - action: "evaluate"
    script: |
      () => {
        return document.querySelector('.counter').textContent;
      }
    variable: "counterValue"
  
  - action: "log"
    message: "Counter value: {{counterValue}}"
```

### Frame Handling

Work with iframes:

```yaml
test_name: "Iframe Test"
steps:
  - action: "open"
    url: "https://example.com/with-frame"
  
  - action: "switch_to_frame"
    selector: "#content-frame"
  
  - action: "click"
    selector: "#inside-frame-button"
  
  - action: "switch_to_main"
  
  - action: "verify"
    selector: ".outside-content"
    condition: "visible"
```

### Permission Testing

Test browser permissions:

```yaml
test_name: "Permission Test"
steps:
  - action: "grant_permission"
    permission: "notifications"
  
  - action: "open"
    url: "https://example.com/notify"
  
  - action: "clear_permissions"
```

### Viewport & Responsive Testing

Test responsive designs:

```yaml
test_name: "Responsive Test"
steps:
  - action: "set_viewport"
    width: 1920
    height: 1080
  
  - action: "screenshot"
    path: "./screenshots/desktop.png"
  
  - action: "set_viewport"
    width: 375
    height: 667
  
  - action: "screenshot"
    path: "./screenshots/mobile.png"
```

### Customizing Your Tests

1. **Adding New Test Cases**: To add a new test case, create a new YAML file in the `tests` directory, similar to `login-test.yaml`, and define your test steps.
   
2. **Configuring Test Settings**: Modify `test-config.yaml` to update global settings such as the base URL, login credentials, and timeout values.

3. **Modify Timeouts**: The timeout for each action can be configured globally in `test-config.yaml`. You can increase or decrease the timeout for waiting, clicking, or typing actions.

### Supported Actions in Test Cases

The framework supports comprehensive Playwright actions covering all modern testing capabilities:

#### **Navigation Actions**
- **open** / **navigate** / **goto**: Opens a URL in the browser.
  ```yaml
  - action: "open"
    url: "https://example.com"
    waitUntil: "load"  # optional: load, domcontentloaded, networkidle, commit
  ```
- **go_back** / **back**: Navigates back in browser history.
- **go_forward** / **forward**: Navigates forward in browser history.
- **reload**: Reloads the current page.

#### **Input Actions**
- **type** / **fill** / **input**: Types text into an input field.
  ```yaml
  - action: "type"
    selector: "#username"
    value: "testuser"
  ```
- **press** / **keypress**: Presses a key on an element.
  ```yaml
  - action: "press"
    selector: "#input"
    key: "Enter"  # or use value: "Enter"
  ```
- **check**: Checks a checkbox.
- **uncheck**: Unchecks a checkbox.
- **select**: Selects an option in a dropdown.
  ```yaml
  - action: "select"
    selector: "#dropdown"
    value: "option1"
  ```

#### **Mouse Actions**
- **click**: Clicks on an element.
  ```yaml
  - action: "click"
    selector: "#button"
    button: "left"  # left, right, middle
    clickCount: 1   # number of clicks
    modifiers: []   # Shift, Control, Alt, Meta
  ```
- **dblclick** / **double_click**: Double-clicks on an element.
- **right_click** / **context_menu**: Right-clicks on an element.
- **hover**: Hovers over an element.
  ```yaml
  - action: "hover"
    selector: ".tooltip-trigger"
  ```
- **drag**: Drags and drops an element.
  ```yaml
  - action: "drag"
    source: "#draggable"
    target: "#droppable"
  ```
- **scroll**: Scrolls an element into view.

#### **Wait Actions**
- **wait** / **wait_for_element**: Waits for an element to appear.
  ```yaml
  - action: "wait"
    selector: ".element"
    state: "visible"  # visible, hidden, attached, detached
    duration: 1000    # optional additional wait in ms
  ```
- **wait_for_load**: Waits for page load state.
  ```yaml
  - action: "wait_for_load"
    state: "domcontentloaded"  # load, domcontentloaded, networkidle
  ```
- **wait_for_navigation**: Waits for navigation.
- **wait_for_request**: Waits for a network request.
- **wait_for_response**: Waits for a network response.

#### **Verification Actions**
- **verify** / **assert**: Verifies element state with various conditions.
  ```yaml
  - action: "verify"
    selector: ".element"
    condition: "visible"  # visible, hidden, enabled, disabled, editable, checked, exists
  ```
- **verify_text** / **assert_text**: Verifies text content.
  ```yaml
  - action: "verify_text"
    selector: ".title"
    contains: "Welcome"  # or use: equals: "Welcome Page"
  ```
- **verify_url** / **assert_url**: Verifies current URL.
  ```yaml
  - action: "verify_url"
    contains: "/dashboard"  # or use: equals: "https://example.com/dashboard"
  ```
- **verify_title** / **assert_title**: Verifies page title.
  ```yaml
  - action: "verify_title"
    contains: "Dashboard"  # or use: equals: "Dashboard Page"
  ```
- **count**: Verifies element count.
  ```yaml
  - action: "verify"
    selector: ".item"
    condition: "count"
    expectedCount: 5
  ```
- **attribute**: Verifies element attribute.
  ```yaml
  - action: "verify"
    selector: "#image"
    condition: "attribute"
    attribute: "src"
    contains: "/images/"
  ```
- **css_class**: Verifies element has a CSS class.
  ```yaml
  - action: "verify"
    selector: ".button"
    condition: "css_class"
    class: "active"
  ```

#### **Screenshot & Media**
- **screenshot**: Takes a screenshot.
  ```yaml
  - action: "screenshot"
    path: "./screenshots/homepage.png"
    fullPage: true
  ```

#### **File Operations**
- **upload** / **upload_file**: Uploads a file.
  ```yaml
  - action: "upload"
    selector: "#file-input"
    files:
      - "./files/document.pdf"
  ```
- **download**: Downloads a file.
  ```yaml
  - action: "download"
    selector: "#download-link"
    savePath: "./downloads/file.pdf"
  ```

#### **Dialog Handling**
- **accept_dialog** / **accept_alert**: Accepts an alert/dialog.
  ```yaml
  - action: "accept_alert"
    selector: "#trigger-alert"
  ```
- **dismiss_dialog** / **dismiss_alert**: Dismisses an alert/dialog.

#### **Frame Handling**
- **switch_to_frame**: Switches to an iframe.
  ```yaml
  - action: "switch_to_frame"
    selector: "#my-frame"
  ```
- **switch_to_main**: Switches back to main frame.

#### **Tab/Window Handling**
- **new_tab** / **new_page**: Opens a new tab/page.
  ```yaml
  - action: "new_tab"
    url: "https://example.com"
  ```
- **close_tab** / **close_page**: Closes current tab.
- **switch_to_tab**: Switches to a specific tab.
  ```yaml
  - action: "switch_to_tab"
    index: 1  # tab index
  ```

#### **Cookie Handling**
- **set_cookie**: Sets a cookie.
  ```yaml
  - action: "set_cookie"
    name: "session_id"
    value: "abc123"
    domain: ".example.com"
    path: "/"
    secure: true
    httpOnly: true
  ```
- **clear_cookies**: Clears all cookies.
- **delete_cookie**: Deletes a specific cookie.

#### **Storage & State**
- **save_storage**: Saves localStorage and sessionStorage.
  ```yaml
  - action: "save_storage"
    path: "./storage/state.json"
  ```
- **load_storage**: Loads storage state.

#### **Console & Debugging**
- **log** / **console_log**: Logs a message to console.
  ```yaml
  - action: "log"
    message: "Debug point reached"
  ```
- **evaluate** / **execute_js**: Executes JavaScript code.
  ```yaml
  - action: "evaluate"
    script: "document.title"
    variable: "pageTitle"  # stores result in variable
  ```

#### **Network Mocking**
- **mock** / **mock_api**: Mocks API responses.
  ```yaml
  - action: "mock"
    urlPattern: "**/api/users"
    status: 200
    body:
      id: 1
      name: "Test User"
  ```
- **abort_request**: Aborts network requests.

#### **Clipboard**
- **copy**: Copies text to clipboard.
  ```yaml
  - action: "copy"
    text: "Hello World"
  ```
- **paste**: Pastes from clipboard.
  ```yaml
  - action: "paste"
    selector: "#input-field"
  ```

#### **Geolocation**
- **set_geolocation**: Sets geolocation.
  ```yaml
  - action: "set_geolocation"
    latitude: 40.7128
    longitude: -74.0060
  ```

#### **Permissions**
- **grant_permission**: Grants browser permissions.
  ```yaml
  - action: "grant_permission"
    permission: "geolocation"  # geolocation, notifications, camera, microphone, etc.
    origin: "https://example.com"
  ```
- **clear_permissions**: Clears all permissions.

#### **Viewport & Emulation**
- **set_viewport**: Sets viewport size.
  ```yaml
  - action: "set_viewport"
    width: 1920
    height: 1080
  ```
- **emulate**: Emulates a device.
  ```yaml
  - action: "emulate"
    device: "iPhone 13"
  ```

### Troubleshooting

#### Common Issues and Solutions

1. **Playwright browsers not installed**
   ```bash
   npx playwright install
   ```

2. **Tests running too fast**
   - Increase timeout values in `test-config.yaml`
   - Add `slowMo` configuration to test case
   - Use explicit waits instead of fixed delays

3. **Element not found errors**
   - Increase timeout for specific actions
   - Use `wait_for_element` before interacting
   - Check if element is inside an iframe
   - Verify selector is correct using browser DevTools

4. **Cross-origin issues**
   - Set `ignoreHTTPSErrors: true` in test config
   - Ensure proper CORS headers in mocked responses

5. **File upload/download issues**
   - Verify file paths are absolute or relative to project root
   - Create directories before downloading files
   - Use `waitForEvent('download')` for downloads

6. **Multi-tab testing problems**
   - Always switch to tab before interacting
   - Close tabs properly to avoid memory leaks
   - Use `context.pages()` to list available tabs

7. **Tracing not working**
   - Ensure `tracing: true` in test configuration
   - Create `./traces` directory
   - View traces with: `npx playwright show-trace trace.zip`

8. **Variable substitution not working**
   - Check variable syntax: `{{variableName}}`
   - Ensure variable is defined in `variables` section
   - Config variables use dot notation: `{{credentials.username}}`

#### Debug Mode

Enable debug mode for detailed logging:
```yaml
browser: "chromium"
headless: false
slowMo: 500  # Slow down actions by 500ms
```

#### Performance Tips

- Use `networkidle` wait strategy for SPA applications
- Mock unnecessary API calls to speed up tests
- Use appropriate selectors (CSS > XPath)
- Avoid fixed waits, prefer dynamic waits
- Enable headless mode for CI/CD environments

### Quick Reference Guide

#### Action Categories

| Category | Actions |
|----------|---------|
| **Navigation** | open, navigate, goto, go_back, back, go_forward, forward, reload |
| **Input** | type, fill, input, press, keypress, check, uncheck, select |
| **Mouse** | click, dblclick, double_click, right_click, context_menu, hover, drag, scroll |
| **Wait** | wait, wait_for_element, wait_for_load, wait_for_navigation, wait_for_request, wait_for_response |
| **Verify** | verify, assert, verify_text, assert_text, verify_url, assert_url, verify_title, assert_title |
| **Media** | screenshot, video |
| **Files** | upload, upload_file, download |
| **Dialogs** | accept_dialog, accept_alert, dismiss_dialog, dismiss_alert |
| **Frames** | switch_to_frame, switch_to_main |
| **Tabs** | new_tab, new_page, close_tab, close_page, switch_to_tab |
| **Cookies** | set_cookie, clear_cookies, delete_cookie |
| **Storage** | save_storage, load_storage |
| **Console** | log, console_log, evaluate, execute_js |
| **Network** | mock, mock_api, abort_request |
| **Clipboard** | copy, paste |
| **Location** | set_geolocation |
| **Permissions** | grant_permission, clear_permissions |
| **Viewport** | set_viewport, emulate |

#### Verification Conditions

| Condition | Description |
|-----------|-------------|
| `visible` | Element is visible on page |
| `hidden` | Element is hidden |
| `enabled` | Element is enabled |
| `disabled` | Element is disabled |
| `editable` | Element is editable |
| `checked` | Checkbox/radio is checked |
| `exists` | Element exists in DOM |
| `count` | Number of elements matches |
| `attribute` | Element attribute matches |
| `css_class` | Element has CSS class |

#### Browser Types

- `chromium` - Google Chrome/Edge
- `firefox` - Mozilla Firefox
- `webkit` - Safari/Webkit

#### Wait Strategies

- `load` - Wait for load event
- `domcontentloaded` - Wait for DOMContentLoaded
- `networkidle` - Wait for network to be idle
- `commit` - Wait for navigation to commit

#### Element States

- `visible` - Element is visible
- `hidden` - Element is hidden
- `attached` - Element is attached to DOM
- `detached` - Element is detached from DOM

### Example Test Files

The project includes several example test files demonstrating different features:

- **login-test.yaml** - Basic login and checkout flow
- **multi-user-login-test.yaml** - Testing multiple user scenarios
- **complete-feature-demo.yaml** - Comprehensive demo of all actions
- **ecommerce-flow-test.yaml** - Complete e-commerce shopping flow
- **advanced-features-test.yaml** - Advanced Playwright features

### Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Add new actions or improvements
4. Submit a pull request

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

This `README.md` provides a comprehensive guide to getting started with the automation testing framework, from installing the project to running and customizing tests. Feel free to modify the configurations and test cases according to your needs!
