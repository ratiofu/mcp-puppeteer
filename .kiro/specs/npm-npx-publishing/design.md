# Design Document

## Overview

This design enables publishing the Puppeteer MCP Server to NPM with full `npx` support, allowing users to run the server directly without manual installation. The solution maintains the current pipe transport architecture while adding proper NPM packaging, CLI argument handling, and local testing capabilities.

## Architecture

### Current Architecture
The server currently uses:
- **Pipe Transport**: stdin/stdout communication via `StdioServerTransport`
- **Single Session**: One browser session per server process  
- **esbuild Bundling**: Compiles to single `dist/index.js` file
- **Puppeteer Core**: Browser automation without bundled browsers

### NPM Publishing Architecture
The NPM package will:
- **Binary Entry Point**: Use `bin` field in package.json to enable `npx` execution
- **Executable Script**: Add shebang to compiled output for direct execution
- **MCP Configuration**: Provide clear examples for MCP client configuration
- **Error Handling**: Provide user-friendly error messages for Chrome setup issues

## Components and Interfaces

### Package Configuration (`package.json`)
```json
{
  "name": "@ratiofu/mcp-puppeteer",
  "bin": {
    "mcp-puppeteer": "./bin/mcp-puppeteer"
  },
  "engines": {
    "node": ">=22.0.0"
  },
  "files": [
    "dist/",
    "bin/",
    "README.md",
    "LICENSE"
  ]
}
```

### Entry Point (`bin/mcp-puppeteer`)
- **Executable Script**: Separate bin script with shebang for npx execution
- **Module Import**: Imports and executes the main dist/index.js file
- **Clean Separation**: Keeps main JavaScript file pure without shebang

### Main Server (`src/index.ts`)
- **Startup Messages**: Clear logging for connection status
- **Error Messages**: Provide actionable guidance for Chrome setup
- **Pure Module**: Remains a standard JavaScript module without executable concerns

### Local Testing Infrastructure
- **npm pack**: Create local tarball for testing
- **Test Script**: Automated validation of npx workflow with comprehensive test scenarios
- **Local Publish Script**: Automated build, pack, and global install workflow
- **Local Cleanup Script**: Automated uninstall and artifact removal
- **Cross-platform Timeout**: Portable timeout handling using background processes for macOS compatibility
- **NPM Scripts Integration**: Package.json scripts for easy access to local testing workflows

## Data Models

### Package Metadata
```typescript
interface PackageInfo {
  name: string;
  version: string;
  description: string;
  repository: string;
}
```

### MCP Configuration Example
```json
{
  "mcpServers": {
    "puppeteer-control": {
      "command": "npx",
      "args": ["@ratiofu/mcp-puppeteer"]
    }
  }
}
```

## Error Handling

### Chrome Connection Errors
- **No Debug Port**: Detect when Chrome isn't running with remote debugging
- **Connection Refused**: Provide setup instructions for Chrome launch
- **Clear Error Messages**: Log helpful guidance to stderr for MCP client users

### NPM/npx Errors  
- **Node Version**: Ensure compatibility with Node.js 22+
- **Permission Issues**: Handle NPM installation and execution permissions
- **Network Errors**: Handle NPM registry connection issues during npx execution

## Testing Strategy

### Local NPM Testing
1. **Build Package**: Run `pnpm run build` to create dist/
2. **Pack Locally**: Use `npm pack` to create tarball
3. **Install Globally**: Test with `npm install -g ./puppeteer-mcp-*.tgz`
4. **Test npx**: Validate `npx puppeteer-mcp` execution
5. **Cleanup**: Remove global installation and tarball

### Local Testing Scripts

#### Local Publish Script (`scripts/local-publish.sh`)
```bash
#!/bin/bash
# Builds, packs, and installs the server locally for testing
# Includes cleanup of existing versions and fresh package creation
```

#### Local Cleanup Script (`scripts/local-cleanup.sh`)  
```bash
#!/bin/bash
# Removes locally installed package and all test artifacts
# Ensures clean state between test runs
```

#### Automated Testing Script (`test/test-npx.sh`)
```bash
#!/bin/bash
# Comprehensive npx workflow validation with:
# - Package structure validation
# - npx execution testing
# - Startup message verification
# - Stdio transport confirmation
# - Error handling validation
# - Cross-platform timeout handling
```

#### Cross-Platform Timeout Function
```bash
# Portable timeout implementation for macOS compatibility
run_with_timeout() {
    local timeout_duration=$1
    shift
    "$@" &
    local pid=$!
    sleep "$timeout_duration"
    kill $pid 2>/dev/null || true
    wait $pid 2>/dev/null || true
}
```

### Integration Testing
- **MCP Inspector**: Validate tools work after npx installation
- **Client Configuration**: Test with actual MCP clients like Cursor
- **Cross-Platform**: Verify on macOS, Linux, and Windows

## Implementation Plan

### Phase 1: Package Configuration
- Update package.json with bin field and engines
- Configure files array to include only necessary assets
- Add proper keywords and metadata for NPM discovery

### Phase 2: Executable Script Creation
- Create separate bin/mcp-puppeteer script with shebang
- Implement module import to execute main dist/index.js
- Ensure executable permissions and proper file structure

### Phase 3: Entry Point Enhancement
- Improve startup messages for better user experience
- Add Chrome setup validation and error guidance
- Ensure main module works in all contexts (direct execution, import, npx)

### Phase 4: Local Testing Infrastructure
- Create automated test script for npx workflow
- Add npm pack testing to validate package structure
- Implement cleanup utilities for test artifacts

### Phase 5: Documentation and Publishing
- Update README with npx usage instructions and MCP configuration examples
- Add troubleshooting guide for Chrome setup issues
- Publish to NPM registry with proper versioning

## Security Considerations

### Package Security
- **Minimal Files**: Only include dist/, bin/, README.md, LICENSE in package
- **No Secrets**: Ensure no sensitive data in published package
- **Dependency Audit**: Validate all dependencies are secure

### Runtime Security  
- **Stdio Transport**: Uses stdin/stdout, no network binding required
- **Process Isolation**: Each npx execution runs in separate process
- **Chrome Isolation**: Browser sessions isolated per server instance

## Performance Considerations

### Package Size
- **Bundled Output**: Single minified JavaScript file reduces install time
- **External Dependencies**: Keep runtime dependencies external to avoid bloat
- **Selective Files**: Only include necessary files in NPM package

### Startup Performance
- **Fast Initialization**: Minimize startup time for better npx experience
- **Lazy Loading**: Load heavy dependencies only when needed
- **Error Fast-Fail**: Quick validation of prerequisites before heavy initialization