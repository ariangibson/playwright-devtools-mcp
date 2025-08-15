import { browserManager } from '../utils/browser-manager.js';

export const browserLaunchTool = {
  name: 'browser_launch',
  description: 'Launch a new browser instance and create a browser context for web debugging',
  inputSchema: {
    type: 'object',
    properties: {
      headless: {
        type: 'boolean',
        description: 'Run browser in headless mode',
        default: true
      },
      viewport: {
        type: 'object',
        description: 'Browser viewport dimensions',
        properties: {
          width: { type: 'number', default: 1280 },
          height: { type: 'number', default: 720 }
        },
        default: { width: 1280, height: 720 }
      },
      userAgent: {
        type: 'string',
        description: 'Custom user agent string'
      }
    }
  },
  
  async handler(params) {
    try {
      const options = {
        viewport: params.viewport || { width: 1280, height: 720 },
        userAgent: params.userAgent
      };

      // Override headless setting if provided
      if (params.headless !== undefined) {
        browserManager.config.browser.headless = params.headless;
      }

      const contextId = await browserManager.createContext(options);
      const stats = browserManager.getStats();

      return {
        success: true,
        data: {
          contextId,
          viewport: options.viewport,
          userAgent: options.userAgent,
          stats
        },
        metadata: {
          timestamp: Date.now(),
          browserType: browserManager.config.browser.type,
          headless: browserManager.config.browser.headless
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now()
        },
        error: {
          code: 'BROWSER_LAUNCH_FAILED',
          message: `Failed to launch browser: ${error.message}`,
          details: { originalError: error.toString() }
        }
      };
    }
  }
};

export const browserNavigateTool = {
  name: 'browser_navigate',
  description: 'Navigate to a URL and wait for the page to load',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      url: {
        type: 'string',
        description: 'URL to navigate to',
        format: 'uri'
      },
      waitFor: {
        type: 'string',
        description: 'Wait condition before returning',
        enum: ['load', 'domcontentloaded', 'networkidle'],
        default: 'load'
      },
      timeout: {
        type: 'number',
        description: 'Navigation timeout in milliseconds',
        default: 30000
      }
    },
    required: ['contextId', 'url']
  },
  
  async handler(params) {
    try {
      // Check context health before navigation
      const attempts = browserManager.navigationGuard.getAttempts(params.contextId);
      if (attempts >= 2) {
        return {
          success: false,
          data: null,
          metadata: {
            timestamp: Date.now(),
            contextId: params.contextId
          },
          error: {
            code: 'CONTEXT_UNSTABLE',
            message: `Context has ${attempts} failed attempts. Use browser_navigate_safe or browser_force_recreate for recovery.`,
            details: { 
              url: params.url,
              attempts,
              suggestion: 'Use browser_navigate_safe for automatic recovery or browser_force_recreate to start fresh'
            }
          }
        };
      }

      const page = await browserManager.createPage(params.contextId);
      const startTime = Date.now();
      
      const response = await page.goto(params.url, {
        waitUntil: params.waitFor || 'load',
        timeout: params.timeout || 30000
      });

      const endTime = Date.now();
      const title = await page.title();
      const finalUrl = page.url();

      // Reset attempts on successful navigation
      browserManager.navigationGuard.resetAttempts(params.contextId);

      return {
        success: true,
        data: {
          url: finalUrl,
          title,
          status: response?.status(),
          statusText: response?.statusText(),
          loadTime: endTime - startTime,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          duration: endTime - startTime,
          waitCondition: params.waitFor || 'load'
        },
        error: null
      };
    } catch (error) {
      // Track failed navigation attempt
      const attempts = browserManager.navigationGuard.getAttempts(params.contextId);
      browserManager.navigationGuard.navigationAttempts.set(params.contextId, attempts + 1);

      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          attempts: attempts + 1
        },
        error: {
          code: 'NAVIGATION_FAILED',
          message: `Failed to navigate to ${params.url}: ${error.message}`,
          details: { 
            url: params.url,
            attempts: attempts + 1,
            suggestion: attempts + 1 >= 2 ? 'Consider using browser_navigate_safe for automatic recovery' : 'Retry or use browser_navigate_safe',
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const browserCloseTool = {
  name: 'browser_close',
  description: 'Close a browser context and clean up resources',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID to close'
      }
    },
    required: ['contextId']
  },
  
  async handler(params) {
    try {
      await browserManager.closeContext(params.contextId);
      const stats = browserManager.getStats();

      return {
        success: true,
        data: {
          contextId: params.contextId,
          stats
        },
        metadata: {
          timestamp: Date.now()
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
        },
        error: {
          code: 'CONTEXT_CLOSE_FAILED',
          message: `Failed to close browser context: ${error.message}`,
          details: { 
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};