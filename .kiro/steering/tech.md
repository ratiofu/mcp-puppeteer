# Technology Stack

## Runtime & Language
- **Node.js** with ESNext modules
- **TypeScript** with strict mode
- **ts-node** for runtime execution (no compilation step)

## Core Dependencies
- **puppeteer-core** - Browser automation (no bundled browser)
- **express** - HTTP server and routing
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **zod** - Input validation and schema definition (version compatibility critical)

## Package Management
- **pnpm** - Primary package manager
- Uses `pnpm-lock.yaml` for dependency locking

## Prerequisites
- Node.js 22+ (use `nvm use` to switch to project version)
- pnpm package manager
- Chrome browser with remote debugging enabled

## Build System
- **Type Checking**: TypeScript compiler validates types without emitting files
- **Development**: Build and run compiled JavaScript (no ts-node)
- **Production**: Uses esbuild for fast JavaScript bundling
- **Output**: Single bundled `dist/index.js` file
- **Target**: Node.js 22+ with ESM modules
- **Externals**: Dependencies like puppeteer-core, express, MCP SDK remain external
- **No type declarations**: Runtime-only package, no TypeScript definitions generated

## Common Commands

### Setup
```bash
# Install dependencies
pnpm install
```

### Development
```bash
# Type check TypeScript code
pnpm run typecheck

# Build and start the MCP server (includes type checking)
pnpm run build
pnpm run start

# Or build and start in one command (development)
pnpm run dev

# Start Chrome with remote debugging (required)
open -a "Google Chrome" --args --remote-debugging-port=9222
```

### NPM Publishing
```bash
# Publish to NPM (automatically builds via prepublishOnly)
npm publish

# Test package locally
npm pack
```

### Testing
```bash
# Run unit tests with vitest
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage reporting
pnpm run test:coverage

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

### Build Configuration
- **esbuild**: Bundles and minifies JavaScript targeting Node.js 22+ with ESM
- **Configuration**: `esbuild.config.js` contains all build settings
- **Externals**: All dependencies remain external (not bundled)
- **Output**: Single minified `index.js` in dist folder
- **Minification**: Enabled for smaller bundle size
- **No source maps**: Optimized for NPM publishing
- **No type declarations**: Runtime-only server package

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

### MCP Protocol Compatibility
- **Zod Version Compatibility**: The MCP SDK requires Zod ^3.23.8, not Zod 4.x
- **Schema Definition**: Use `z.string().url()` instead of `z.url()` for URL validation in Zod 3.x
- **Tool Parameter Schemas**: Ensure Zod schemas are properly converted to JSON Schema for MCP clients
- **Version Conflicts**: Always check MCP SDK dependencies when updating Zod versions
- **Testing**: Verify tool schemas appear correctly in `tools/list` responses after Zod changes

## Testing Infrastructure

### Unit Testing with Vitest
- **Test Framework**: Vitest with v8 coverage provider
- **Test Location**: `src/**/_tests/**/*.test.ts` pattern
- **Coverage Reports**: Text, LCOV, HTML, and JSON formats
- **Coverage Thresholds**: 80% for lines, functions, branches, and statements
- **Test Environment**: Node.js with global test functions enabled
- **Timeouts**: 30s for tests, 5s for hooks (optimized for browser operations)

### Coverage Analysis
- **JSON Report**: `coverage/coverage-final.json` for programmatic analysis
- **LCOV Report**: `coverage/lcov.info` for CI/CD integration
- **HTML Report**: `coverage/lcov-report/index.html` for browser viewing
- **Console Output**: Real-time coverage summary during test runs

### Coverage Validation
```bash
# Check if coverage meets thresholds programmatically
if [ -f "coverage/coverage-final.json" ]; then
  echo "Coverage report available for analysis"
  # Parse JSON for automated checks - structure includes:
  # - Per-file coverage data with statement/branch/function maps
  # - Line-by-line coverage tracking
  # - Branch coverage analysis for conditional logic
  # - Function coverage with execution counts
fi

# Example: Extract overall coverage percentage from JSON
# The JSON contains detailed per-file coverage data that can be
# programmatically analyzed for CI/CD pipeline integration
```

## Testing Approach

### Manual Testing Process
1. Start Chrome with remote debugging: `--remote-debugging-port=9222`
2. Build and run the server: `pnpm run dev` (or `pnpm run build && pnpm run start`)
3. Use MCP Inspector to test tools: `pnpx @modelcontextprotocol/inspector`
4. Connect to: `http://localhost:7742/sse`

### Integration Testing
- Test each MCP tool individually
- Verify screenshot capture returns base64 PNG data
- Confirm console logging captures browser output
- Validate session cleanup on disconnect
- **Schema Validation**: Test `tools/list` response to ensure parameter schemas are properly exposed
- **Parameter Testing**: Verify tool calls work with required parameters (e.g., navigate with URL)

### Common Test Scenarios
- Navigate to different websites
- Click various UI elements
- Take screenshots of different page states
- Extract HTML from dynamic content
- Monitor console output during interactions

## Cross-Platform Considerations

### Process Management and Timeouts
- **macOS**: Use background processes with `sleep` and `kill` for timeouts (avoid `timeout` command)
- **Linux**: Can use `timeout` command if available, fallback to background process approach
- **Cross-platform scripts**: Always check for command availability or use portable alternatives

### Portable Timeout Pattern
```bash
# Instead of timeout command, use this pattern:
command_to_run &
PID=$!
sleep 5
kill $PID 2>/dev/null || true
wait $PID 2>/dev/null || true
```

### Command Availability Checks
```bash
# Check if command exists before using
if command -v timeout >/dev/null 2>&1; then
    timeout 5s your_command
else
    # Fallback approach
    your_command &
    PID=$!
    sleep 5
    kill $PID 2>/dev/null || true
fi
```

## Debugging
- Console logs include session IDs for tracing
- Browser console output captured and retrievable
- MCP Inspector provides interactive testing
- Express server logs HTTP requests