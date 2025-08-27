# Implementation Plan

- [x] 1. Extract and refactor existing test utilities into shared modules
  - Extract `findChromiumExecutable()` function from test utilities to shared `src/browser-discovery/` module
  - Create `BrowserInstallation` class with launch, verify, and getExecutableInfo methods
  - Add support for `DISABLE_LOCAL_CHROMIUM_DISCOVERY` environment variable in discovery logic
  - Write unit tests for extracted browser discovery functionality
  - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [x] 2. Implement Browser Discovery Service with system and managed browser detection
  - Create `BrowserDiscoveryService` class that implements discovery interface
  - Implement `discoverBrowsers()` method to find all available Chromium installations
  - Implement `findBestBrowser()` method with version filtering and local discovery skip option
  - Implement `checkRunningBrowser()` method to detect browsers with debug ports
  - Write unit tests for browser discovery service with mocked file system operations
  - _Requirements: 1.1, 1.2, 4.5, 6.1, 6.6_

- [x] 3. Create Chrome for Testing API integration module
  - Create `ChromeForTestingApi` service to fetch available browser versions
  - Implement `getAvailableVersions()` method returning `BrowserVersion[]` with kind='chromium'
  - Add platform detection for macOS (mac_x64, mac_arm64) and Linux (linux64)
  - Implement download functionality with progress tracking and error handling
  - Write unit tests with mocked HTTP requests for API integration
  - _Requirements: 4.6, 5.2_

- [x] 4. Implement Browser Manager Service for installation and lifecycle management
  - Create `BrowserManagerService` class with installation capabilities
  - Implement `installChromium()` method using Chrome for Testing API
  - Create managed installation directory structure in `~/.puppeteer-mcp/chromium/`
  - Implement `cleanupOldVersions()` method for maintenance
  - Add installation verification by launching browser with remote debugging
  - Write unit tests for browser manager with temporary directories
  - _Requirements: 4.1, 4.2, 4.4, 4.6_

- [x] 5. Create Version Inspector Service for requirements and compatibility checking
  - Create `VersionInspectorService` class for version management
  - Implement `getVersionRequirement()` method to read chromium.version files
  - Implement `checkCompatibility()` method for version comparison logic
  - Add bundled version reading capability for MCP server
  - Write unit tests for version parsing and compatibility checking
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 5.1. Align existing services with functional architecture
  - Extract those functions that are already pure from `BrowserDiscoveryService` to standalone functions
    - do not convert existing functions to pure functions!
    - the first pure function refactoring may identify a second set of pure functions to extract
    - if the pure functions already have an equivalent or near equivalent in the project, reuse and/or merge
  - Remove request objects (`FindBestBrowserRequest`, `CheckRunningBrowserRequest`) and use direct parameters
  - Write unit tests for extracted pure functions
  - [strictly follow Agent Guidelines](../../../AGENTS.md)

- [ ] 5.2. Extract pure functions from version inspector service
  - Extract those functions that are already pure from `VersionInspectorService` to standalone functions
    - do not convert existing functions to pure functions!
    - the first pure function refactoring may identify a second set of pure functions to extract
    - if the pure functions already have an equivalent or near equivalent in the project, reuse and/or merge
  - Write unit tests for pure version functions
  - [strictly follow Agent Guidelines](../../../AGENTS.md)

- [ ] 6. Add new MCP tools for browser management
  - Write unit tests for `install_browser` MCP tool functionality first
  - Add `install_browser` MCP tool that uses pure `installChromium()` function
  - Implement tool input validation with Zod schemas for version parameters
  - Add proper error handling with installation guidance messages
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 2.9, 4.4_

- [ ] 7. Add new MCP resources for browser status and version information
  - Write unit tests for resource content generation functions first
  - Extract pure functions for status checking and version reporting
  - Create `browser://status` resource using pure status checking functions
  - Create `browser://versions` resource using pure `getAvailableVersions()` function
  - Implement next steps recommendations (install, upgrade, none) as pure logic
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Integrate auto-discovery with existing MCP server startup
  - Write integration tests for server startup scenarios first
  - Extract pure functions for browser discovery and connection logic
  - Modify MCP server initialization to use pure discovery functions
  - Add automatic connection using pure `checkRunningBrowser()` function
  - Implement fallback using pure `findBestBrowser()` function
  - Add version checking using pure `checkCompatibility()` function
  - Refactor `test-setup.ts` to use extracted pure functions and `BrowserInstallation` class
  - Update `launchTestBrowser()` to use pure launch logic while maintaining test configurations
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9. Create CLI executable with MCP client protocol communication
  - Write unit tests for CLI argument parsing and command routing first
  - Extract pure functions for argument parsing and command validation
  - Create minimal CLI entry point using pure functions
  - Implement MCP client protocol connection as thin wrapper around pure functions
  - Add command routing for `list|l`, `install|i`, `update-expected-version|u`, `help`
  - Implement interactive mode using pure selection logic
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 2.1, 2.2, 2.7, 2.9_

- [ ] 10. Implement CLI list command with Clack UI
  - Write unit tests for version listing and selection logic first
  - Extract pure `listVersions()` function for version querying and formatting
  - Create minimal `list` command wrapper using pure function
  - Implement Clack UI as thin presentation layer over pure logic
  - Add version display using pure formatting functions
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 2.1_

- [ ] 11. Implement CLI install command with version selection
  - Write unit tests for installation logic and flag handling first
  - Extract pure `installBrowser()` function for installation logic
  - Create minimal `install` command wrapper using pure function
  - Add `--force-latest` and `-f` flag handling as pure parameter processing
  - Implement version selection UI as thin layer over pure selection logic
  - Add progress feedback using pure progress calculation functions
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 2.2, 2.3_

- [ ] 12. Implement CLI update-expected-version command for project version files
  - Write unit tests for version file operations and repo detection first
  - Extract pure `updateExpectedVersionFile()` and `isInRepoRoot()` functions
  - Create minimal `update-expected-version` command using pure functions
  - Add repo root detection using pure file system checking logic
  - Implement `--force-latest` flag handling as pure parameter processing
  - Add version selection UI as thin layer over pure selection logic
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 2.4, 2.5, 3.4_

- [ ] 13. Add CLI integration with version file management
  - Write integration tests for version file workflows first
  - Extract pure functions for version file prompting and creation logic
  - Implement automatic prompting using pure conditional logic
  - Add version file creation using pure file operations
  - Ensure exclusive write access through pure file locking logic
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 2.8, 3.4_

- [ ] 14. Implement comprehensive error handling and user guidance
  - Write unit tests for error scenarios and guidance generation first
  - Extract pure functions for error message generation and guidance logic
  - Add detailed error messages using pure formatting functions
  - Implement installation guidance using pure recommendation logic
  - Add retry mechanisms using pure retry calculation functions
  - Create user-friendly responses using pure message formatting
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 1.3, 3.3_

- [ ] 15. Add cleanup and maintenance features
  - Write unit tests for cleanup logic and resource management first
  - Extract pure `cleanupOldVersions()` function for version cleanup logic
  - Implement automatic cleanup using pure file system operations
  - Add maintenance commands using pure cleanup functions
  - Implement resource cleanup using pure process management functions
  - Add logging using pure log formatting functions
  - [strictly follow Agent Guidelines](../../../AGENTS.md)
  - _Requirements: 4.3_
  