import { browserManager } from '../utils/browser-manager.js';

export const performanceGetMetricsTool = {
  name: 'performance_get_metrics',
  description: 'Collect Core Web Vitals and performance metrics from the current page',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      includeResourceTiming: {
        type: 'boolean',
        description: 'Include detailed resource timing data',
        default: false
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
      const collectors = browserManager.getCollectors(params.contextId);

      // Get Core Web Vitals and performance metrics
      const performanceData = await page.evaluate((includeResourceTiming) => {
        const performance = window.performance;
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        // Core Web Vitals (approximated from available data)
        const metrics = {
          // Navigation timing
          navigation: {
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : null,
            loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : null,
            firstByte: navigation ? navigation.responseStart - navigation.fetchStart : null,
            domInteractive: navigation ? navigation.domInteractive - navigation.fetchStart : null
          },
          
          // Paint timing
          paint: {
            firstPaint: null,
            firstContentfulPaint: null
          },
          
          // Memory (if available)
          memory: window.performance.memory ? {
            usedJSHeapSize: window.performance.memory.usedJSHeapSize,
            totalJSHeapSize: window.performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
          } : null,
          
          // Core Web Vitals (basic approximation)
          coreVitals: {
            lcp: null, // Would need observer
            fid: null, // Would need observer  
            cls: null  // Would need observer
          }
        };

        // Extract paint timing
        paint.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.paint.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.paint.firstContentfulPaint = entry.startTime;
          }
        });

        // Resource timing (if requested)
        if (includeResourceTiming) {
          metrics.resources = performance.getEntriesByType('resource').map(entry => ({
            name: entry.name,
            type: entry.initiatorType,
            startTime: entry.startTime,
            duration: entry.duration,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize
          }));
        }

        return metrics;
      }, params.includeResourceTiming || false);

      // Store metrics in collector
      collectors.performance.addMetrics(performanceData);

      return {
        success: true,
        data: {
          metrics: performanceData,
          url: page.url(),
          title: await page.title(),
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          includeResourceTiming: params.includeResourceTiming || false
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
          code: 'PERFORMANCE_METRICS_FAILED',
          message: `Failed to get performance metrics: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const performanceGetCoreVitalsTool = {
  name: 'performance_get_core_vitals',
  description: 'Measure Core Web Vitals (LCP, FID, CLS) using browser performance observers',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      timeout: {
        type: 'number',
        description: 'How long to wait for measurements (milliseconds)',
        default: 10000
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
      const timeout = params.timeout || 10000;

      // Set up Core Web Vitals measurement
      const coreVitals = await page.evaluate((measurementTimeout) => {
        return new Promise((resolve) => {
          const vitals = {
            lcp: null,
            fid: null,
            cls: null,
            measurements: []
          };

          const observers = [];
          

          // LCP Observer
          if ('PerformanceObserver' in window) {
            try {
              const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length > 0) {
                  const lastEntry = entries[entries.length - 1];
                  vitals.lcp = lastEntry.startTime;
                  vitals.measurements.push({
                    type: 'lcp',
                    value: lastEntry.startTime,
                    timestamp: Date.now()
                  });
                }
              });
              lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
              observers.push(lcpObserver);
            } catch (e) {
              console.warn('LCP observer not supported:', e);
            }

            // FID Observer  
            try {
              const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length > 0) {
                  const firstEntry = entries[0];
                  vitals.fid = firstEntry.processingStart - firstEntry.startTime;
                  vitals.measurements.push({
                    type: 'fid',
                    value: vitals.fid,
                    timestamp: Date.now()
                  });
                }
              });
              fidObserver.observe({ entryTypes: ['first-input'] });
              observers.push(fidObserver);
            } catch (e) {
              console.warn('FID observer not supported:', e);
            }

            // CLS Observer
            try {
              let clsValue = 0;
              const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                  }
                }
                vitals.cls = clsValue;
                vitals.measurements.push({
                  type: 'cls',
                  value: clsValue,
                  timestamp: Date.now()
                });
              });
              clsObserver.observe({ entryTypes: ['layout-shift'] });
              observers.push(clsObserver);
            } catch (e) {
              console.warn('CLS observer not supported:', e);
            }
          }

          // Wait for measurements or timeout
          setTimeout(() => {
            observers.forEach(observer => {
              try {
                observer.disconnect();
              } catch (e) {
                console.warn('Error disconnecting observer:', e);
              }
            });
            resolve(vitals);
          }, measurementTimeout);
        });
      }, timeout);

      return {
        success: true,
        data: {
          coreVitals,
          url: page.url(),
          title: await page.title(),
          measurementTime: timeout,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          timeout
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
          code: 'CORE_VITALS_MEASUREMENT_FAILED',
          message: `Failed to measure Core Web Vitals: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};