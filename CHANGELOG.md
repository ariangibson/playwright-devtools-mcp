# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-15

### 🚀 Major Features Added

#### Console & DevTools Suite
- **`console_get_logs`** - Real-time console log collection with filtering by type, time, and content
- **`console_clear_logs`** - Memory management for clearing stored console data
- **`console_evaluate_javascript`** - Safe JavaScript execution in browser context with result parsing

#### Network Analysis Suite  
- **`network_get_requests`** - Complete HTTP request/response monitoring with filtering capabilities
- **`network_get_failed_requests`** - Automated analysis of failed requests (4xx, 5xx, connection errors)
- **`network_clear_requests`** - Memory management for clearing stored network data

#### Performance Monitoring Suite
- **`performance_get_metrics`** - Navigation timing, resource timing, and memory usage collection
- **`performance_get_core_vitals`** - Core Web Vitals measurement (LCP, FID, CLS) using performance observers

### 🏗️ Architecture Enhancements

- **Smart Data Collectors**: Implemented `ConsoleCollector`, `NetworkCollector`, and `PerformanceCollector` classes
- **Automatic Event Binding**: Pages now automatically collect console logs and network requests
- **Memory Management**: Configurable limits and cleanup to prevent memory bloat
- **Enhanced Browser Manager**: Added data collector integration and CDP session management
- **Error Handling**: Comprehensive error responses with actionable details

### 🧪 Testing & Quality

- Added integration tests for DevTools functionality
- Verified console log collection works with real browser pages
- Enhanced error handling throughout the codebase
- Added proper cleanup and resource management

### 📚 Documentation Updates

- Updated README with complete tool documentation
- Enhanced examples with working DevTools code
- Updated development status to reflect new capabilities
- Added usage examples for all new tools

### 📊 Scale & Impact

- **Tools**: Expanded from 3 to 11 total tools
- **Lines of Code**: Added 1,292 lines of DevTools functionality
- **Capabilities**: Transformed from basic browser automation to comprehensive web debugging platform

## [0.1.0] - 2025-01-15

### Initial Release

#### Browser Management
- **`browser_launch`** - Create browser contexts with custom viewport/user agent
- **`browser_navigate`** - Navigate to URLs with configurable wait conditions  
- **`browser_close`** - Clean up browser contexts and resources

#### Core Infrastructure
- MCP server setup with stdio transport for Claude Desktop
- Browser manager with Playwright integration
- Basic configuration system with environment variable support
- Error handling and logging framework

#### Documentation & Setup
- Comprehensive README with installation and usage instructions
- MIT license for open source compatibility
- Example configurations for Claude Desktop
- Basic project structure and development guidelines

---

## Future Releases

### [0.3.0] - Planned
- Security analysis tools (SSL certificates, security headers, CSP violations)
- HAR file export functionality
- Enhanced error reporting and debugging tools

### [0.4.0] - Planned  
- Advanced debugging features
- Multi-tab session management
- Real-time collaboration capabilities