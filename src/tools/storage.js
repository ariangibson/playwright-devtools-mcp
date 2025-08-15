import { browserManager } from '../utils/browser-manager.js';

export const storageGetLocalStorageTool = {
  name: 'storage_get_local_storage',
  description: 'Get localStorage key/value pairs from the current page for debugging',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      keys: {
        type: 'array',
        description: 'Specific keys to retrieve (if not provided, gets all)',
        items: { type: 'string' }
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];

      const storageData = await page.evaluate((specificKeys) => {
        const storage = {};
        const stats = {
          totalKeys: localStorage.length,
          totalSize: 0
        };

        if (specificKeys && specificKeys.length > 0) {
          // Get specific keys
          for (const key of specificKeys) {
            const value = localStorage.getItem(key);
            if (value !== null) {
              storage[key] = value;
              stats.totalSize += key.length + value.length;
            }
          }
        } else {
          // Get all keys
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            storage[key] = value;
            stats.totalSize += key.length + value.length;
          }
        }

        return { storage, stats };
      }, params.keys);

      return {
        success: true,
        data: {
          localStorage: storageData.storage,
          stats: storageData.stats,
          url: page.url(),
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          keysRequested: params.keys || 'all'
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
          code: 'LOCAL_STORAGE_ACCESS_FAILED',
          message: `Failed to access localStorage: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const storageGetSessionStorageTool = {
  name: 'storage_get_session_storage',
  description: 'Get sessionStorage key/value pairs from the current page for debugging',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      keys: {
        type: 'array',
        description: 'Specific keys to retrieve (if not provided, gets all)',
        items: { type: 'string' }
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];

      const storageData = await page.evaluate((specificKeys) => {
        const storage = {};
        const stats = {
          totalKeys: sessionStorage.length,
          totalSize: 0
        };

        if (specificKeys && specificKeys.length > 0) {
          // Get specific keys
          for (const key of specificKeys) {
            const value = sessionStorage.getItem(key);
            if (value !== null) {
              storage[key] = value;
              stats.totalSize += key.length + value.length;
            }
          }
        } else {
          // Get all keys
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            storage[key] = value;
            stats.totalSize += key.length + value.length;
          }
        }

        return { storage, stats };
      }, params.keys);

      return {
        success: true,
        data: {
          sessionStorage: storageData.storage,
          stats: storageData.stats,
          url: page.url(),
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          keysRequested: params.keys || 'all'
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
          code: 'SESSION_STORAGE_ACCESS_FAILED',
          message: `Failed to access sessionStorage: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const storageGetCookiesTool = {
  name: 'storage_get_cookies',
  description: 'Get cookies for the current page with all attributes (domain, path, expiry, security flags)',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      domain: {
        type: 'string',
        description: 'Filter cookies by domain (optional)'
      },
      name: {
        type: 'string',
        description: 'Filter cookies by name (optional)'
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      let cookies = await context.cookies();

      // Apply filters
      if (params.domain) {
        cookies = cookies.filter(cookie => 
          cookie.domain === params.domain || cookie.domain === `.${params.domain}`
        );
      }

      if (params.name) {
        cookies = cookies.filter(cookie => cookie.name === params.name);
      }

      // Enhance cookie data with additional info
      const enhancedCookies = cookies.map(cookie => ({
        ...cookie,
        isSecure: cookie.secure || false,
        isHttpOnly: cookie.httpOnly || false,
        sameSite: cookie.sameSite || 'unspecified',
        isExpired: cookie.expires ? cookie.expires * 1000 < Date.now() : false,
        expiresDate: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : null,
        size: cookie.name.length + cookie.value.length
      }));

      const stats = {
        totalCookies: enhancedCookies.length,
        secureCount: enhancedCookies.filter(c => c.isSecure).length,
        httpOnlyCount: enhancedCookies.filter(c => c.isHttpOnly).length,
        expiredCount: enhancedCookies.filter(c => c.isExpired).length,
        totalSize: enhancedCookies.reduce((sum, c) => sum + c.size, 0)
      };

      return {
        success: true,
        data: {
          cookies: enhancedCookies,
          stats,
          url: page.url(),
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          filters: {
            domain: params.domain || null,
            name: params.name || null
          }
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
          code: 'COOKIES_ACCESS_FAILED',
          message: `Failed to access cookies: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const storageClearDataTool = {
  name: 'storage_clear_data',
  description: 'Clear browser storage data by type (localStorage, sessionStorage, cookies)',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      types: {
        type: 'array',
        description: 'Types of storage to clear',
        items: {
          type: 'string',
          enum: ['localStorage', 'sessionStorage', 'cookies', 'all']
        },
        default: ['all']
      },
      cookieDomain: {
        type: 'string',
        description: 'Specific domain for cookie clearing (optional)'
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      const types = params.types || ['all'];
      const results = {};

      // Clear localStorage
      if (types.includes('localStorage') || types.includes('all')) {
        const localStorageResult = await page.evaluate(() => {
          const count = localStorage.length;
          localStorage.clear();
          return { cleared: count };
        });
        results.localStorage = localStorageResult;
      }

      // Clear sessionStorage
      if (types.includes('sessionStorage') || types.includes('all')) {
        const sessionStorageResult = await page.evaluate(() => {
          const count = sessionStorage.length;
          sessionStorage.clear();
          return { cleared: count };
        });
        results.sessionStorage = sessionStorageResult;
      }

      // Clear cookies
      if (types.includes('cookies') || types.includes('all')) {
        const cookies = await context.cookies();
        const cookiesToClear = params.cookieDomain 
          ? cookies.filter(c => c.domain === params.cookieDomain || c.domain === `.${params.cookieDomain}`)
          : cookies;

        // Clear each cookie
        for (const cookie of cookiesToClear) {
          await context.clearCookies({
            name: cookie.name,
            domain: cookie.domain,
            path: cookie.path
          });
        }

        results.cookies = { cleared: cookiesToClear.length };
      }

      return {
        success: true,
        data: {
          results,
          types: types,
          url: page.url(),
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          typesCleared: types
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
          code: 'STORAGE_CLEAR_FAILED',
          message: `Failed to clear storage: ${error.message}`,
          details: {
            types: params.types,
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};