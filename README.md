
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

### Customizing Your Tests

1. **Adding New Test Cases**: To add a new test case, create a new YAML file in the `tests` directory, similar to `login-test.yaml`, and define your test steps.
   
2. **Configuring Test Settings**: Modify `test-config.yaml` to update global settings such as the base URL, login credentials, and timeout values.

3. **Modify Timeouts**: The timeout for each action can be configured globally in `test-config.yaml`. You can increase or decrease the timeout for waiting, clicking, or typing actions.

### Supported Actions in Test Cases

- **open**: Opens the URL (defined in the test case) in the browser.
- **type**: Types a value into the specified selector.
- **click**: Clicks on the specified element.
- **wait**: Waits for an element to appear on the page.
- **verify**: Verifies that an element is visible on the page.

### Troubleshooting

- Ensure that **Playwright** is installed correctly by running `npx playwright install`.
- If tests run too quickly, adjust the timeout values in the configuration file to allow more time for actions like clicking and waiting for elements.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

This `README.md` provides a comprehensive guide to getting started with the automation testing framework, from installing the project to running and customizing tests. Feel free to modify the configurations and test cases according to your needs!
