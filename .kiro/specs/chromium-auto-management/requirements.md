# Requirements Document

## Introduction

This feature adds automatic Chromium discovery, installation, and management capabilities to the Puppeteer MCP Server. The system includes both server-side auto-discovery and a CLI tool for manual management. It automatically detects available Chromium, offers installation when missing, manages version requirements, and provides both interactive and headless operation modes.

## Requirements

### Requirement 1

**User Story:** As an MCP server user, I want automatic Chromium discovery and connection, so that the server works without manual browser setup.

#### Acceptance Criteria

1. WHEN the MCP server starts THEN it SHALL attempt to discover running Chromium instances with remote debugging enabled
2. WHEN no running instance is found THEN it SHALL attempt to launch managed Chromium installation
3. WHEN Chromium is unavailable THEN MCP tools SHALL return error messages with installation guidance
4. WHEN Chromium becomes available THEN the server SHALL automatically connect and enable browser tools
5. WHEN the server starts THEN it SHALL check installed Chromium version against `chromium.version` file requirements

### Requirement 2

**User Story:** As a developer, I want a CLI tool for Chromium management, so that I can control browser versions and installations locally.

#### Acceptance Criteria

1. WHEN the CLI is invoked with `list` command or `l` short form THEN it SHALL use MCP client protocol to query available versions and display them using Clack UI
2. WHEN the CLI is invoked with `install` command or `i` short form THEN it SHALL show version selection UI unless `--latest` or `--force-latest` (`-f`) is specified
3. WHEN `--force-latest` is used with install command THEN the CLI SHALL install the latest version without user interaction via MCP server
4. WHEN the CLI is invoked with `update-version` command or `u` short form THEN it SHALL update `chromium.version` file with selected version (only when run from repo root)
5. WHEN `--force-latest` is used with update-version command THEN the CLI SHALL update `chromium.version` file with latest version without user interaction
6. WHEN the CLI is invoked with `help` command THEN it SHALL print CLI help information
7. WHEN no command is provided THEN the CLI SHALL start in interactive mode allowing all commands to be executed via selection
8. WHEN CLI runs from within the repo AND version is selected THEN it SHALL offer to update `chromium.version` file
9. WHEN CLI functionality is equivalent to MCP tools and resources THEN the CLI SHALL use MCP client protocol to interact with the local MCP server (which it starts automatically), except for `chromium.version` file management which is CLI-exclusive

### Requirement 3

**User Story:** As a project maintainer, I want version requirements management, so that I can specify minimum Chromium versions for compatibility.

#### Acceptance Criteria

1. WHEN the project exists THEN a `chromium.version` file SHALL contain a simple version number (e.g., "120.0.6099.109")
2. WHEN the MCP server starts THEN it SHALL validate installed Chromium meets the minimum version requirement from `chromium.version` if present
3. WHEN installed version is below minimum THEN the system SHALL offer upgrade options but continue with available version
4. WHEN CLI updates are performed from repo root THEN it SHALL optionally update `chromium.version` file
5. WHEN version file is missing THEN the system SHALL operate without version constraints

### Requirement 4

**User Story:** As a developer, I want managed Chromium installation, so that browser management doesn't interfere with system browsers.

#### Acceptance Criteria

1. WHEN installing Chromium THEN it SHALL be placed in `~/.puppeteer-mcp/chromium/` directory
2. WHEN launching managed Chromium THEN it SHALL use isolated user data directories
3. WHEN multiple versions exist THEN the system SHALL maintain only compatible versions
4. WHEN installation completes THEN the system SHALL verify Chromium launches with remote debugging
5. WHEN both managed and system Chromium exist THEN the system SHALL use any available version (managed or system)
6. WHEN downloading Chromium THEN it SHALL use Chrome for Testing API for macOS and Linux binaries

### Requirement 5

**User Story:** As a system integrator, I want MCP resource status, so that I can programmatically check Chromium availability.

#### Acceptance Criteria

1. WHEN the MCP server runs THEN it SHALL provide a resource exposing Chromium installation status
2. WHEN the resource is queried THEN it SHALL return installation state, version info, and availability status
3. WHEN Chromium is unavailable THEN the resource SHALL indicate the specific reason and remediation steps
4. WHEN version mismatches exist THEN the resource SHALL report required vs installed versions

### Requirement 6

**User Story:** As a developer, I want existing test utilities productized, so that browser management code is reused between tests and application.

#### Acceptance Criteria

1. WHEN implementing browser discovery THEN existing `findChromiumExecutable()` logic SHALL be refactored for reuse
2. WHEN implementing Chromium launching THEN existing test launch utilities SHALL be extracted to shared modules
3. WHEN implementing version management THEN test utilities SHALL be generalized for production use
4. WHEN new browser management features are added THEN they SHALL be usable by both application and test code
5. WHEN refactoring occurs THEN existing test functionality SHALL remain intact
6. WHEN environment variable `DISABLE_LOCAL_CHROMIUM_DISCOVERY` is set THEN the system SHALL skip local browser discovery for testing purposes