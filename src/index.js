#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from './server.js';

async function main() {
  console.error('🎭 Starting Playwright DevTools MCP Server...');
  
  try {
    // Create MCP server instance
    const server = new Server(
      {
        name: 'playwright-devtools-mcp',
        version: '0.3.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Setup our custom MCP server logic
    await createMCPServer(server);

    // Create stdio transport for Claude Desktop
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('✅ Playwright DevTools MCP Server started successfully');
    console.error('👀 Browsers will open visibly by default (use headless: true to hide)');
    console.error('🔧 Available tools:');
    console.error('   📱 Browser: browser_launch, browser_navigate, browser_close');
    console.error('   🛡️ Safety: browser_navigate_safe, browser_health_check, browser_force_recreate');
    console.error('   🐛 Console: console_get_logs, console_clear_logs, console_evaluate_javascript');
    console.error('   🌐 Network: network_get_requests, network_get_failed_requests, network_clear_requests');
    console.error('   ⚡ Performance: performance_get_metrics, performance_get_core_vitals');
    console.error('   💾 Storage: storage_get_local_storage, storage_get_session_storage, storage_get_cookies, storage_clear_data');
    console.error('   🎨 Debug: debug_take_screenshot, debug_get_page_source, debug_get_element_properties, debug_get_dom_tree');
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('🛑 Shutting down Playwright DevTools MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('🛑 Shutting down Playwright DevTools MCP Server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});