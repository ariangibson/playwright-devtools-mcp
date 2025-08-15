import { test } from 'node:test';
import assert from 'node:assert';
import { browserManager } from '../../src/utils/browser-manager.js';
import { browserLaunchTool, browserNavigateTool, browserCloseTool } from '../../src/tools/browser.js';
import { browserNavigateSafeTool, browserHealthCheckTool, browserForceRecreateTool } from '../../src/tools/browser-safe.js';

test('Browser safety and recovery features', async (t) => {
  let contextId = null;

  try {
    // Test browser launch
    await t.test('browser launch for safety tests', async () => {
      const result = await browserLaunchTool.handler({
        headless: true,
        viewport: { width: 1280, height: 720 }
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(result.data.contextId);
      contextId = result.data.contextId;
    });

    // Test health check on healthy context
    await t.test('health check on healthy context', async () => {
      const result = await browserHealthCheckTool.handler({
        contextId,
        autoHeal: true
      });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.health.isHealthy, true);
      console.log('Health check result:', result.data.recommendation);
    });

    // Test safe navigation to a valid URL
    await t.test('safe navigation success', async () => {
      const result = await browserNavigateSafeTool.handler({
        contextId,
        url: 'data:text/html,<h1>Test Page</h1>',
        waitFor: 'domcontentloaded',
        maxAttempts: 3
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(result.data.url);
      assert.ok(result.data.title || result.data.title === '');
      console.log('Safe navigation successful, attempts:', result.data.attempts);
    });

    // Test navigation attempt tracking
    await t.test('navigation attempt tracking', async () => {
      const attempts = browserManager.navigationGuard.getAttempts(contextId);
      console.log('Current navigation attempts for context:', attempts);
      assert.ok(typeof attempts === 'number');
    });

    // Test force recreate context
    await t.test('force recreate context', async () => {
      const result = await browserForceRecreateTool.handler({
        contextId,
        preserveViewport: true
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(result.data.newContextId);
      assert.notStrictEqual(result.data.newContextId, contextId);
      
      console.log('Context recreated:', result.data.oldContextId, '->', result.data.newContextId);
      
      // Update contextId for cleanup
      contextId = result.data.newContextId;
    });

    // Test health check on recreated context
    await t.test('health check after recreation', async () => {
      const result = await browserHealthCheckTool.handler({
        contextId,
        autoHeal: false
      });
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.data.health.isHealthy, true);
      console.log('Health after recreation:', result.data.recommendation);
    });

  } finally {
    // Clean up
    if (contextId) {
      await browserCloseTool.handler({ contextId });
    }
    await browserManager.cleanup();
  }
});

test('Navigation failure detection', async (t) => {
  let contextId = null;

  try {
    // Launch browser
    const launchResult = await browserLaunchTool.handler({ headless: true });
    contextId = launchResult.data.contextId;

    // Simulate navigation to invalid URL to test failure tracking
    await t.test('invalid URL navigation tracking', async () => {
      const result = await browserNavigateTool.handler({
        contextId,
        url: 'http://invalid-url-that-should-fail.test',
        timeout: 5000
      });
      
      // Should fail and track attempt
      assert.strictEqual(result.success, false);
      assert.ok(result.metadata.attempts);
      console.log('Failed navigation tracked, attempts:', result.metadata.attempts);
    });

    // Test that repeated failures trigger safety mode
    await t.test('repeated failure safety mode', async () => {
      // Try one more time to trigger safety mode
      const result = await browserNavigateTool.handler({
        contextId,
        url: 'http://another-invalid-url.test',
        timeout: 5000
      });
      
      // Should now suggest using safe navigation
      assert.strictEqual(result.success, false);
      if (result.error.code === 'CONTEXT_UNSTABLE') {
        console.log('Safety mode triggered correctly:', result.error.message);
        assert.ok(result.error.details.suggestion.includes('browser_navigate_safe'));
      }
    });

  } finally {
    if (contextId) {
      await browserCloseTool.handler({ contextId });
    }
    await browserManager.cleanup();
  }
});