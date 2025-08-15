# Basic Usage Examples

## Claude Desktop Configuration

Add this to your `~/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "playwright-devtools": {
      "command": "npx",
      "args": ["playwright-devtools-mcp"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true",
        "DEBUG": "playwright-devtools:*"
      }
    }
  }
}
```

## Example Debugging Session

### 1. Launch Browser and Navigate

```javascript
// Launch a browser context
const launchResult = await browser_launch({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

console.log("Browser launched:", launchResult.data.contextId);

// Navigate to the problematic page
const navResult = await browser_navigate({
  contextId: launchResult.data.contextId,
  url: "https://example.com/problematic-page",
  waitFor: "load",
  timeout: 30000
});

console.log("Page loaded:", navResult.data.title);
```

### 2. Analyze the Page ✅

```javascript
// Get console logs to identify errors
const consoleResult = await console_get_logs({
  contextId: launchResult.data.contextId,
  types: ["error", "warn", "pageerror"],
  since: Date.now() - 60000, // Last minute
  limit: 50
});

console.log("Console errors found:", consoleResult.data.logs.length);

// Monitor network requests and failures
const networkResult = await network_get_failed_requests({
  contextId: launchResult.data.contextId,
  limit: 25
});

console.log("Failed requests:", networkResult.data.summary);

// Get performance metrics
const perfResult = await performance_get_metrics({
  contextId: launchResult.data.contextId,
  includeResourceTiming: true
});

console.log("Page load time:", perfResult.data.metrics.navigation.loadComplete);

// Measure Core Web Vitals
const vitalsResult = await performance_get_core_vitals({
  contextId: launchResult.data.contextId,
  timeout: 10000
});

console.log("Core Web Vitals:", vitalsResult.data.coreVitals);
```

### 3. Clean Up

```javascript
// Always clean up browser contexts
await browser_close({
  contextId: launchResult.data.contextId
});
```

## Environment Configuration

### Development Mode
```bash
export PLAYWRIGHT_HEADLESS=false
export DEBUG=playwright-devtools:*
export MCP_MAX_CONCURRENT_PAGES=1
npm run dev
```

### Production Mode
```bash
export PLAYWRIGHT_HEADLESS=true
export NODE_ENV=production
npm start
```

## Tool Response Format

All tools return a consistent response format:

```javascript
{
  "success": true,
  "data": {
    // Tool-specific data
  },
  "metadata": {
    "timestamp": 1234567890,
    "duration": 1500,
    "browserContext": "context-id"
  },
  "error": null
}
```

### Error Response Example

```javascript
{
  "success": false,
  "data": null,
  "metadata": {
    "timestamp": 1234567890,
    "contextId": "context-123"
  },
  "error": {
    "code": "NAVIGATION_FAILED",
    "message": "Failed to navigate to https://example.com: timeout exceeded",
    "details": {
      "url": "https://example.com",
      "timeout": 30000
    }
  }
}
```