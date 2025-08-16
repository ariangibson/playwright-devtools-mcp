# Playwright DevTools MCP Server 🎭

A specialized Model Context Protocol (MCP) server that provides AI models with comprehensive Chrome DevTools access through Playwright. Unlike existing MCP servers focused on basic browser automation, this enables autonomous debugging, performance analysis, and security inspection capabilities.

[![npm version](https://badge.fury.io/js/playwright-devtools-mcp.svg)](https://badge.fury.io/js/playwright-devtools-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What Makes This Different

**Existing Playwright MCP Servers**: Focus on DOM automation (clicking, typing, form filling)  
**Our DevTools MCP Server**: **Debugging-first approach** via Chrome DevTools Protocol

- 🐛 **Console log analysis** - Real-time error detection and debugging
- 🌐 **Network monitoring** - Request/response inspection and failure analysis  
- ⚡ **Performance metrics** - Core Web Vitals and resource timing
- 💾 **Storage inspection** - localStorage, sessionStorage, cookies with clearing
- 🎨 **Visual debugging** - Screenshots, DOM analysis, element property inspection
- 🔒 **Security analysis** - SSL certificates, headers, CSP violations *(coming soon)*

## 📦 Installation

```bash
npm install -g playwright-devtools-mcp
```

Or for local development:
```bash
git clone https://github.com/agibson/playwright-devtools-mcp.git
cd playwright-devtools-mcp
npm install
```

## 🔧 Quick Start

### 1. Claude Desktop Setup

Add to your Claude Desktop configuration (`~/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "playwright-devtools": {
      "command": "npx",
      "args": ["playwright-devtools-mcp"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

### 2. Complete Debugging Example

```javascript
// In Claude Desktop, start a debugging session:

// 1. Launch browser context
const launch = await browser_launch({
  headless: false,
  viewport: { width: 1280, height: 720 }
});
const contextId = launch.data.contextId;

// 2. Navigate to problematic page
await browser_navigate({
  contextId,
  url: "https://example.com/problematic-page",
  waitFor: "load"
});

// 3. Analyze issues
const errors = await console_get_logs({
  contextId,
  types: ["error", "warn"],
  limit: 20
});

const failed = await network_get_failed_requests({
  contextId,
  limit: 10
});

const vitals = await performance_get_core_vitals({
  contextId,
  timeout: 5000
});

// 4. Visual debugging
const screenshot = await debug_take_screenshot({
  contextId,
  fullPage: true,
  format: "png"
});

const element = await debug_get_element_properties({
  contextId,
  selector: ".broken-component",
  includeComputedStyles: true,
  includeDimensions: true
});

// 5. Clean up
await browser_close({ contextId });
```

### 3. Alternative Claude Desktop Configurations

**For development (local project):**
```json
{
  "mcpServers": {
    "playwright-devtools": {
      "command": "node",
      "args": ["./src/index.js"],
      "cwd": "/path/to/playwright-devtools-mcp",
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "DEBUG": "playwright-devtools:*"
      }
    }
  }
}
```

**For production (npm package):**
```json
{
  "mcpServers": {
    "playwright-devtools": {
      "command": "npx",
      "args": ["playwright-devtools-mcp"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    }
  }
}
```

## 📋 Response Format

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
    "contextId": "context-id"
  },
  "error": null
}
```

**Error Response Example:**
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
    "message": "Failed to navigate: timeout exceeded",
    "details": {
      "url": "https://example.com",
      "timeout": 30000
    }
  }
}
```

## 🛠️ Available Tools

### Browser Management
- **`browser_launch`** - Create browser context with custom viewport/user agent
- **`browser_navigate`** - Navigate to URLs with configurable wait conditions
- **`browser_close`** - Clean up browser contexts and resources

### Browser Safety & Recovery ✅ *New in v0.2.1!*
- **`browser_navigate_safe`** - Navigation with automatic retry and context recovery
- **`browser_health_check`** - Context health validation and auto-healing  
- **`browser_force_recreate`** - Force recreation of problematic contexts

### Console & DevTools ✅
- **`console_get_logs`** - Collect console messages and errors with filtering
- **`console_clear_logs`** - Clear stored console data to free memory
- **`console_evaluate_javascript`** - Execute JavaScript in browser console and see results

### Network Analysis ✅
- **`network_get_requests`** - Monitor HTTP requests and responses with filtering
- **`network_get_failed_requests`** - Get failed requests (4xx, 5xx, connection errors)
- **`network_clear_requests`** - Clear stored network data to free memory

### Performance Monitoring ✅
- **`performance_get_metrics`** - Collect navigation timing and resource metrics
- **`performance_get_core_vitals`** - Measure Core Web Vitals (LCP, FID, CLS)

### Storage Inspection ✅ 
- **`storage_get_local_storage`** - Get localStorage data with size analysis
- **`storage_get_session_storage`** - Get sessionStorage data with filtering
- **`storage_get_cookies`** - Get cookies with security attributes and expiry info
- **`storage_clear_data`** - Selectively clear storage by type (localStorage, sessionStorage, cookies)

### Debug & Visual Tools ✅ *New in v0.3.0!*
- **`debug_take_screenshot`** - Screenshot capture (viewport OR full-page) with quality options
- **`debug_get_page_source`** - Current DOM state extraction with comprehensive statistics
- **`debug_get_element_properties`** - Deep element inspection (styles, attributes, computed values, dimensions, accessibility)
- **`debug_get_dom_tree`** - Structured DOM representation for analysis with depth control

### Security Analysis *(Coming Soon)*
- **`security_analyze_headers`** - Inspect security configurations
- **`security_get_certificates`** - SSL/TLS certificate analysis

## 🔄 Development Status

**Current**: ✅ Complete Visual Debugging Suite (v0.3.0)  
- ✅ Browser management with safety features and auto-recovery
- ✅ Console log analysis with JavaScript execution
- ✅ Network request monitoring and failure analysis
- ✅ Performance metrics & Core Web Vitals
- ✅ Complete storage inspection (localStorage, sessionStorage, cookies)
- ✅ **Visual debugging** - Screenshots, DOM analysis, element property inspection
- ✅ **Advanced element debugging** - Computed styles, dimensions, accessibility properties

**Next**: 🚧 Enhanced network analysis tools (slow requests, waterfalls, request interception)  
**Future**: 📋 Security analysis, HAR export, device simulation

## 🏗️ Architecture

```
src/
├── index.js          # MCP server entry point
├── server.js         # Tool registry and execution
├── tools/            # Individual MCP tools
│   └── browser.js    # Browser management tools
├── utils/            # Shared utilities
│   └── browser-manager.js  # Browser lifecycle management
└── config/           # Configuration system
    └── defaults.js   # Default settings
```

## ⚙️ Configuration

### Environment Variables
```bash
PLAYWRIGHT_BROWSER_TYPE=chromium    # chromium|firefox|webkit
PLAYWRIGHT_HEADLESS=true           # true|false
PLAYWRIGHT_TIMEOUT=30000           # milliseconds
MCP_MAX_CONCURRENT_PAGES=3         # resource limits
DEBUG=playwright-devtools:*        # debug logging
```

### Runtime Options
```javascript
browser_launch({
  headless: false,              // Override headless mode
  viewport: { width: 1920, height: 1080 },
  userAgent: "Custom User Agent"
});
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with debug logging
DEBUG=playwright-devtools:* npm start

# Development mode with auto-reload
npm run dev
```

## 🔐 Authentication & Security

**🛡️ Security-First Approach:**
- **No password storage** - This server does NOT store or manage authentication credentials
- **Session-based workflow** - Users log in manually, AI works with existing sessions
- **Cookie inspection** - AI can analyze and manage cookies from existing authenticated sessions
- **Human-in-the-loop** - Authentication requires human interaction for security

**💡 Recommended workflow:**
1. User manually logs into websites they want to debug
2. AI uses the MCP server to inspect the authenticated session
3. AI can analyze storage, cookies, and debug authenticated pages
4. No credentials are stored or transmitted through the MCP server

## 🤝 Contributing

We welcome contributions! This is a **weekend MVP project** designed for community growth.

**🚀 Quick Contribution Guide:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-devtools-tool`
3. Follow the existing tool patterns in `src/tools/`
4. Add your tool to `src/server.js` tool registry
5. Test it works and submit a pull request

**📐 Architecture is Extension-Ready:**
- **Modular design** - Each tool is a self-contained module
- **Consistent APIs** - Follow existing patterns for easy maintenance
- **Simple registration** - Just import and add to the TOOLS array
- **Clear examples** - Every tool has comprehensive examples

### Development Philosophy
- **Keep it simple** - Focus on core debugging use cases, avoid over-engineering
- **AI-first design** - APIs should work well with AI model capabilities  
- **Weekend MVP mindset** - Clean, functional, extensible - not enterprise-hardened

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Microsoft's Playwright MCP](https://github.com/microsoft/playwright-mcp) - General browser automation
- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Official MCP server collection
- [Playwright](https://playwright.dev/) - Browser automation framework

## ⭐ Support

If this project helps you debug web applications with AI, please consider:
- ⭐ Starring the repository
- 🐛 Reporting issues and bugs
- 💡 Suggesting new DevTools capabilities
- 🤝 Contributing code or documentation

---

**Built for the AI-powered debugging future** 🤖✨