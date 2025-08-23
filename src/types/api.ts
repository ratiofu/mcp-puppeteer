// Import MCP SDK types for protocol compliance
import { 
  CallToolResult, 
  TextContent, 
  ImageContent 
} from '@modelcontextprotocol/sdk/types.js';

// Tool-specific request types (parameters passed to tools)

/**
 * Request parameters for the navigate tool
 */
export interface NavigateRequest {
  /** The URL to navigate to, must be a valid HTTP/HTTPS URL */
  url: string;
}

/**
 * Request parameters for the click tool
 */
export interface ClickRequest {
  /** CSS selector of the element to click */
  selector: string;
}

/**
 * Request parameters for the get_console tool
 */
export interface GetConsoleRequest {
  /** Whether to clear the console logs after retrieving them */
  clear?: boolean;
}

/**
 * Request parameters for tools that don't require any parameters
 * Used by: list_tab_urls, take_screenshot, get_html
 */
export interface EmptyRequest {
  // No parameters required
}

// Tool response types (extend MCP CallToolResult for protocol compliance)

/**
 * Response from the navigate tool
 */
export interface NavigateResponse extends CallToolResult {
  /** Array containing the response message */
  content: Array<TextContent>;
  /** Indicates whether the operation resulted in an error */
  isError: boolean;
}

/**
 * Response from the click tool
 */
export interface ClickResponse extends CallToolResult {
  /** Array containing the response message */
  content: Array<TextContent>;
  /** Indicates whether the operation resulted in an error */
  isError: boolean;
}

/**
 * Response from the take_screenshot tool
 */
export interface ScreenshotResponse extends CallToolResult {
  /** Array containing the base64-encoded PNG image data or error text */
  content: Array<ImageContent | TextContent>;
  /** Indicates whether the operation resulted in an error */
  isError: boolean;
}

/**
 * Response from the get_html tool
 */
export interface GetHtmlResponse extends CallToolResult {
  /** Array containing the HTML content of the current page */
  content: Array<TextContent>;
  /** Indicates whether the operation resulted in an error */
  isError: boolean;
}

/**
 * Response from the get_console tool
 */
export interface GetConsoleResponse extends CallToolResult {
  /** Array containing the console output */
  content: Array<TextContent>;
  /** Indicates whether the operation resulted in an error */
  isError: boolean;
}

/**
 * Response from the list_tab_urls tool
 */
export interface ListTabUrlsResponse extends CallToolResult {
  /** Array containing the comma-separated list of tab URLs */
  content: Array<TextContent>;
  /** Indicates whether the operation resulted in an error */
  isError: boolean;
}

// Union types for convenience and type safety

/**
 * Union type for all possible tool request parameters
 */
export type ToolRequest = 
  | NavigateRequest 
  | ClickRequest 
  | GetConsoleRequest 
  | EmptyRequest;

/**
 * Union type for all possible tool response types
 */
export type ToolResponse = 
  | NavigateResponse 
  | ClickResponse 
  | ScreenshotResponse 
  | GetHtmlResponse 
  | GetConsoleResponse 
  | ListTabUrlsResponse;

/**
 * Union type for all text-based tool responses
 */
export type TextToolResponse = 
  | NavigateResponse 
  | ClickResponse 
  | GetHtmlResponse 
  | GetConsoleResponse 
  | ListTabUrlsResponse;

/**
 * Union type for all image-based tool responses
 */
export type ImageToolResponse = ScreenshotResponse;

// Tool name constants for type safety

/**
 * Available tool names in the MCP server
 */
export const TOOL_NAMES = {
  NAVIGATE: 'navigate',
  LIST_TAB_URLS: 'list_tab_urls',
  CLICK: 'click',
  TAKE_SCREENSHOT: 'take_screenshot',
  GET_HTML: 'get_html',
  GET_CONSOLE: 'get_console'
} as const;

/**
 * Union type of all available tool names
 */
export type ToolName = typeof TOOL_NAMES[keyof typeof TOOL_NAMES];

// Tool mapping types for enhanced type safety

/**
 * Maps tool names to their corresponding request parameter types
 */
export interface ToolRequestMap {
  [TOOL_NAMES.NAVIGATE]: NavigateRequest;
  [TOOL_NAMES.CLICK]: ClickRequest;
  [TOOL_NAMES.GET_CONSOLE]: GetConsoleRequest;
  [TOOL_NAMES.LIST_TAB_URLS]: EmptyRequest;
  [TOOL_NAMES.TAKE_SCREENSHOT]: EmptyRequest;
  [TOOL_NAMES.GET_HTML]: EmptyRequest;
}

/**
 * Maps tool names to their corresponding response types
 */
export interface ToolResponseMap {
  [TOOL_NAMES.NAVIGATE]: NavigateResponse;
  [TOOL_NAMES.CLICK]: ClickResponse;
  [TOOL_NAMES.GET_CONSOLE]: GetConsoleResponse;
  [TOOL_NAMES.LIST_TAB_URLS]: ListTabUrlsResponse;
  [TOOL_NAMES.TAKE_SCREENSHOT]: ScreenshotResponse;
  [TOOL_NAMES.GET_HTML]: GetHtmlResponse;
}

// Error response helper types

/**
 * Standard error response structure for tools
 */
export interface ErrorResponse extends CallToolResult {
  /** Array containing the error message */
  content: Array<TextContent>;
  /** Always true for error responses */
  isError: true;
}

/**
 * Common error messages used across tools
 */
export const ERROR_MESSAGES = {
  NO_PAGE: 'no current page',
  NO_PAGE_TO_CLICK: 'no current page to click',
  NO_PAGE_TO_SCREENSHOT: 'no current page to screenshot',
  NO_PAGE_TO_EXTRACT_HTML: 'no current page to extract HTML from',
  NO_PAGE_WITH_CONSOLE: 'no current page with console output',
  NAVIGATION_FAILED: 'navigation failed',
  CLICK_FAILED: 'click operation failed',
  SCREENSHOT_FAILED: 'screenshot capture failed',
  HTML_EXTRACTION_FAILED: 'HTML extraction failed',
  CONSOLE_RETRIEVAL_FAILED: 'console output retrieval failed'
} as const;

/**
 * Union type of all error message constants
 */
export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];