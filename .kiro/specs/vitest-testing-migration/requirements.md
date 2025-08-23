# Requirements Document

## Introduction

This feature involves migrating the current bash-based testing infrastructure to a modern TypeScript-based testing framework using vitest. The goal is to replace the existing `test/test-server.sh` script with comprehensive TypeScript test cases that can run in-process, provide better debugging capabilities, and ensure robust validation of all MCP server tools.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to run tests using a modern TypeScript testing framework, so that I can have better debugging capabilities and type safety in my test code.

#### Acceptance Criteria

1. WHEN the test suite is executed THEN vitest SHALL be used as the testing framework
2. WHEN tests are written THEN they SHALL be in TypeScript format with full type safety
3. WHEN tests are executed THEN they SHALL provide detailed error reporting and stack traces
4. WHEN tests fail THEN the output SHALL be more readable than the current bash script output

### Requirement 2

**User Story:** As a developer, I want tests to run in-process rather than spawning separate server processes, so that I can have faster test execution and better debugging capabilities.

#### Acceptance Criteria

1. WHEN tests are executed THEN the MCP server SHALL run in-process within the test environment
2. WHEN multiple tests run THEN each test SHALL have its own isolated server instance
3. WHEN tests complete THEN there SHALL be no hanging processes or resource leaks
4. WHEN debugging tests THEN developers SHALL be able to set breakpoints in both test and server code

### Requirement 3

**User Story:** As a developer, I want tests to be colocated with source files, so that I can maintain tests close to the code they're testing and follow modern testing conventions.

#### Acceptance Criteria

1. WHEN test files are created THEN they SHALL be placed alongside source files with `.test.ts` extension
2. WHEN the build process runs THEN test files SHALL NOT be included in the compiled output
3. WHEN organizing tests THEN each major component SHALL have its own test file
4. WHEN running tests THEN vitest SHALL automatically discover test files based on naming convention

### Requirement 4

**User Story:** As a developer, I want each MCP tool to have dedicated test cases, so that I can ensure comprehensive coverage of all server functionality.

#### Acceptance Criteria

1. WHEN testing the navigate tool THEN it SHALL validate URL navigation and response format
2. WHEN testing the list_tab_urls tool THEN it SHALL verify tab URL listing functionality
3. WHEN testing the click tool THEN it SHALL validate element clicking with CSS selectors
4. WHEN testing the take_screenshot tool THEN it SHALL verify screenshot capture and base64 encoding
5. WHEN testing the get_html tool THEN it SHALL validate HTML content extraction
6. WHEN testing the get_console tool THEN it SHALL verify console output capture and clearing functionality
7. WHEN testing tool schemas THEN each tool's parameter validation SHALL be verified

### Requirement 5

**User Story:** As a developer, I want tests to run in parallel safely, so that I can have faster test execution without conflicts between test cases.

#### Acceptance Criteria

1. WHEN multiple tests run concurrently THEN each test SHALL use its own browser tab
2. WHEN tests access the same browser instance THEN there SHALL be no conflicts between tests
3. WHEN tests run in parallel THEN session isolation SHALL be maintained
4. WHEN tests complete THEN all browser resources SHALL be properly cleaned up

### Requirement 6

**User Story:** As a developer, I want to use the official MCP SDK client for testing, so that I can ensure compatibility with real MCP client implementations.

#### Acceptance Criteria

1. WHEN creating test clients THEN the `@modelcontextprotocol/sdk` client implementation SHALL be used
2. WHEN testing MCP protocol communication THEN real MCP message formats SHALL be used
3. WHEN validating responses THEN they SHALL conform to MCP protocol specifications
4. WHEN testing tool calls THEN the client SHALL use the same interface as production clients

### Requirement 7

**User Story:** As a developer, I want the public API of the server to remain unchanged, so that existing integrations continue to work without modification.

#### Acceptance Criteria

1. WHEN defining tool interfaces THEN each tool command request and response format SHALL have dedicated TypeScript types representing the current public API
2. WHEN refactoring for testability THEN the main entry point API SHALL remain identical
3. WHEN the server starts THEN it SHALL behave exactly as before for external clients
4. WHEN making internal changes THEN public interfaces SHALL not be modified
5. WHEN running in production THEN the server SHALL have the same behavior as the current implementation

### Requirement 8

**User Story:** As a developer, I want comprehensive test coverage including error cases, so that I can ensure robust error handling and edge case management.

#### Acceptance Criteria

1. WHEN testing tools without an active page THEN appropriate error responses SHALL be validated
2. WHEN testing with invalid parameters THEN parameter validation errors SHALL be caught
3. WHEN testing browser connection failures THEN error handling SHALL be verified
4. WHEN testing resource cleanup THEN proper disconnection behavior SHALL be validated
5. WHEN testing concurrent access THEN thread safety and session isolation SHALL be verified

### Requirement 9

**User Story:** As a developer, I want tests to use a local web server for serving test resources, so that I can test browser interactions with real web content without external dependencies.

#### Acceptance Criteria

1. WHEN tests need web content THEN a simple local web server SHALL be started using native Node.js 22 capabilities
2. WHEN multiple tests run THEN each test SHALL use its own auto-assigned port to avoid conflicts
3. WHEN defining test resources THEN they SHALL be specified as simple resource definitions with path, body, and content type
4. WHEN test resources reference files THEN they SHALL support relative paths to test directories
5. WHEN tests complete THEN the local web server SHALL be properly shut down
6. WHEN serving resources THEN the server SHALL NOT use express or other external web frameworks

### Requirement 10

**User Story:** As a developer, I want tests organized in subfolders, so that test files don't pollute the main source tree and are clearly associated with their components.

#### Acceptance Criteria

1. WHEN creating test files THEN they SHALL be placed in `_tests` subfolders within component directories
2. WHEN organizing test resources THEN they SHALL be colocated with their respective test files
3. WHEN building the project THEN test folders SHALL be excluded from the compiled output
4. WHEN running tests THEN vitest SHALL discover tests in subfolder structures

### Requirement 11

**User Story:** As a developer, I want comprehensive integration tests, so that I can verify complex workflows involving multiple tools working together.

#### Acceptance Criteria

1. WHEN running integration tests THEN they SHALL test multiple page navigation scenarios
2. WHEN testing user interactions THEN they SHALL include clicking buttons and executing scripts
3. WHEN testing navigation flows THEN they SHALL verify clicking links that result in page navigation
4. WHEN testing visual verification THEN they SHALL include screen capture at different workflow stages
5. WHEN testing complex scenarios THEN they SHALL combine multiple tools in realistic usage patterns