export class BrowserHealthChecker {
  constructor(browserManager) {
    this.browserManager = browserManager;
    this.healthChecks = new Map(); // contextId -> health data
  }

  async checkContextHealth(contextId) {
    try {
      const { context } = await this.browserManager.getContext(contextId);
      const pages = context.pages();
      
      const health = {
        contextId,
        timestamp: Date.now(),
        isHealthy: true,
        issues: [],
        pages: pages.length,
        activePages: 0,
        zombiePages: 0
      };

      // Check each page
      for (const page of pages) {
        try {
          // Test if page is responsive
          const isConnected = !page.isClosed();
          if (!isConnected) {
            health.zombiePages++;
            health.issues.push('Closed page found');
            continue;
          }

          // Quick responsiveness test
          await Promise.race([
            page.evaluate(() => document.readyState),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          
          health.activePages++;
        } catch (error) {
          health.zombiePages++;
          health.issues.push(`Page unresponsive: ${error.message}`);
        }
      }

      // Determine overall health
      if (health.zombiePages > 0 || health.activePages === 0) {
        health.isHealthy = false;
        health.issues.push('Context has unresponsive or no active pages');
      }

      this.healthChecks.set(contextId, health);
      return health;
    } catch (error) {
      const health = {
        contextId,
        timestamp: Date.now(),
        isHealthy: false,
        issues: [`Context check failed: ${error.message}`],
        pages: 0,
        activePages: 0,
        zombiePages: 0
      };
      
      this.healthChecks.set(contextId, health);
      return health;
    }
  }

  async autoHealContext(contextId) {
    const health = await this.checkContextHealth(contextId);
    
    if (health.isHealthy) {
      return { healed: false, reason: 'Context is healthy' };
    }

    try {
      // Strategy 1: Close zombie pages
      const { context } = await this.browserManager.getContext(contextId);
      const pages = context.pages();
      
      let closedPages = 0;
      for (const page of pages) {
        try {
          if (page.isClosed()) continue;
          
          // Test if page is responsive
          await Promise.race([
            page.evaluate(() => true),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
          ]);
        } catch (error) {
          // Page is unresponsive, close it
          try {
            await page.close();
            closedPages++;
          } catch (closeError) {
            // Ignore close errors
          }
        }
      }

      if (closedPages > 0) {
        const newHealth = await this.checkContextHealth(contextId);
        return { 
          healed: newHealth.isHealthy, 
          reason: `Closed ${closedPages} unresponsive pages`,
          health: newHealth
        };
      }

      return { healed: false, reason: 'Could not heal context automatically' };
    } catch (error) {
      return { healed: false, reason: `Heal attempt failed: ${error.message}` };
    }
  }

  async forceRecreateContext(contextId) {
    try {
      // Get the original context settings if possible
      const collectors = this.browserManager.getCollectors(contextId);
      
      // Close the problematic context
      await this.browserManager.closeContext(contextId);
      
      // Create a fresh context with same ID (or new ID)
      const newContextId = await this.browserManager.createContext({
        viewport: { width: 1280, height: 720 }
      });

      return {
        success: true,
        oldContextId: contextId,
        newContextId,
        message: 'Context forcefully recreated'
      };
    } catch (error) {
      return {
        success: false,
        oldContextId: contextId,
        newContextId: null,
        message: `Failed to recreate context: ${error.message}`
      };
    }
  }

  getHealthHistory(contextId) {
    return this.healthChecks.get(contextId) || null;
  }

  clearHealthData(contextId) {
    this.healthChecks.delete(contextId);
  }
}

export class NavigationGuard {
  constructor(browserManager, healthChecker) {
    this.browserManager = browserManager;
    this.healthChecker = healthChecker;
    this.navigationAttempts = new Map(); // contextId -> attempt count
  }

  async safeNavigate(contextId, url, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const forceRecreateThreshold = options.forceRecreateThreshold || 2;
    
    // Track attempts for this context
    const attempts = this.navigationAttempts.get(contextId) || 0;
    this.navigationAttempts.set(contextId, attempts + 1);

    // Check if we should force recreate context
    if (attempts >= forceRecreateThreshold) {
      console.error(`🔧 Context ${contextId} has ${attempts} failed attempts, forcing recreation...`);
      
      const recreation = await this.healthChecker.forceRecreateContext(contextId);
      if (recreation.success) {
        // Reset attempt counter for new context
        this.navigationAttempts.delete(contextId);
        this.navigationAttempts.set(recreation.newContextId, 0);
        
        return {
          ...recreation,
          action: 'context_recreated',
          useNewContextId: recreation.newContextId
        };
      }
    }

    // Check context health before navigation
    const health = await this.healthChecker.checkContextHealth(contextId);
    if (!health.isHealthy) {
      console.error(`🔧 Unhealthy context detected, attempting auto-heal...`);
      
      const healResult = await this.healthChecker.autoHealContext(contextId);
      if (!healResult.healed) {
        return {
          success: false,
          action: 'health_check_failed',
          health,
          healResult,
          suggestion: 'Consider recreating browser context'
        };
      }
    }

    try {
      // Attempt navigation with extra safety
      const page = await this.browserManager.createPage(contextId);
      
      // Add extra navigation safety
      const navigationPromise = page.goto(url, {
        waitUntil: options.waitFor || 'domcontentloaded',
        timeout: options.timeout || 30000
      });

      // Race navigation against a health check
      const result = await Promise.race([
        navigationPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Navigation timeout with health check')), 
          (options.timeout || 30000) + 5000)
        )
      ]);

      // Verify page is actually responsive after navigation
      await page.evaluate(() => document.readyState);
      
      // Reset attempt counter on success
      this.navigationAttempts.set(contextId, 0);
      
      return {
        success: true,
        action: 'navigation_success',
        url: page.url(),
        title: await page.title(),
        contextId,
        attempts: attempts + 1
      };

    } catch (error) {
      console.error(`❌ Navigation attempt ${attempts + 1} failed:`, error.message);
      
      if (attempts + 1 >= maxAttempts) {
        return {
          success: false,
          action: 'max_attempts_reached',
          attempts: attempts + 1,
          maxAttempts,
          error: error.message,
          suggestion: 'Browser context needs to be recreated'
        };
      }

      return {
        success: false,
        action: 'navigation_failed',
        attempts: attempts + 1,
        maxAttempts,
        error: error.message,
        willRetry: attempts + 1 < maxAttempts
      };
    }
  }

  resetAttempts(contextId) {
    this.navigationAttempts.delete(contextId);
  }

  getAttempts(contextId) {
    return this.navigationAttempts.get(contextId) || 0;
  }
}