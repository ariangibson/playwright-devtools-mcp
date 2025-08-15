# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-01-15

### 🚀 Major Features Added

#### Storage Inspection Suite
- **`storage_get_local_storage`** - localStorage key/value inspection with size statistics and filtering
- **`storage_get_session_storage`** - sessionStorage data analysis with comprehensive filtering
- **`storage_get_cookies`** - Cookie analysis with security attributes, expiry dates, and domain filtering
- **`storage_clear_data`** - Selective data clearing by storage type (localStorage, sessionStorage, cookies)

#### Browser Safety & Recovery System  
- **`browser_navigate_safe`** - Navigation with automatic retry logic and context recovery
- **`browser_health_check`** - Context health validation with automatic healing of zombie pages
- **`browser_force_recreate`** - Force recreation of problematic browser contexts
- **Navigation attempt tracking** - Prevents infinite retry loops and provides clear error guidance

### 🏗️ Architecture Enhancements

- **BrowserHealthChecker class**: Context monitoring and automatic healing capabilities
- **NavigationGuard class**: Safe navigation with retry logic and context recovery
- **Enhanced error handling**: Actionable error messages with recovery suggestions
- **Memory management**: Automatic cleanup of stale contexts and zombie pages
- **Safety integration**: All navigation tools now include health checking

### 🧪 Testing & Quality

- Added comprehensive safety feature tests
- Integration tests for storage inspection tools
- Enhanced error handling verification
- Memory management validation

### 📚 Documentation Updates

- Updated README with new storage and safety tools
- Enhanced feature tracker with updated priorities
- Added storage inspection examples
- Documented browser recovery workflows

### 📊 Progress Impact

- **Total Tools**: 18 (up from 14)
- **Storage Inspection**: Complete (4/5 tools, 80% category completion)
- **Overall Progress**: 45% (up from 35%)
- **Browser Safety**: Production-ready recovery mechanisms

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