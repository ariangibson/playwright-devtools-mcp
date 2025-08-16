export const DEFAULT_CONFIG = {
  browser: {
    type: 'chromium',
    headless: false,
    timeout: 30000,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-gpu',
      '--enable-logging',
      '--log-level=1'
    ]
  },
  server: {
    maxConcurrentPages: 3,
    pageTimeout: 60000,
    memoryThreshold: 500 * 1024 * 1024, // 500MB
    autoCleanup: true
  },
  network: {
    recordHar: false,
    maxResponseSize: 10 * 1024 * 1024, // 10MB
    timeout: 30000
  },
  debug: {
    screenshotOnError: false,
    saveConsoleLogs: true,
    verboseLogging: false
  }
};

export function getConfig() {
  const config = { ...DEFAULT_CONFIG };
  
  // Override with environment variables
  if (process.env.PLAYWRIGHT_BROWSER_TYPE) {
    config.browser.type = process.env.PLAYWRIGHT_BROWSER_TYPE;
  }
  
  if (process.env.PLAYWRIGHT_HEADLESS !== undefined) {
    config.browser.headless = process.env.PLAYWRIGHT_HEADLESS === 'true';
  }
  
  if (process.env.PLAYWRIGHT_TIMEOUT) {
    config.browser.timeout = parseInt(process.env.PLAYWRIGHT_TIMEOUT, 10);
  }
  
  if (process.env.MCP_MAX_CONCURRENT_PAGES) {
    config.server.maxConcurrentPages = parseInt(process.env.MCP_MAX_CONCURRENT_PAGES, 10);
  }
  
  if (process.env.DEBUG && process.env.DEBUG.includes('playwright-devtools')) {
    config.debug.verboseLogging = true;
  }
  
  return config;
}