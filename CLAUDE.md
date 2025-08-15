# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a specialized Model Context Protocol (MCP) server that provides AI models with comprehensive Chrome DevTools access through Playwright. Unlike existing MCP servers focused on basic browser automation, this project enables autonomous debugging, performance analysis, and security inspection capabilities through the Chrome DevTools Protocol.

## Market Context

**Existing Solutions**: Microsoft's official Playwright MCP and community implementations focus on general browser automation (clicking, form filling, DOM manipulation).

**Our Differentiation**: DevTools-first approach providing AI models with debugging capabilities typically requiring manual developer intervention - console log analysis, network request inspection, performance metrics, and security auditing.

## Architecture

This is a specification-driven project currently in the planning phase. The complete build specification is documented in `spec.md` which outlines:

- **Core Technology Stack**: Node.js 18+ with ES modules, Playwright browser automation, @modelcontextprotocol/sdk
- **Transport Methods**: Primary stdio transport (Claude Desktop), secondary HTTP/SSE transport
- **Project Structure**: Modular design with separate tools for browser, devtools, network, security, storage, and debug functionality

## Key Components (Planned)

### Tool Categories
- **Browser Management**: Multi-browser support (Chromium, Firefox, WebKit) with session management
- **DevTools Core**: Console logs, network activity, performance metrics, CDP command execution
- **Network Analysis**: Failed request detection, latency analysis, request interception, HAR export
- **Security Analysis**: Certificate inspection, CSP violation detection, security header analysis
- **Storage Inspection**: localStorage, sessionStorage, cookies, IndexedDB access
- **Performance Monitoring**: Core Web Vitals, resource timing, memory analysis
- **Debug Utilities**: DOM inspection, screenshots, element properties, device simulation

### Data Models
The specification defines standardized models for:
- Network requests with timing data and response details
- Console logs with location and stack trace information
- Performance metrics including Core Web Vitals and memory usage

## Development Commands

**Note**: This project is in specification phase. No package.json or build scripts exist yet.

Planned development workflow based on spec.md:
- `npm start` - Launch MCP server with stdio transport
- `npm test` - Run integration tests
- `npm run build` - Build for distribution
- `node src/index.js --config path/to/config.json` - Launch with custom config

## Configuration System

The project will support comprehensive configuration via JSON files with sections for:
- Browser settings (engine, headless mode, launch options)
- Network policies (allowed/blocked origins, HAR recording)
- Performance monitoring (metrics collection, tracing)
- Storage management (session persistence, cookie policy)
- Debug options (screenshot on error, verbose logging)

## MCP Integration

Designed for compatibility with:
- Claude Desktop (primary target)
- VS Code extensions
- Cursor IDE
- Any MCP-compatible client

## Implementation Priority

Per spec.md implementation notes:
1. Core browser tools first
2. DevTools access as foundation
3. Network analysis incrementally
4. Security and performance tools last
5. Comprehensive testing throughout
6. Documentation-driven development

## Security Considerations

- Browser process sandboxing by default
- URL allowlist/blocklist support
- Safe JavaScript evaluation boundaries
- Credential isolation between sessions
- No malicious code creation - defensive security focus only