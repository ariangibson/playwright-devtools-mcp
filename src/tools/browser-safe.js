import { browserManager } from '../utils/browser-manager.js';

export const browserNavigateSafeTool = {
  name: 'browser_navigate_safe',
  description: 'Navigate to a URL with automatic health checking, retry logic, and context recovery',
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
        default: 'domcontentloaded'
      },
      timeout: {
        type: 'number',
        description: 'Navigation timeout in milliseconds',
        default: 30000
      },
      maxAttempts: {
        type: 'number',
        description: 'Maximum navigation attempts before giving up',
        default: 3
      },
      autoRecreate: {
        type: 'boolean',
        description: 'Automatically recreate context if navigation fails repeatedly',
        default: true
      }
    },
    required: ['contextId', 'url']
  },

  async handler(params) {
    const startTime = Date.now();
    
    try {
      const options = {
        waitFor: params.waitFor || 'domcontentloaded',
        timeout: params.timeout || 30000,
        maxAttempts: params.maxAttempts || 3,
        forceRecreateThreshold: params.autoRecreate ? 2 : 999
      };

      const result = await browserManager.navigationGuard.safeNavigate(
        params.contextId, 
        params.url, 
        options
      );

      const endTime = Date.now();

      if (result.success) {
        return {
          success: true,
          data: {
            url: result.url,
            title: result.title,
            contextId: result.useNewContextId || params.contextId,
            loadTime: endTime - startTime,
            attempts: result.attempts,
            action: result.action,
            contextRecreated: !!result.useNewContextId
          },
          metadata: {
            timestamp: Date.now(),
            duration: endTime - startTime,
            originalContextId: params.contextId,
            finalContextId: result.useNewContextId || params.contextId,
            navigationGuardActive: true
          },
          error: null
        };
      } else {
        // Navigation failed
        return {
          success: false,
          data: {
            attempts: result.attempts,
            maxAttempts: result.maxAttempts,
            action: result.action,
            suggestion: result.suggestion,
            contextId: params.contextId
          },
          metadata: {
            timestamp: Date.now(),
            duration: endTime - startTime,
            contextId: params.contextId,
            failureReason: result.action
          },
          error: {
            code: 'SAFE_NAVIGATION_FAILED',
            message: `Navigation failed after ${result.attempts} attempts: ${result.error || 'Unknown error'}`,
            details: {
              url: params.url,
              attempts: result.attempts,
              action: result.action,
              suggestion: result.suggestion,
              originalError: result.error
            }
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
        },
        error: {
          code: 'NAVIGATION_GUARD_ERROR',
          message: `Navigation guard failed: ${error.message}`,
          details: {
            url: params.url,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const browserHealthCheckTool = {
  name: 'browser_health_check',
  description: 'Check browser context health and attempt automatic healing if issues detected',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID to check'
      },
      autoHeal: {
        type: 'boolean',
        description: 'Automatically attempt to heal unhealthy contexts',
        default: true
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const health = await browserManager.healthChecker.checkContextHealth(params.contextId);
      
      let healResult = null;
      if (!health.isHealthy && params.autoHeal !== false) {
        healResult = await browserManager.healthChecker.autoHealContext(params.contextId);
      }

      return {
        success: true,
        data: {
          health,
          healResult,
          recommendation: health.isHealthy 
            ? 'Context is healthy and ready for use'
            : healResult?.healed 
              ? 'Context was unhealthy but has been healed'
              : 'Context is unhealthy and could not be auto-healed. Consider recreating.',
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          autoHealAttempted: !!healResult
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
          code: 'HEALTH_CHECK_FAILED',
          message: `Health check failed: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const browserForceRecreateTool = {
  name: 'browser_force_recreate',
  description: 'Force recreate a browser context when it becomes unresponsive or problematic',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID to recreate'
      },
      preserveViewport: {
        type: 'boolean',
        description: 'Preserve viewport settings from original context',
        default: true
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const result = await browserManager.healthChecker.forceRecreateContext(params.contextId);
      
      if (result.success) {
        return {
          success: true,
          data: {
            oldContextId: result.oldContextId,
            newContextId: result.newContextId,
            message: result.message,
            recommendation: `Use new context ID ${result.newContextId} for future operations`
          },
          metadata: {
            timestamp: Date.now(),
            originalContextId: params.contextId,
            newContextId: result.newContextId
          },
          error: null
        };
      } else {
        return {
          success: false,
          data: {
            oldContextId: result.oldContextId,
            message: result.message
          },
          metadata: {
            timestamp: Date.now(),
            contextId: params.contextId
          },
          error: {
            code: 'CONTEXT_RECREATION_FAILED',
            message: result.message,
            details: {
              originalContextId: params.contextId
            }
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
        },
        error: {
          code: 'FORCE_RECREATE_ERROR',
          message: `Force recreate failed: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};