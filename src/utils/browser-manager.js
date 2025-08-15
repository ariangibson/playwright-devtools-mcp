import { chromium, firefox, webkit } from 'playwright';
import { getConfig } from '../config/defaults.js';
import { ConsoleCollector, NetworkCollector, PerformanceCollector } from './data-collector.js';

class BrowserManager {
  constructor() {
    this.browser = null;
    this.contexts = new Map();
    this.config = getConfig();
    this.activePages = 0;
    this.dataCollectors = new Map(); // contextId -> collectors
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
      
      // Create data collectors for this context
      const collectors = {
        console: new ConsoleCollector(),
        network: new NetworkCollector(), 
        performance: new PerformanceCollector()
      };

      this.contexts.set(contextId, { context, cdpSession });
      this.dataCollectors.set(contextId, collectors);
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
    const collectors = this.dataCollectors.get(contextId);
    
    if (this.activePages >= this.config.server.maxConcurrentPages) {
      throw new Error(`Maximum concurrent pages limit reached: ${this.config.server.maxConcurrentPages}`);
    }

    try {
      const page = await context.newPage();
      this.activePages++;
      
      // Setup console log collection
      page.on('console', (msg) => {
        const logEntry = {
          type: msg.type(),
          text: msg.text(),
          location: msg.location(),
          timestamp: Date.now(),
          args: msg.args().map(arg => arg.toString())
        };
        
        collectors.console.addLog(logEntry);
        this.log(`Console [${msg.type()}]: ${msg.text()}`);
      });
      
      // Setup page error collection
      page.on('pageerror', (error) => {
        const errorEntry = {
          type: 'pageerror',
          text: error.message,
          location: { url: page.url() },
          timestamp: Date.now(),
          args: [],
          stackTrace: error.stack
        };
        
        collectors.console.addLog(errorEntry);
        this.log(`Page error: ${error.message}`);
      });

      // Setup network request monitoring
      page.on('request', (request) => {
        const requestData = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          resourceType: request.resourceType(),
          timestamp: Date.now(),
          postData: request.postData(),
          failed: false,
          response: null
        };
        
        collectors.network.addRequest(requestData);
      });

      page.on('response', async (response) => {
        // Find the corresponding request and update it
        const requests = collectors.network.getRequests({ 
          urlContains: response.url(),
          limit: 1 
        });
        
        if (requests.length > 0) {
          const request = requests[0];
          request.response = {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            url: response.url(),
            timestamp: Date.now()
          };
        }
      });

      page.on('requestfailed', (request) => {
        // Mark request as failed
        const requests = collectors.network.getRequests({ 
          urlContains: request.url(),
          limit: 1 
        });
        
        if (requests.length > 0) {
          requests[0].failed = true;
          requests[0].failure = request.failure()?.errorText || 'Request failed';
        }
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
        this.dataCollectors.delete(contextId); // Clean up collectors
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
    this.dataCollectors.clear(); // Clean up all collectors
  }

  getCollectors(contextId) {
    return this.dataCollectors.get(contextId);
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