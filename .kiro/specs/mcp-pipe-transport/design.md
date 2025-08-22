# Design Document

## Overview

The conversion from SSE to pipe transport involves replacing the Express HTTP server with a direct stdin/stdout pipe connection using `StdioServerTransport` from the MCP SDK. The existing CLI implementation (`src/cli.ts`) already demonstrates this pattern and will serve as the foundation for the new main server implementation.

## Architecture

### Current Architecture (SSE)
```
Client → HTTP Request → Express Server → SSEServerTransport → PuppeteerMcpServer → Browser
```

### New Architecture (Pipe)
```
Client → stdin/stdout → StdioServerTransport → PuppeteerMcpServer → Browser
```

### Key Changes
- Remove Express server and HTTP layer entirely
- Replace `SSEServerTransport` with `StdioServerTransport`
- Simplify session management to single-session model
- Use existing CLI implementation as the new main server

## Components and Interfaces

### Modified Components

#### `src/index.ts` (Complete Rewrite)
- **Current**: Express server with SSE endpoints and session management
- **New**: Simple initialization using `StdioServerTransport` pattern from CLI
- **Responsibilities**: Initialize browser, create transport, connect server

#### `package.json` Dependencies
- **Remove**: `express`, `@types/express`
- **Move**: `@modelcontextprotocol/sdk` from devDependencies to dependencies
- **Keep**: All other dependencies unchanged

### Unchanged Components

#### `src/PuppeteerMcpServer.ts`
- No changes required - already compatible with any transport
- Session management simplified to single session per process

#### `src/puppeteer.ts`
- No changes required - browser initialization remains the same

#### `src/cli.ts`
- Removed - functionality incorporated into main server with enhancements

## Data Models

### Session Management Simplification

#### Current Model (Multi-session)
```typescript
const sessions = new Map<string, { transport: SSEServerTransport, server: PuppeteerMcpServer }>();
```

#### New Model (Single-session)
```typescript
// Single server instance per process
const server = new PuppeteerMcpServer(sessionId, browser);
```

### Transport Connection

#### Current (SSE)
```typescript
const transport = new SSEServerTransport("/mcp", res);
server.connect(transport);
```

#### New (Pipe)
```typescript
const transport = new StdioServerTransport();
server.connect(transport);
```

## Error Handling

### Process Management
- **Startup Errors**: Log to stderr and exit with non-zero code
- **Runtime Errors**: Handle via MCP error responses, continue operation
- **Shutdown**: Graceful cleanup of browser resources on process termination

### Browser Connection
- **Connection Failure**: Exit process with error message
- **Runtime Browser Errors**: Return error responses via MCP tools
- **Page Cleanup**: Automatic cleanup when process exits

## Build System

### esbuild Bundling
- **Output Directory**: `dist/` folder for bundled JavaScript
- **Build Script**: `pnpm run build` performs type checking then bundles with esbuild
- **Entry Point**: `dist/index.js` as the single bundled executable
- **Minification**: Enabled for production optimization
- **External Dependencies**: All runtime dependencies remain external (not bundled)

### Package Scripts
```json
{
  "scripts": {
    "build": "pnpm run typecheck && rm -rf dist && node esbuild.config.js",
    "typecheck": "tsc --noEmit",
    "start": "node dist/index.js",
    "test": "./test/test-server.sh",
    "dev": "concurrently \"esbuild --watch\" \"nodemon --watch dist --exec 'node dist/index.js && pnpm run restart-inspector' dist/index.js\"",
    "inspector": "npx @modelcontextprotocol/inspector node dist/index.js",
    "restart-inspector": "pkill -f '@modelcontextprotocol/inspector' || true && sleep 1 && pnpm run inspector &",
    "prepublishOnly": "pnpm run build"
  }
}
```

### Development Dependencies
- **Add**: `esbuild` for fast JavaScript bundling
- **Add**: `nodemon` for auto-restart on file changes
- **Add**: `concurrently` for running multiple commands simultaneously
- **Remove**: `ts-node` (replaced with esbuild workflow)
- **Remove**: `express`, `@types/express` (HTTP layer removed)
- **Move**: `@modelcontextprotocol/sdk` from devDependencies to dependencies
- **Keep**: `typescript` for type checking only (no compilation)

### Development Workflow
- **File Watching**: `esbuild --watch` monitors TypeScript files for changes and rebuilds
- **Auto-restart**: `nodemon` restarts server when bundled files change
- **Inspector Auto-restart**: `restart-inspector` script kills existing inspector and starts new one
- **Concurrent Development**: `pnpm run dev` runs esbuild watcher, server, and inspector with full auto-restart
- **Production**: `pnpm run build` creates minified bundle for deployment

### Build Configuration
- **esbuild Target**: Node.js 22+ for modern performance
- **TypeScript Config**: Type checking only with `noEmit: true`
- **Bundle Format**: ESM modules for Node.js
- **Minification**: Enabled for production builds
- **External Dependencies**: All runtime deps excluded from bundle

## Testing Strategy

### Automated Testing Process
1. **Type Check**: `pnpm run typecheck` validates TypeScript types
2. **Build**: `pnpm run build` bundles application with esbuild
3. **Automated Test Script**: `pnpm run test` executes `test/test-server.sh` for MCP protocol validation
4. **Inspector Testing**: `npx @modelcontextprotocol/inspector node dist/index.js`
5. **Tool Validation**: Test all MCP tools through Inspector interface
6. **Integration Testing**: Verify browser automation works end-to-end

### Test Script (`test/test-server.sh`)
- **Build Validation**: Automatically builds the server before testing
- **MCP Initialize**: Tests server response to MCP initialize protocol
- **Tools Listing**: Validates all expected tools are available (navigate, list_tab_urls, click, take_screenshot, get_html, get_console)
- **Chrome Detection**: Provides clear instructions if Chrome/Chromium isn't running with debug port
- **No External Dependencies**: Uses only shell built-ins, no jq or other tools required
- **Quick Feedback**: Completes in seconds with clear pass/fail results

### Development Testing Process
1. **Full Auto-restart Development**: Use `pnpm run dev` for auto-rebuild, server restart, and inspector restart
2. **Manual Testing**: Use `pnpm run inspector` for one-time testing
3. **Inspector Restart**: Use `pnpm run restart-inspector` to manually restart inspector
4. **Production Testing**: Use `pnpm run build && pnpm start` for final testing
5. **Browser Testing**: Verify Chrome connection and all tools work

### Integration Points
- **MCP Client Compatibility**: Test with MCP Inspector and other clients
- **Browser Lifecycle**: Verify proper browser page management
- **Error Scenarios**: Test browser connection failures and recovery
- **Build Process**: Ensure compilation works and output is executable

## Documentation Updates

### Files Requiring Updates
- **README.md**: Update setup instructions, remove HTTP server references
- **AGENTS.md**: Update agent guidance with new commands and architecture
- **package.json**: Update main entry point and scripts

### Content Changes
- **Setup Instructions**: Replace `pnpm start` with `pnpm run build && pnpm start`
- **Testing Instructions**: Update to use `npx @modelcontextprotocol/inspector node dist/index.js`
- **Architecture Description**: Remove Express server and HTTP transport references
- **Build System**: Document esbuild-based bundling and type checking workflow
- **Usage Examples**: Show pipe transport instead of HTTP endpoints

### Validation Criteria
- TypeScript type checking passes without errors
- esbuild bundles successfully to `dist/index.js`
- `node dist/index.js` starts successfully and accepts MCP messages
- All existing MCP tools function identically via Inspector
- No HTTP ports are opened during operation
- Process exits cleanly on disconnect
- Bundle size is optimized and minified
- Memory usage is lower than HTTP version
- Documentation accurately reflects new architecture and commands