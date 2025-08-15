import { browserManager } from '../utils/browser-manager.js';

export const consoleGetLogsTool = {
  name: 'console_get_logs',
  description: 'Collect console logs and errors from the browser for debugging analysis',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      types: {
        type: 'array',
        description: 'Filter by log types',
        items: {
          type: 'string',
          enum: ['log', 'info', 'warn', 'error', 'debug', 'pageerror']
        },
        default: ['error', 'warn', 'pageerror']
      },
      since: {
        type: 'number',
        description: 'Only return logs after this timestamp (milliseconds)'
      },
      contains: {
        type: 'string',
        description: 'Filter logs containing this text (case insensitive)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of logs to return',
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
        types: params.types || ['error', 'warn', 'pageerror'],
        since: params.since,
        contains: params.contains,
        limit: params.limit || 50
      };

      const logs = collectors.console.getLogs(options);
      const stats = collectors.console.getStats();

      return {
        success: true,
        data: {
          logs,
          stats,
          totalCollected: stats.total,
          filtered: logs.length,
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
          code: 'CONSOLE_LOGS_FAILED',
          message: `Failed to get console logs: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const consoleClearLogsTool = {
  name: 'console_clear_logs',
  description: 'Clear stored console logs for a browser context to free memory',
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

      const statsBefore = collectors.console.getStats();
      collectors.console.clearLogs();
      const statsAfter = collectors.console.getStats();

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
          code: 'CONSOLE_CLEAR_FAILED',
          message: `Failed to clear console logs: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const consoleEvaluateJavaScriptTool = {
  name: 'console_evaluate_javascript',
  description: 'Execute JavaScript in the browser console and return the result',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      expression: {
        type: 'string',
        description: 'JavaScript expression to evaluate'
      },
      includeCommandLineAPI: {
        type: 'boolean',
        description: 'Include console command line API (like $0, $1, etc.)',
        default: false
      }
    },
    required: ['contextId', 'expression']
  },

  async handler(params) {
    try {
      // Get the first page in the context for evaluation
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      const startTime = Date.now();

      // Evaluate the JavaScript expression
      const result = await page.evaluate((expr) => {
        try {
          // Use eval to execute the expression
          const evalResult = eval(expr);
          
          // Handle different types of results
          if (typeof evalResult === 'function') {
            return { type: 'function', value: evalResult.toString() };
          } else if (typeof evalResult === 'object' && evalResult !== null) {
            try {
              return { type: 'object', value: JSON.stringify(evalResult, null, 2) };
            } catch (e) {
              return { type: 'object', value: '[Object (not serializable)]' };
            }
          } else {
            return { type: typeof evalResult, value: String(evalResult) };
          }
        } catch (error) {
          return { 
            type: 'error', 
            value: error.message,
            stack: error.stack 
          };
        }
      }, params.expression);

      const endTime = Date.now();

      return {
        success: true,
        data: {
          result: result.value,
          type: result.type,
          stack: result.stack,
          expression: params.expression,
          executionTime: endTime - startTime,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          duration: endTime - startTime,
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
          code: 'JAVASCRIPT_EVALUATION_FAILED',
          message: `Failed to evaluate JavaScript: ${error.message}`,
          details: {
            expression: params.expression,
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};