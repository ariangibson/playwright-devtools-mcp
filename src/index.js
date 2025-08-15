#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createMCPServer } from './server.js';

async function main() {
  console.error('🎭 Starting Playwright DevTools MCP Server...');
  
  try {
    // Create MCP server instance
    const server = new Server(
      {
        name: 'playwright-devtools-mcp',
        version: '0.1.0',
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
    console.error('🔧 Available tools: browser_launch, browser_navigate, console_get_logs, network_get_requests');
    
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