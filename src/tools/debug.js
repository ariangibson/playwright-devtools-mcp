import { browserManager } from '../utils/browser-manager.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const debugTakeScreenshotTool = {
  name: 'debug_take_screenshot',
  description: 'Take a screenshot of the current viewport or full page for visual debugging',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      fullPage: {
        type: 'boolean',
        description: 'Capture the full scrollable page instead of just the viewport',
        default: false
      },
      quality: {
        type: 'number',
        description: 'Image quality for JPEG (0-100, only applies to JPEG format)',
        minimum: 0,
        maximum: 100,
        default: 90
      },
      format: {
        type: 'string',
        description: 'Screenshot format',
        enum: ['png', 'jpeg'],
        default: 'png'
      },
      clip: {
        type: 'object',
        description: 'Clip the screenshot to a specific region',
        properties: {
          x: { type: 'number', description: 'X coordinate of top-left corner' },
          y: { type: 'number', description: 'Y coordinate of top-left corner' },
          width: { type: 'number', description: 'Width of the region' },
          height: { type: 'number', description: 'Height of the region' }
        },
        required: ['x', 'y', 'width', 'height']
      },
      annotations: {
        type: 'array',
        description: 'Add visual annotations to the screenshot',
        items: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['rectangle', 'circle', 'arrow', 'text'],
              description: 'Type of annotation'
            },
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
            width: { type: 'number', description: 'Width (for rectangle)' },
            height: { type: 'number', description: 'Height (for rectangle)' },
            radius: { type: 'number', description: 'Radius (for circle)' },
            text: { type: 'string', description: 'Text content (for text annotation)' },
            color: { type: 'string', description: 'Annotation color', default: 'red' }
          },
          required: ['type', 'x', 'y']
        }
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      const startTime = Date.now();

      // Prepare screenshot options
      const screenshotOptions = {
        fullPage: params.fullPage || false,
        type: params.format || 'png',
        quality: params.format === 'jpeg' ? (params.quality || 90) : undefined,
        clip: params.clip || undefined
      };

      // Take the screenshot
      const screenshotBuffer = await page.screenshot(screenshotOptions);
      
      // Generate temporary file path
      const timestamp = Date.now();
      const filename = `screenshot-${timestamp}.${params.format || 'png'}`;
      const tempPath = join(tmpdir(), filename);
      
      // Save screenshot to temporary file
      await fs.writeFile(tempPath, screenshotBuffer);

      // Get page info
      const url = page.url();
      const title = await page.title();
      const viewport = page.viewportSize();
      
      // Get page dimensions for full page screenshots
      let pageDimensions = null;
      if (params.fullPage) {
        pageDimensions = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          clientWidth: document.documentElement.clientWidth,
          clientHeight: document.documentElement.clientHeight
        }));
      }

      const endTime = Date.now();

      return {
        success: true,
        data: {
          screenshotPath: tempPath,
          filename,
          url,
          title,
          viewport,
          pageDimensions,
          fileSize: screenshotBuffer.length,
          format: params.format || 'png',
          fullPage: params.fullPage || false,
          quality: params.format === 'jpeg' ? (params.quality || 90) : null,
          captureTime: endTime - startTime,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          duration: endTime - startTime,
          contextId: params.contextId,
          screenshotType: params.fullPage ? 'fullPage' : 'viewport'
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
        },
        error: {
          code: 'SCREENSHOT_FAILED',
          message: `Failed to take screenshot: ${error.message}`,
          details: {
            contextId: params.contextId,
            fullPage: params.fullPage,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const debugGetPageSourceTool = {
  name: 'debug_get_page_source',
  description: 'Get the current DOM HTML source for debugging',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      pretty: {
        type: 'boolean',
        description: 'Format the HTML with proper indentation',
        default: true
      },
      includeDoctype: {
        type: 'boolean',
        description: 'Include the DOCTYPE declaration',
        default: true
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      const startTime = Date.now();

      // Get the HTML content
      const htmlContent = await page.content();
      
      // Get additional page info
      const url = page.url();
      const title = await page.title();
      
      // Basic stats about the DOM
      const domStats = await page.evaluate(() => ({
        totalElements: document.querySelectorAll('*').length,
        totalScripts: document.querySelectorAll('script').length,
        totalLinks: document.querySelectorAll('link').length,
        totalImages: document.querySelectorAll('img').length,
        totalForms: document.querySelectorAll('form').length,
        bodyClasses: document.body ? Array.from(document.body.classList) : [],
        lang: document.documentElement.lang || null,
        charset: document.characterSet || null
      }));

      const endTime = Date.now();

      return {
        success: true,
        data: {
          html: htmlContent,
          url,
          title,
          stats: domStats,
          size: htmlContent.length,
          extractionTime: endTime - startTime,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          duration: endTime - startTime,
          contextId: params.contextId,
          includeDoctype: params.includeDoctype,
          pretty: params.pretty
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
        },
        error: {
          code: 'PAGE_SOURCE_FAILED',
          message: `Failed to get page source: ${error.message}`,
          details: {
            contextId: params.contextId,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const debugGetElementPropertiesTool = {
  name: 'debug_get_element_properties',
  description: 'Get comprehensive properties of a specific element for deep debugging analysis',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      selector: {
        type: 'string',
        description: 'CSS selector to target the element for inspection'
      },
      includeComputedStyles: {
        type: 'boolean',
        description: 'Include computed CSS styles',
        default: true
      },
      includeAttributes: {
        type: 'boolean',
        description: 'Include all element attributes',
        default: true
      },
      includeDimensions: {
        type: 'boolean',
        description: 'Include element dimensions and positioning',
        default: true
      },
      includeAccessibility: {
        type: 'boolean',
        description: 'Include accessibility properties (ARIA, roles, etc.)',
        default: true
      },
      includeEventListeners: {
        type: 'boolean',
        description: 'Include attached event listeners (if detectable)',
        default: false
      },
      includeParentChain: {
        type: 'boolean',
        description: 'Include parent element chain up to body',
        default: false
      }
    },
    required: ['contextId', 'selector']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      const startTime = Date.now();

      // First check if element exists
      const elementExists = await page.$(params.selector);
      if (!elementExists) {
        throw new Error(`Element not found for selector: ${params.selector}`);
      }

      // Get comprehensive element properties
      const elementData = await page.evaluate((options) => {
        const element = document.querySelector(options.selector);
        if (!element) {
          throw new Error(`Element not found: ${options.selector}`);
        }

        const data = {
          tagName: element.tagName.toLowerCase(),
          nodeType: element.nodeType,
          id: element.id || null,
          className: element.className || null,
          textContent: element.textContent?.trim() || null,
          innerHTML: element.innerHTML || null,
          outerHTML: element.outerHTML || null
        };

        // Basic attributes
        if (options.includeAttributes) {
          data.attributes = {};
          for (const attr of element.attributes || []) {
            data.attributes[attr.name] = attr.value;
          }
        }

        // Computed styles
        if (options.includeComputedStyles) {
          const computedStyle = window.getComputedStyle(element);
          data.computedStyles = {};
          
          // Key CSS properties for debugging
          const importantProps = [
            'display', 'visibility', 'opacity', 'position', 'z-index',
            'top', 'right', 'bottom', 'left',
            'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'border', 'border-width', 'border-style', 'border-color',
            'background-color', 'background-image', 'background-size', 'background-position',
            'color', 'font-size', 'font-family', 'font-weight', 'line-height',
            'text-align', 'text-decoration', 'text-transform',
            'overflow', 'overflow-x', 'overflow-y',
            'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
            'grid', 'grid-template-columns', 'grid-template-rows',
            'transform', 'transition', 'animation'
          ];

          for (const prop of importantProps) {
            const value = computedStyle.getPropertyValue(prop);
            if (value) {
              data.computedStyles[prop] = value;
            }
          }
        }

        // Dimensions and positioning
        if (options.includeDimensions) {
          const rect = element.getBoundingClientRect();
          data.dimensions = {
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left
            },
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            scrollWidth: element.scrollWidth,
            scrollHeight: element.scrollHeight,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            scrollTop: element.scrollTop,
            scrollLeft: element.scrollLeft
          };

          // Viewport visibility
          data.visibility = {
            inViewport: rect.top >= 0 && rect.left >= 0 && 
                       rect.bottom <= window.innerHeight && 
                       rect.right <= window.innerWidth,
            partiallyVisible: rect.bottom > 0 && rect.right > 0 && 
                             rect.top < window.innerHeight && 
                             rect.left < window.innerWidth
          };
        }

        // Accessibility properties
        if (options.includeAccessibility) {
          data.accessibility = {
            role: element.getAttribute('role') || element.tagName.toLowerCase(),
            ariaLabel: element.getAttribute('aria-label') || null,
            ariaLabelledBy: element.getAttribute('aria-labelledby') || null,
            ariaDescribedBy: element.getAttribute('aria-describedby') || null,
            ariaHidden: element.getAttribute('aria-hidden') || null,
            tabIndex: element.tabIndex,
            title: element.title || null,
            alt: element.getAttribute('alt') || null,
            focusable: element.tabIndex >= 0 || 
                      ['input', 'button', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase())
          };
        }

        // Event listeners (limited detection)
        if (options.includeEventListeners) {
          data.eventListeners = [];
          
          // Check for common onclick patterns
          if (element.onclick) data.eventListeners.push('click (inline)');
          if (element.getAttribute('onclick')) data.eventListeners.push('click (attribute)');
          
          // Check for form-related events
          if (['input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
            data.eventListeners.push('form events (likely)');
          }
          
          // Check for link navigation
          if (element.tagName.toLowerCase() === 'a' && element.href) {
            data.eventListeners.push('navigation (href)');
          }
        }

        // Parent chain
        if (options.includeParentChain) {
          data.parentChain = [];
          let parent = element.parentElement;
          let depth = 0;
          
          while (parent && parent.tagName.toLowerCase() !== 'body' && depth < 10) {
            data.parentChain.push({
              tagName: parent.tagName.toLowerCase(),
              id: parent.id || null,
              className: parent.className || null,
              depth: depth + 1
            });
            parent = parent.parentElement;
            depth++;
          }
        }

        // Element state
        data.state = {
          disabled: element.disabled || false,
          checked: element.checked || false,
          selected: element.selected || false,
          hidden: element.hidden || false,
          readOnly: element.readOnly || false,
          required: element.required || false,
          value: element.value || null,
          href: element.href || null,
          src: element.src || null
        };

        return data;
      }, {
        selector: params.selector,
        includeComputedStyles: params.includeComputedStyles !== false,
        includeAttributes: params.includeAttributes !== false,
        includeDimensions: params.includeDimensions !== false,
        includeAccessibility: params.includeAccessibility !== false,
        includeEventListeners: params.includeEventListeners === true,
        includeParentChain: params.includeParentChain === true
      });

      // Get page context
      const url = page.url();
      const title = await page.title();
      const endTime = Date.now();

      return {
        success: true,
        data: {
          selector: params.selector,
          element: elementData,
          url,
          title,
          options: {
            includeComputedStyles: params.includeComputedStyles !== false,
            includeAttributes: params.includeAttributes !== false,
            includeDimensions: params.includeDimensions !== false,
            includeAccessibility: params.includeAccessibility !== false,
            includeEventListeners: params.includeEventListeners === true,
            includeParentChain: params.includeParentChain === true
          },
          extractionTime: endTime - startTime,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          duration: endTime - startTime,
          contextId: params.contextId,
          selector: params.selector
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId,
          selector: params.selector
        },
        error: {
          code: 'ELEMENT_PROPERTIES_FAILED',
          message: `Failed to get element properties: ${error.message}`,
          details: {
            contextId: params.contextId,
            selector: params.selector,
            originalError: error.toString()
          }
        }
      };
    }
  }
};

export const debugGetDomTreeTool = {
  name: 'debug_get_dom_tree',
  description: 'Get a structured representation of the DOM tree for analysis',
  inputSchema: {
    type: 'object',
    properties: {
      contextId: {
        type: 'string',
        description: 'Browser context ID from browser_launch'
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth to traverse in the DOM tree',
        default: 10,
        minimum: 1,
        maximum: 20
      },
      includeText: {
        type: 'boolean',
        description: 'Include text content of elements',
        default: true
      },
      includeAttributes: {
        type: 'boolean',
        description: 'Include element attributes',
        default: true
      },
      selector: {
        type: 'string',
        description: 'CSS selector to start traversal from (default: html)'
      }
    },
    required: ['contextId']
  },

  async handler(params) {
    try {
      const { context } = await browserManager.getContext(params.contextId);
      const pages = context.pages();
      
      if (pages.length === 0) {
        throw new Error('No active pages in browser context');
      }

      const page = pages[0];
      const startTime = Date.now();

      // Get DOM tree structure
      const domTree = await page.evaluate((options) => {
        function traverseDOM(element, depth = 0, maxDepth = 10) {
          if (depth > maxDepth) {
            return { truncated: true, reason: 'Max depth reached' };
          }

          const node = {
            tagName: element.tagName?.toLowerCase(),
            nodeType: element.nodeType,
            depth: depth
          };

          // Add attributes if requested
          if (options.includeAttributes && element.attributes) {
            node.attributes = {};
            for (const attr of element.attributes) {
              node.attributes[attr.name] = attr.value;
            }
          }

          // Add text content if requested and it's a text node or has direct text
          if (options.includeText) {
            if (element.nodeType === Node.TEXT_NODE) {
              node.textContent = element.textContent?.trim();
            } else if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
              node.textContent = element.textContent?.trim();
            }
          }

          // Add children
          if (element.children && element.children.length > 0) {
            node.children = [];
            for (const child of element.children) {
              const childNode = traverseDOM(child, depth + 1, maxDepth);
              if (childNode) {
                node.children.push(childNode);
              }
            }
          }

          return node;
        }

        const startElement = options.selector 
          ? document.querySelector(options.selector)
          : document.documentElement;

        if (!startElement) {
          throw new Error(`Element not found for selector: ${options.selector}`);
        }

        return traverseDOM(startElement, 0, options.maxDepth);
      }, {
        maxDepth: params.maxDepth || 10,
        includeText: params.includeText !== false,
        includeAttributes: params.includeAttributes !== false,
        selector: params.selector
      });

      // Get additional page info
      const url = page.url();
      const title = await page.title();

      const endTime = Date.now();

      return {
        success: true,
        data: {
          domTree,
          url,
          title,
          options: {
            maxDepth: params.maxDepth || 10,
            includeText: params.includeText !== false,
            includeAttributes: params.includeAttributes !== false,
            selector: params.selector || 'html'
          },
          extractionTime: endTime - startTime,
          contextId: params.contextId
        },
        metadata: {
          timestamp: Date.now(),
          duration: endTime - startTime,
          contextId: params.contextId
        },
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        metadata: {
          timestamp: Date.now(),
          contextId: params.contextId
        },
        error: {
          code: 'DOM_TREE_FAILED',
          message: `Failed to get DOM tree: ${error.message}`,
          details: {
            contextId: params.contextId,
            selector: params.selector,
            originalError: error.toString()
          }
        }
      };
    }
  }
};