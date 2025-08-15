import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { browserLaunchTool, browserNavigateTool, browserCloseTool } from './tools/browser.js';
import { consoleGetLogsTool, consoleClearLogsTool, consoleEvaluateJavaScriptTool } from './tools/console.js';
import { networkGetRequestsTool, networkGetFailedRequestsTool, networkClearRequestsTool } from './tools/network.js';
import { performanceGetMetricsTool, performanceGetCoreVitalsTool } from './tools/performance.js';

// Registry of all available tools
const TOOLS = [
  // Browser Management
  browserLaunchTool,
  browserNavigateTool,
  browserCloseTool,
  
  // Console & DevTools
  consoleGetLogsTool,
  consoleClearLogsTool,
  consoleEvaluateJavaScriptTool,
  
  // Network Analysis
  networkGetRequestsTool,
  networkGetFailedRequestsTool,
  networkClearRequestsTool,
  
  // Performance Monitoring  
  performanceGetMetricsTool,
  performanceGetCoreVitalsTool
];

export async function createMCPServer(server) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    // Find the requested tool
    const tool = TOOLS.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      console.error(`🔧 Executing tool: ${name}`);
      
      // Execute the tool
      const result = await tool.handler(args || {});
      
      if (result.success) {
        console.error(`✅ Tool ${name} completed successfully`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } else {
        console.error(`❌ Tool ${name} failed: ${result.error?.message}`);
        return {
          content: [
            {
              type: 'text', 
              text: JSON.stringify(result, null, 2)
            }
          ],
          isError: true
        };
      }
    } catch (error) {
      console.error(`💥 Tool ${name} threw an error:`, error);
      
      const errorResult = {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          tool: name
        },
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: `Tool execution failed: ${error.message}`,
          details: { 
            tool: name,
            args: args,
            originalError: error.toString()
          }
        }
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResult, null, 2)
          }
        ],
        isError: true
      };
    }
  });

  console.error(`📝 Registered ${TOOLS.length} tools`);
}