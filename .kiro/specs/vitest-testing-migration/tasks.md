# Implementation Plan

- [x] 1. Set up vitest testing infrastructure and configuration
  - Install vitest as a dev dependency and configure package.json scripts
  - Create vitest.config.ts with proper test discovery and exclusion patterns
  - Update tsconfig.json to exclude test directories from compilation
  - _Requirements: 1.1, 3.3, 10.3_

- [x] 2. Create TypeScript API type definitions
  - Implement base types using MCP SDK types for protocol compliance
  - Define tool-specific request and response interfaces with descriptive comments
  - Create union types for convenience and type safety
  - _Requirements: 7.1, 1.2_

- [ ] 3. Implement test utilities and infrastructure
- [x] 3.1 Create test setup and browser management utilities
  - Write test-setup.ts with shared browser instance management
  - Implement browser lifecycle functions for test initialization and cleanup
  - Add proper error handling for browser connection failures
  - _Requirements: 2.2, 2.3, 8.3_

- [x] 3.2 Implement local test web server
  - Create TestWebServer class using native Node.js HTTP server
  - Implement auto-port assignment and resource serving capabilities
  - Add support for both inline content and file-based resources
  - Write proper server lifecycle management with cleanup
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 3.3 Create in-memory transport for testing
  - Implement TestTransport class for bidirectional MCP communication
  - Add message routing between client and server instances
  - Ensure proper cleanup and resource management
  - _Requirements: 2.1, 6.2_

- [x] 3.4 Implement MCP test client wrapper
  - Create McpTestClient class using official MCP SDK client
  - Implement tool calling methods with proper type safety
  - Add initialization and cleanup methods for test lifecycle
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 3.5 Create test server factory
  - Implement createTestServer function for test server instantiation
  - Ensure proper session isolation between test instances
  - Add helper functions for common test setup patterns
  - _Requirements: 2.2, 5.3_

- [ ] 4. Implement individual tool tests
- [ ] 4.1 Create navigate tool tests
  - Write tests for valid URL navigation with local test server
  - Test error handling for invalid URLs and network failures
  - Verify response format matches NavigateResponse interface
  - Test navigation to different page types (HTML, redirects)
  - _Requirements: 4.1, 8.1, 8.2, 9.1_

- [ ] 4.2 Create click tool tests
  - Write tests for clicking elements using CSS selectors
  - Test error handling when no page is available
  - Test clicking on different element types (buttons, links, inputs)
  - Verify error responses for invalid selectors
  - _Requirements: 4.3, 8.1, 8.2_

- [ ] 4.3 Create screenshot tool tests
  - Write tests for screenshot capture and base64 encoding
  - Test error handling when no page is available
  - Verify image format and MIME type correctness
  - Test screenshots of different page states and sizes
  - _Requirements: 4.4, 8.1_

- [ ] 4.4 Create HTML extraction tool tests
  - Write tests for HTML content extraction from test pages
  - Test error handling when no page is available
  - Verify complete HTML content retrieval including dynamic content
  - Test HTML extraction from different page types
  - _Requirements: 4.5, 8.1_

- [ ] 4.5 Create console tool tests
  - Write tests for console output capture using test pages with JavaScript
  - Test console clearing functionality with clear parameter
  - Test error handling when no page is available
  - Verify console output from different JavaScript execution contexts
  - _Requirements: 4.6, 8.1, 9.1_

- [ ] 4.6 Create list tab URLs tool tests
  - Write tests for tab URL listing functionality
  - Test with multiple tabs open in the same browser instance
  - Verify URL format and completeness in responses
  - Test session isolation between different test instances
  - _Requirements: 4.2, 5.3_

- [ ] 5. Implement schema validation tests
- [ ] 5.1 Create tool schema validation tests
  - Write tests to verify each tool's parameter schema matches Zod definitions
  - Test parameter validation for required and optional fields
  - Verify error responses for invalid parameter types
  - Test schema compatibility with MCP protocol requirements
  - _Requirements: 4.7, 8.2_

- [ ] 5.2 Create MCP protocol compliance tests
  - Write tests to verify tool responses conform to MCP CallToolResult format
  - Test tool listing functionality returns correct schema information
  - Verify client-server communication follows MCP protocol standards
  - _Requirements: 6.2, 6.3_

- [ ] 6. Implement parallel execution and session isolation tests
- [ ] 6.1 Create concurrent tool execution tests
  - Write tests that run multiple tool calls simultaneously
  - Verify each test uses isolated browser tabs
  - Test resource cleanup when multiple tests run concurrently
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 6.2 Create session isolation verification tests
  - Write tests to verify console logs don't leak between sessions
  - Test that page state is isolated between different test instances
  - Verify browser resource cleanup after test completion
  - _Requirements: 5.3, 8.4_

- [ ] 7. Implement comprehensive integration tests
- [ ] 7.1 Create multi-tool workflow integration test
  - Write test that navigates to test page with interactive elements
  - Test clicking buttons that modify page content and generate console output
  - Test taking screenshots at different workflow stages
  - Test clicking links that result in navigation to different pages
  - Test HTML extraction after page modifications
  - Verify console output capture throughout the workflow
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 7.2 Create error handling integration tests
  - Write tests for error propagation across multiple tool calls
  - Test recovery scenarios when individual tools fail
  - Verify proper cleanup when integration tests encounter errors
  - _Requirements: 8.1, 8.4_

- [ ] 8. Create test resources and fixtures
- [ ] 8.1 Create static test HTML pages
  - Write simple-page.html with basic content for navigation tests
  - Write interactive-page.html with buttons and form elements for click tests
  - Write navigation-test.html with links for navigation workflow tests
  - _Requirements: 9.3, 9.4, 10.2_

- [ ] 8.2 Create JavaScript test resources
  - Write console-test.js with functions that generate console output
  - Create JavaScript that modifies page content for interaction tests
  - Add scripts that test different console message types (log, error, warn)
  - _Requirements: 9.3, 9.4, 10.2_

- [ ] 9. Update build configuration and scripts
- [ ] 9.1 Update package.json with test scripts
  - Add vitest test script and watch mode script
  - Update build process to exclude test directories
  - Add test coverage reporting configuration
  - _Requirements: 1.1, 3.3, 10.3_

- [ ] 9.2 Update TypeScript configuration
  - Modify tsconfig.json to exclude _tests directories from compilation
  - Ensure test files have proper type checking enabled
  - Add test-specific TypeScript configuration if needed
  - _Requirements: 3.3, 10.3_

- [ ] 10. Refactor existing code for testability
- [ ] 10.1 Extract server factory function
  - Refactor index.ts to separate server creation from transport setup
  - Ensure main entry point API remains unchanged for production use
  - Create testable server instantiation without affecting public API
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 10.2 Add type annotations to existing code
  - Update PuppeteerMcpServer to use new API type definitions
  - Ensure existing tool implementations match defined response interfaces
  - Add proper type safety without changing runtime behavior
  - _Requirements: 7.1, 7.4_

- [ ] 11. Remove legacy testing infrastructure
- [ ] 11.1 Remove bash-based test scripts
  - Delete test/test-server.sh and related bash scripts
  - Update documentation to reference new TypeScript testing approach
  - Remove any CI/CD references to old testing scripts
  - _Requirements: 1.3_

- [ ] 11.2 Update project documentation
  - Update README.md with new testing instructions
  - Document test organization and execution procedures
  - Add examples of running individual test suites
  - _Requirements: 1.4_