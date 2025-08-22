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

#### `src/server.ts` (Complete Rewrite)
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
- Keep as reference implementation
- May be removed or kept as alternative entry point

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

### TypeScript Compilation
- **Output Directory**: `dist/` folder for compiled JavaScript
- **Build Script**: `pnpm run build` compiles TypeScript to JavaScript
- **Entry Point**: `dist/server.js` as the main executable
- **Source Maps**: Include source maps for debugging

### Package Scripts
```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "start": "node dist/server.js",
    "dev": "concurrently \"tsc --watch\" \"nodemon --watch dist --exec 'node dist/server.js && pnpm run restart-inspector' dist/server.js\"",
    "inspector": "npx @modelcontextprotocol/inspector node dist/server.js",
    "restart-inspector": "pkill -f '@modelcontextprotocol/inspector' || true && sleep 1 && pnpm run inspector &"
  }
}
```

### Development Dependencies
- **Add**: `nodemon` for auto-restart on file changes
- **Add**: `concurrently` for running multiple commands simultaneously
- **Remove**: `ts-node` (replaced with build + watch workflow)
- **Remove**: `express`, `@types/express` (HTTP layer removed)
- **Move**: `@modelcontextprotocol/sdk` from devDependencies to dependencies

### Development Workflow
- **File Watching**: `tsc --watch` monitors TypeScript files for changes
- **Auto-restart**: `nodemon` restarts server when compiled files change
- **Inspector Auto-restart**: `restart-inspector` script kills existing inspector and starts new one
- **Concurrent Development**: `pnpm run dev` runs TypeScript compiler, server, and inspector with full auto-restart

### TypeScript Configuration
- **Target**: ES2022 for Node.js compatibility
- **Module**: ESNext with Node resolution
- **Output**: Emit to `dist/` directory
- **Source Maps**: Enable for debugging

## Testing Strategy

### Automated Testing Process
1. **Build**: `pnpm run build` compiles TypeScript to JavaScript
2. **Inspector Testing**: `pnpm run inspector` launches MCP Inspector with compiled server
3. **Tool Validation**: Test all MCP tools through Inspector interface
4. **Integration Testing**: Verify browser automation works end-to-end

### Development Testing Process
1. **Full Auto-restart Development**: Use `pnpm run dev` for auto-recompile, server restart, and inspector restart
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
- **Testing Instructions**: Update to use `pnpm run test` with MCP Inspector
- **Architecture Description**: Remove Express server and HTTP transport references
- **Usage Examples**: Show pipe transport instead of HTTP endpoints

### Validation Criteria
- TypeScript compiles without errors to `dist/` folder
- `node dist/server.js` starts successfully and accepts MCP messages
- All existing MCP tools function identically via Inspector
- No HTTP ports are opened during operation
- Process exits cleanly on disconnect
- Memory usage is lower than HTTP version
- Documentation accurately reflects new architecture and commands