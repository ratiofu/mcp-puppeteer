# Technology Stack

## Runtime & Language
- **Node.js** with ESNext modules
- **TypeScript** with strict mode
- **ts-node** for runtime execution (no compilation step)

## Core Dependencies
- **puppeteer-core** - Browser automation (no bundled browser)
- **express** - HTTP server and routing
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **zod** - Input validation and schema definition

## Package Management
- **pnpm** - Primary package manager
- Uses `pnpm-lock.yaml` for dependency locking

## Prerequisites
- Node.js (compatible with ESNext modules)
- pnpm package manager
- Chrome browser with remote debugging enabled

## Build System
- No build step required - uses ts-node for direct execution
- TypeScript configuration targets ESNext with NodeNext modules
- `noEmit: true` - runtime only, no compilation output

## Common Commands

### Setup
```bash
# Install dependencies
pnpm install
```

### Development
```bash
# Start the MCP server
pnpm run start

# Start Chrome with remote debugging (required)
open -a "Google Chrome" --args --remote-debugging-port=9222
```

### Testing
```bash
# Use MCP Inspector for interactive testing
pnpx @modelcontextprotocol/inspector
# Connect to: http://localhost:7742/sse
```

## Configuration
- **Server Port**: 7742 (hardcoded)
- **Chrome Debug Port**: 9222 (expected)
- **Transport**: Server-Sent Events (SSE) over HTTP
- **Session Management**: In-memory with automatic cleanup

## Code Style Guidelines

### TypeScript Configuration
- Target: ESNext with NodeNext modules
- Strict mode enabled
- Import TypeScript extensions allowed
- No emit (runtime via ts-node)

### Formatting Standards
- **Indentation**: 2 spaces (enforced by .editorconfig)
- **Line endings**: LF (Unix-style)
- **Charset**: UTF-8
- **Trailing whitespace**: Trimmed (except Markdown)
- **Final newline**: Required

### Development Best Practices
- Use Zod for input validation
- Implement proper error handling with `isError` flags
- Maintain session isolation between concurrent users
- Clean up resources (pages, intervals) on disconnect
- Session-based architecture with proper cleanup
- Console logging includes session IDs for traceability

## Testing Approach

### Manual Testing Process
1. Start Chrome with remote debugging: `--remote-debugging-port=9222`
2. Run the server: `pnpm run start`
3. Use MCP Inspector to test tools: `pnpx @modelcontextprotocol/inspector`
4. Connect to: `http://localhost:7742/sse`

### Integration Testing
- Test each MCP tool individually
- Verify screenshot capture returns base64 PNG data
- Confirm console logging captures browser output
- Validate session cleanup on disconnect

### Common Test Scenarios
- Navigate to different websites
- Click various UI elements
- Take screenshots of different page states
- Extract HTML from dynamic content
- Monitor console output during interactions

## Debugging
- Console logs include session IDs for tracing
- Browser console output captured and retrievable
- MCP Inspector provides interactive testing
- Express server logs HTTP requests