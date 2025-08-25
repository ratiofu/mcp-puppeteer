# Implementation Plan

- [ ] 1. Extract and refactor existing test utilities into shared modules
  - Extract `findChromiumExecutable()` function from test utilities to shared `src/browser-discovery/` module
  - Create `BrowserInstallation` class with launch, verify, and getExecutableInfo methods
  - Add support for `DISABLE_LOCAL_CHROMIUM_DISCOVERY` environment variable in discovery logic
  - Write unit tests for extracted browser discovery functionality
  - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [ ] 2. Implement Browser Discovery Service with system and managed browser detection
  - Create `BrowserDiscoveryService` class that implements discovery interface
  - Implement `discoverBrowsers()` method to find all available Chromium installations
  - Implement `findBestBrowser()` method with version filtering and local discovery skip option
  - Implement `checkRunningBrowser()` method to detect browsers with debug ports
  - Write unit tests for browser discovery service with mocked file system operations
  - _Requirements: 1.1, 1.2, 4.5, 6.1, 6.6_

- [ ] 3. Create Chrome for Testing API integration module
  - Create `ChromeForTestingAPI` service to fetch available browser versions
  - Implement `getAvailableVersions()` method returning `BrowserVersion[]` with kind='chromium'
  - Add platform detection for macOS (mac_x64, mac_arm64) and Linux (linux64)
  - Implement download functionality with progress tracking and error handling
  - Write unit tests with mocked HTTP requests for API integration
  - _Requirements: 4.6, 5.2_

- [ ] 4. Implement Browser Manager Service for installation and lifecycle management
  - Create `BrowserManagerService` class with installation capabilities
  - Implement `installChromium()` method using Chrome for Testing API
  - Create managed installation directory structure in `~/.puppeteer-mcp/chromium/`
  - Implement `cleanupOldVersions()` method for maintenance
  - Add installation verification by launching browser with remote debugging
  - Write unit tests for browser manager with temporary directories
  - _Requirements: 4.1, 4.2, 4.4, 4.6_

- [ ] 5. Create Version Inspector Service for requirements and compatibility checking
  - Create `VersionInspectorService` class for version management
  - Implement `getVersionRequirement()` method to read chromium.version files
  - Implement `checkCompatibility()` method for version comparison logic
  - Add bundled version reading capability for MCP server
  - Write unit tests for version parsing and compatibility checking
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 6. Add new MCP tools for browser management
  - Add `install_browser` MCP tool that uses Browser Manager Service
  - Implement tool input validation with Zod schemas for version parameters
  - Add proper error handling with installation guidance messages
  - Write integration tests for MCP tool functionality
  - _Requirements: 2.9, 4.4_

- [ ] 7. Add new MCP resources for browser status and version information
  - Create `browser://status` resource exposing installation and compatibility status
  - Create `browser://versions` resource listing available versions from Chrome for Testing API
  - Implement status checking with next steps recommendations (install, upgrade, none)
  - Add version requirement vs installed version reporting
  - Write unit tests for resource content generation
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Integrate auto-discovery with existing MCP server startup
  - Modify MCP server initialization to attempt browser discovery on startup
  - Add automatic connection to running Chromium instances with remote debugging
  - Implement fallback to managed Chromium installation when no running instance found
  - Add version requirement checking against chromium.version file during startup
  - Write integration tests for server startup with various browser availability scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9. Create CLI executable with MCP client protocol communication
  - Create separate CLI entry point that starts and communicates with MCP server
  - Implement MCP client protocol connection and tool invocation
  - Add command line argument parsing for `list|l`, `install|i`, `update-expected-version|u`, `help`
  - Implement interactive mode when no command is provided
  - Write unit tests for CLI argument parsing and MCP client communication
  - _Requirements: 2.1, 2.2, 2.7, 2.9_

- [ ] 10. Implement CLI list command with Clack UI
  - Create `list` command (short form `l`) that queries available versions via MCP
  - Implement Clack-based interactive UI for version selection
  - Add version display with current, latest, and compatibility information
  - Write unit tests for list command functionality
  - _Requirements: 2.1_

- [ ] 11. Implement CLI install command with version selection
  - Create `install` command (short form `i`) with optional version parameter
  - Add `--force-latest` and `-f` flags for non-interactive latest version installation
  - Implement version selection UI when no version specified (unless force flags used)
  - Add installation progress feedback and error handling
  - Write unit tests for install command with various flag combinations
  - _Requirements: 2.2, 2.3_

- [ ] 12. Implement CLI update-expected-version command for project version files
  - Create `update-expected-version` command (short form `u`) for chromium.version file management
  - Add repo root detection to ensure command only works in project repositories
  - Implement `--force-latest` and `-f` flags for automatic latest version updates
  - Add version selection UI when no version specified (unless force flags used)
  - Write unit tests for version file updates and repo root detection
  - _Requirements: 2.4, 2.5, 3.4_

- [ ] 13. Add CLI integration with version file management
  - Implement automatic chromium.version file update prompts when CLI runs from repo root
  - Add version file creation when missing in project repositories
  - Ensure CLI has exclusive write access to chromium.version files
  - Write integration tests for CLI version file management workflows
  - _Requirements: 2.8, 3.4_

- [ ] 14. Implement comprehensive error handling and user guidance
  - Add detailed error messages for browser unavailable scenarios (not found, incompatible, launch failed)
  - Implement installation guidance with specific remediation steps
  - Add retry mechanisms for download failures with fallback options
  - Create user-friendly error responses for all MCP tools and CLI commands
  - Write unit tests for error handling scenarios
  - _Requirements: 1.3, 3.3_

- [ ] 15. Add cleanup and maintenance features
  - Implement automatic cleanup of old browser versions during installation
  - Add maintenance commands for removing unused installations
  - Implement proper resource cleanup for browser processes and temporary files
  - Add logging and monitoring for installation and cleanup operations
  - Write unit tests for cleanup functionality
  - _Requirements: 4.3_