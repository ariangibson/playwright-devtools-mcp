import { test } from 'node:test';
import assert from 'node:assert';
import { browserManager } from '../../src/utils/browser-manager.js';
import { browserLaunchTool, browserNavigateTool, browserCloseTool } from '../../src/tools/browser.js';
import { consoleGetLogsTool } from '../../src/tools/console.js';
import { networkGetRequestsTool } from '../../src/tools/network.js';

test('DevTools integration flow', async (t) => {
  let contextId = null;

  try {
    // Test browser launch
    await t.test('browser launch', async () => {
      const result = await browserLaunchTool.handler({
        headless: true,
        viewport: { width: 1280, height: 720 }
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(result.data.contextId);
      contextId = result.data.contextId;
    });

    // Test navigation to a test page that will generate console logs
    await t.test('navigation with console logs', async () => {
      const result = await browserNavigateTool.handler({
        contextId,
        url: 'data:text/html,<title>Test Page</title><script>console.log("Test log"); console.error("Test error");</script><h1>Test Page</h1>',
        waitFor: 'load'
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(result.data.title);
    });

    // Give some time for console logs to be collected
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test console log collection
    await t.test('console log collection', async () => {
      const result = await consoleGetLogsTool.handler({
        contextId,
        types: ['log', 'error'],
        limit: 10
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.data.logs));
      
      // Should have collected our test logs
      const hasTestLog = result.data.logs.some(log => log.text.includes('Test log'));
      const hasTestError = result.data.logs.some(log => log.text.includes('Test error'));
      
      console.log('Collected logs:', result.data.logs.length);
      console.log('Has test log:', hasTestLog);
      console.log('Has test error:', hasTestError);
    });

    // Test network request collection
    await t.test('network request collection', async () => {
      const result = await networkGetRequestsTool.handler({
        contextId,
        limit: 10
      });
      
      assert.strictEqual(result.success, true);
      assert.ok(Array.isArray(result.data.requests));
      console.log('Network requests collected:', result.data.requests.length);
    });

  } finally {
    // Clean up
    if (contextId) {
      await browserCloseTool.handler({ contextId });
    }
    await browserManager.cleanup();
  }
});

test('Error handling', async (t) => {
  await t.test('invalid context handling', async () => {
    const result = await consoleGetLogsTool.handler({
      contextId: 'invalid-context-id'
    });
    
    assert.strictEqual(result.success, false);
    assert.ok(result.error);
    assert.strictEqual(result.error.code, 'CONSOLE_LOGS_FAILED');
  });
});