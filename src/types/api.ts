// Import MCP SDK types for protocol compliance
import type { CallToolResult, ImageContent, TextContent } from '@modelcontextprotocol/sdk/types.js'

// Tool-specific request types (parameters passed to tools)

/**
 * Request parameters for the navigate tool
 */
export interface NavigateRequest {
  /** The URL to navigate to, must be a valid HTTP/HTTPS URL */
  url: string
}

/**
 * Request parameters for the click tool
 */
export interface ClickRequest {
  /** CSS selector of the element to click */
  selector: string
}

/**
 * Request parameters for the get_console tool
 */
export interface GetConsoleRequest {
  /** Whether to clear the console logs after retrieving them */
  clear?: boolean
}

/**
 * Request parameters for tools that don't require any parameters
 * Used by: list_tab_urls, take_screenshot, get_html
 */
export type EmptyRequest = Record<string, never>

// Tool response types (extend MCP CallToolResult for protocol compliance)

/**
 * Response from the navigate tool
 */
export interface NavigateResponse extends CallToolResult {
  /** Array containing the response message */
  content: Array<TextContent>
  /** Indicates whether the operation resulted in an error */
  isError: boolean
}

/**
 * Response from the click tool
 */
export interface ClickResponse extends CallToolResult {
  /** Array containing the response message */
  content: Array<TextContent>
  /** Indicates whether the operation resulted in an error */
  isError: boolean
}

/**
 * Response from the take_screenshot tool
 */
export interface ScreenshotResponse extends CallToolResult {
  /** Array containing the base64-encoded PNG image data or error text */
  content: Array<ImageContent | TextContent>
  /** Indicates whether the operation resulted in an error */
  isError: boolean
}

/**
 * Response from the get_html tool
 */
export interface GetHtmlResponse extends CallToolResult {
  /** Array containing the HTML content of the current page */
  content: Array<TextContent>
  /** Indicates whether the operation resulted in an error */
  isError: boolean
}

/**
 * Response from the get_console tool
 */
export interface GetConsoleResponse extends CallToolResult {
  /** Array containing the console output */
  content: Array<TextContent>
  /** Indicates whether the operation resulted in an error */
  isError: boolean
}

/**
 * Response from the list_tab_urls tool
 */
export interface ListTabUrlsResponse extends CallToolResult {
  /** Array containing the comma-separated list of tab URLs */
  content: Array<TextContent>
  /** Indicates whether the operation resulted in an error */
  isError: boolean
}

// Union types for convenience and type safety

/**
 * Union type for all possible tool request parameters
 */
export type ToolRequest = NavigateRequest | ClickRequest | GetConsoleRequest | EmptyRequest

/**
 * Union type for all possible tool response types
 */
export type ToolResponse =
  | NavigateResponse
  | ClickResponse
  | ScreenshotResponse
  | GetHtmlResponse
  | GetConsoleResponse
  | ListTabUrlsResponse

/**
 * Union type for all text-based tool responses
 */
export type TextToolResponse =
  | NavigateResponse
  | ClickResponse
  | GetHtmlResponse
  | GetConsoleResponse
  | ListTabUrlsResponse

/**
 * Union type for all image-based tool responses
 */
export type ImageToolResponse = ScreenshotResponse

// Tool name constants for type safety

/**
 * Available tool names in the MCP server
 */
export const ToolNames = {
  navigate: 'navigate',
  listTabUrls: 'list_tab_urls',
  click: 'click',
  takeScreenshot: 'take_screenshot',
  getHtml: 'get_html',
  getConsole: 'get_console',
} as const

/**
 * Union type of all available tool names
 */
export type ToolName = (typeof ToolNames)[keyof typeof ToolNames]

// Tool mapping types for enhanced type safety

/**
 * Maps tool names to their corresponding request parameter types
 */
export interface ToolRequestMap {
  [ToolNames.navigate]: NavigateRequest
  [ToolNames.click]: ClickRequest
  [ToolNames.getConsole]: GetConsoleRequest
  [ToolNames.listTabUrls]: EmptyRequest
  [ToolNames.takeScreenshot]: EmptyRequest
  [ToolNames.getHtml]: EmptyRequest
}

/**
 * Maps tool names to their corresponding response types
 */
export interface ToolResponseMap {
  [ToolNames.navigate]: NavigateResponse
  [ToolNames.click]: ClickResponse
  [ToolNames.getConsole]: GetConsoleResponse
  [ToolNames.listTabUrls]: ListTabUrlsResponse
  [ToolNames.takeScreenshot]: ScreenshotResponse
  [ToolNames.getHtml]: GetHtmlResponse
}

// Error response helper types

/**
 * Standard error response structure for tools
 */
export interface ErrorResponse extends CallToolResult {
  /** Array containing the error message */
  content: Array<TextContent>
  /** Always true for error responses */
  isError: true
}

/**
 * Common error messages used across tools
 */
export const ERROR_MESSAGES = {
  noPage: 'no current page',
  navigationFailed: 'navigation failed',
  clickFailed: 'click operation failed',
  screenshotFailed: 'screenshot capture failed',
  htmlExtractionFailed: 'HTML extraction failed',
  consoleRetrievalFailed: 'console output retrieval failed',
} as const

/**
 * Union type of all error message constants
 */
export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES]
