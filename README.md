# Playwright DevTools MCP Server 🎭

A specialized Model Context Protocol (MCP) server that provides AI models with comprehensive Chrome DevTools access through Playwright. Unlike existing MCP servers focused on basic browser automation, this enables autonomous debugging, performance analysis, and security inspection capabilities.

[![npm version](https://badge.fury.io/js/playwright-devtools-mcp.svg)](https://badge.fury.io/js/playwright-devtools-mcp)
[![Node.js CI](https://github.com/your-username/playwright-devtools-mcp/workflows/Node.js%20CI/badge.svg)](https://github.com/your-username/playwright-devtools-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What Makes This Different

**Existing Playwright MCP Servers**: Focus on DOM automation (clicking, typing, form filling)  
**Our DevTools MCP Server**: **Debugging-first approach** via Chrome DevTools Protocol

- 🐛 **Console log analysis** - Real-time error detection and debugging
- 🌐 **Network monitoring** - Request/response inspection and failure analysis  
- ⚡ **Performance metrics** - Core Web Vitals and resource timing
- 🔒 **Security analysis** - SSL certificates, headers, CSP violations *(coming soon)*
- 📊 **HAR export** - Complete debugging data export *(coming soon)*

## 📦 Installation

```bash
npm install -g playwright-devtools-mcp
```

Or for local development:
```bash
git clone https://github.com/your-username/playwright-devtools-mcp.git
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

### 2. Basic Usage

```javascript
// In Claude Desktop, you can now use:

// 1. Launch browser
const result = await browser_launch({
  headless: false,
  viewport: { width: 1280, height: 720 }
});

// 2. Navigate to a page
await browser_navigate({
  contextId: result.data.contextId,
  url: "https://example.com",
  waitFor: "load"
});

// 3. Analyze and close
await browser_close({
  contextId: result.data.contextId
});
```

## 🛠️ Available Tools

### Browser Management
- **`browser_launch`** - Create browser context with custom viewport/user agent
- **`browser_navigate`** - Navigate to URLs with configurable wait conditions
- **`browser_close`** - Clean up browser contexts and resources

### Console & DevTools ✅
- **`console_get_logs`** - Collect console messages and errors with filtering
- **`console_clear_logs`** - Clear stored console data to free memory
- **`console_evaluate_javascript`** - Execute JavaScript in browser console

### Network Analysis ✅
- **`network_get_requests`** - Monitor HTTP requests and responses with filtering
- **`network_get_failed_requests`** - Get failed requests (4xx, 5xx, connection errors)
- **`network_clear_requests`** - Clear stored network data to free memory

### Performance Monitoring ✅
- **`performance_get_metrics`** - Collect navigation timing and resource metrics
- **`performance_get_core_vitals`** - Measure Core Web Vitals (LCP, FID, CLS)

### Security Analysis *(Coming Soon)*
- **`security_analyze_headers`** - Inspect security configurations
- **`security_get_certificates`** - SSL/TLS certificate analysis

## 🔄 Development Status

**Current**: ✅ Full DevTools suite (v0.2.0)  
- ✅ Browser management
- ✅ Console log analysis
- ✅ Network request monitoring
- ✅ Performance metrics & Core Web Vitals

**Next**: 🚧 Security analysis tools (v0.3.0)  
**Future**: 📋 HAR export, advanced debugging features (v0.4.0)

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

## 🤝 Contributing

We welcome contributions! This is an open-source project focused on enabling AI-powered web debugging.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-devtools-tool`
3. Make your changes and add tests
4. Run `npm run check` to ensure quality
5. Submit a pull request

### Development Philosophy
- **Keep it simple** - Focus on core debugging use cases
- **AI-first design** - APIs should work well with AI model capabilities  
- **Clear documentation** - Every tool should have working examples

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