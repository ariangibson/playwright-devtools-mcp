import { chromium, firefox, webkit } from 'playwright';
import { getConfig } from '../config/defaults.js';

class BrowserManager {
  constructor() {
    this.browser = null;
    this.contexts = new Map();
    this.config = getConfig();
    this.activePages = 0;
  }

  async launchBrowser() {
    if (this.browser) {
      return this.browser;
    }

    const { browser: browserConfig } = this.config;
    
    let browserType;
    switch (browserConfig.type) {
      case 'firefox':
        browserType = firefox;
        break;
      case 'webkit':
        browserType = webkit;
        break;
      case 'chromium':
      default:
        browserType = chromium;
        break;
    }

    try {
      this.browser = await browserType.launch({
        headless: browserConfig.headless,
        args: browserConfig.args,
        timeout: browserConfig.timeout,
        devtools: !browserConfig.headless, // Enable DevTools in headed mode
      });

      this.log('Browser launched successfully');
      
      // Setup cleanup on browser disconnect
      this.browser.on('disconnected', () => {
        this.log('Browser disconnected');
        this.browser = null;
        this.contexts.clear();
        this.activePages = 0;
      });

      return this.browser;
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }

  async createContext(options = {}) {
    await this.launchBrowser();
    
    const contextId = `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const context = await this.browser.newContext({
        viewport: options.viewport || { width: 1280, height: 720 },
        userAgent: options.userAgent,
        ...options
      });

      // Enable CDP for DevTools access
      const cdpSession = await context.newCDPSession(await context.newPage());
      await context.pages()[0].close(); // Close the initial page
      
      this.contexts.set(contextId, { context, cdpSession });
      this.log(`Created browser context: ${contextId}`);
      
      return contextId;
    } catch (error) {
      throw new Error(`Failed to create browser context: ${error.message}`);
    }
  }

  async getContext(contextId) {
    const contextData = this.contexts.get(contextId);
    if (!contextData) {
      throw new Error(`Browser context not found: ${contextId}`);
    }
    return contextData;
  }

  async createPage(contextId) {
    const { context } = await this.getContext(contextId);
    
    if (this.activePages >= this.config.server.maxConcurrentPages) {
      throw new Error(`Maximum concurrent pages limit reached: ${this.config.server.maxConcurrentPages}`);
    }

    try {
      const page = await context.newPage();
      this.activePages++;
      
      // Setup page event listeners for debugging
      page.on('console', (msg) => {
        this.log(`Console [${msg.type()}]: ${msg.text()}`);
      });
      
      page.on('pageerror', (error) => {
        this.log(`Page error: ${error.message}`);
      });

      page.on('close', () => {
        this.activePages = Math.max(0, this.activePages - 1);
      });

      this.log(`Created new page in context: ${contextId}`);
      return page;
    } catch (error) {
      throw new Error(`Failed to create page: ${error.message}`);
    }
  }

  async closeContext(contextId) {
    const contextData = this.contexts.get(contextId);
    if (contextData) {
      try {
        await contextData.context.close();
        this.contexts.delete(contextId);
        this.log(`Closed browser context: ${contextId}`);
      } catch (error) {
        this.log(`Error closing context ${contextId}: ${error.message}`);
      }
    }
  }

  async cleanup() {
    this.log('Starting cleanup...');
    
    // Close all contexts
    for (const [contextId] of this.contexts) {
      await this.closeContext(contextId);
    }
    
    // Close browser
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.log('Browser closed successfully');
      } catch (error) {
        this.log(`Error closing browser: ${error.message}`);
      }
    }
    
    this.activePages = 0;
  }

  getStats() {
    return {
      browserRunning: !!this.browser,
      activeContexts: this.contexts.size,
      activePages: this.activePages,
      maxPages: this.config.server.maxConcurrentPages
    };
  }

  log(message) {
    if (this.config.debug.verboseLogging) {
      console.error(`[BrowserManager] ${message}`);
    }
  }
}

// Singleton instance
export const browserManager = new BrowserManager();

// Cleanup on process exit
process.on('exit', () => {
  browserManager.cleanup();
});

process.on('SIGINT', () => {
  browserManager.cleanup();
});

process.on('SIGTERM', () => {
  browserManager.cleanup();
});