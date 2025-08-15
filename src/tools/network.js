import { browserManager } from '../utils/browser-manager.js';

export const networkGetRequestsTool = {
  name: 'network_get_requests',
  description: 'Get HTTP network requests and responses for debugging and analysis',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      status: {
        oneOf: [
          {
            type: 'string',
            enum: ['failed'],
            description: 'Filter for failed requests'
          },
          {
            type: 'number',
            description: 'Filter by HTTP status code (e.g., 404, 500)'
          }
        ]
      },
      resourceType: {
        type: 'string',
        description: 'Filter by resource type',
        enum: ['document', 'stylesheet', 'image', 'media', 'font', 'script', 'texttrack', 'xhr', 'fetch', 'websocket', 'manifest', 'other']
      },
      urlContains: {
        type: 'string',
        description: 'Filter URLs containing this text (case insensitive)'
      },
      since: {
        type: 'number',
        description: 'Only return requests after this timestamp (milliseconds)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of requests to return',
        default: 50
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const collectors = browserManager.getCollectors(params.contextId);
      if (!collectors) {
        throw new Error(`Browser context not found: ${params.contextId}`);
      }

      const options = {
        status: params.status,
        resourceType: params.resourceType,
        urlContains: params.urlContains,
        since: params.since,
        limit: params.limit || 50
      };

      const requests = collectors.network.getRequests(options);
      const stats = collectors.network.getStats();

      return {
        success: true,
        data: {
          requests,
          stats,
          totalCollected: stats.total,
          filtered: requests.length,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          filters: options
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
          code: 'NETWORK_REQUESTS_FAILED',
          message: `Failed to get network requests: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const networkGetFailedRequestsTool = {
  name: 'network_get_failed_requests',
  description: 'Get failed HTTP requests (4xx, 5xx, or connection failures) for debugging',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      since: {
        type: 'number',
        description: 'Only return requests after this timestamp (milliseconds)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of failed requests to return',
        default: 25
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const collectors = browserManager.getCollectors(params.contextId);
      if (!collectors) {
        throw new Error(`Browser context not found: ${params.contextId}`);
      }

      const options = {
        status: 'failed',
        since: params.since,
        limit: params.limit || 25
      };

      const failedRequests = collectors.network.getRequests(options);
      const stats = collectors.network.getStats();

      // Categorize failures
      const failures = {
        networkErrors: [],
        clientErrors: [], // 4xx
        serverErrors: []  // 5xx
      };

      failedRequests.forEach(req => {
        if (req.failed && !req.response) {
          failures.networkErrors.push(req);
        } else if (req.response) {
          if (req.response.status >= 400 && req.response.status < 500) {
            failures.clientErrors.push(req);
          } else if (req.response.status >= 500) {
            failures.serverErrors.push(req);
          }
        }
      });

      return {
        success: true,
        data: {
          failures,
          summary: {
            totalFailed: failedRequests.length,
            networkErrors: failures.networkErrors.length,
            clientErrors: failures.clientErrors.length,
            serverErrors: failures.serverErrors.length
          },
          stats,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          filters: options
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
          code: 'FAILED_REQUESTS_ANALYSIS_FAILED',
          message: `Failed to analyze failed requests: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const networkClearRequestsTool = {
  name: 'network_clear_requests',
  description: 'Clear stored network request data for a browser context to free memory',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const collectors = browserManager.getCollectors(params.contextId);
      if (!collectors) {
        throw new Error(`Browser context not found: ${params.contextId}`);
      }

      const statsBefore = collectors.network.getStats();
      collectors.network.clearRequests();
      const statsAfter = collectors.network.getStats();

      return {
        success: true,
        data: {
          cleared: statsBefore.total,
          remaining: statsAfter.total,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
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
          code: 'NETWORK_CLEAR_FAILED',
          message: `Failed to clear network requests: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};