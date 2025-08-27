# Technology Stack

## Runtime & Language
- **Node.js** with ESNext modules
- **TypeScript** with strict mode
- **esbuild** for compilation and bundling (no ts-node)

## Core Dependencies
- **puppeteer-core** - Browser automation (no bundled browser)
- **@modelcontextprotocol/sdk** - MCP protocol implementation
- **zod** - Input validation and schema definition (version compatibility critical)

## Package Management
- **pnpm** - Primary package manager
- Uses `pnpm-lock.yaml` for dependency locking

## Prerequisites
- Node.js 22+ (use `nvm use` to switch to project version)
- pnpm package manager
- Chromium browser with remote debugging enabled

## Build System
- **Type Checking**: TypeScript compiler validates types without emitting files
- **Development**: Build and run compiled JavaScript (no ts-node)
- **Production**: Uses esbuild for fast JavaScript bundling
- **Output**: Single bundled `dist/index.js` file
- **Target**: Node.js 22+ with ESM modules
- **Externals**: Dependencies like puppeteer-core, MCP SDK remain external
- **No type declarations**: Runtime-only package, no TypeScript definitions generated

## Code Quality Tools
- **Biome**: Fast linter and formatter for JavaScript/TypeScript
- **Configuration**: `biome.json` with strict rules and formatting standards
- **Integration**: Runs automatically in quality pipeline and build process
- **Auto-fix**: `pnpm run lint:fix` applies automatic fixes where possible

## Common Commands

### Setup
```bash
# Install dependencies
pnpm install
```

### Development
```bash
# Run full quality pipeline (type check, lint, format, test coverage)
pnpm run quality

# Individual quality checks
pnpm run typecheck    # Type check TypeScript code
pnpm run lint         # Check code with Biome linter
pnpm run lint:fix     # Auto-fix linting and formatting issues

# Build and start the MCP server (includes quality checks)
pnpm run build
pnpm run start

# Development with watch mode
pnpm run dev

# Start Chromium with remote debugging (required)
chromium --remote-debugging-port=9222
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

# Run tests with coverage reporting (REQUIRED)
pnpm run test:coverage

# Use MCP Inspector for interactive testing
pnpx @modelcontextprotocol/inspector node dist/index.js
```

## Configuration
- **Server Port**: 7742 (hardcoded)
- **Chromium Debug Port**: 9222 (expected)
- **Transport**: Standard I/O (stdio) for MCP protocol
- **Session Management**: In-memory with automatic cleanup

## Code Quality Standards
- **Linting**: Biome with strict rules for correctness, style, and security
- **Formatting**: Biome formatter with consistent style enforcement
- **Indentation**: 2 spaces, line width 100 characters
- **Quotes**: Single quotes, semicolons as needed, trailing commas always
- **Import organization**: Automatic via Biome assist actions
- **Type Safety**: TypeScript strict mode, no `any` types allowed
- **Exports**: Prefer named exports over default exports (enforced by Biome)

## Development Best Practices
- Use Zod for input validation
- Implement proper error handling with `isError` flags
- Maintain session isolation between concurrent users
- Clean up resources (pages, intervals) on disconnect
- Console logging includes session IDs for traceability
- Run `pnpm run quality` before committing changes
- Use Biome ignore comments sparingly and with clear justification

## AI Agent Development
- Follow AI-specific development guidelines in root `AGENTS.md`
- Use `pnpm vitest run --coverage <target>` for targeted testing during development
- Run `pnpm run quality` only at task completion

## Test Coverage Best Practices
- **Always run tests with coverage**: Use `pnpm run test:coverage` instead of `pnpm test`
- **Maintain 80% threshold**: Lines, functions, branches, and statements must be ≥80%
- **Target specific lines**: Focus on uncovered lines shown in coverage reports
- **Test edge cases**: Ensure error paths and boundary conditions are covered

## MCP Protocol Compatibility
- **Zod Version**: MCP SDK requires Zod ^3.23.8, not Zod 4.x
- **Schema Definition**: Use `z.string().url()` instead of `z.url()` for URL validation
- **Tool Parameter Schemas**: Ensure Zod schemas convert properly to JSON Schema for MCP clients
- **Testing**: Verify tool schemas appear correctly in `tools/list` responses

## Testing Infrastructure

### Unit Testing with Vitest
- **Test Framework**: Vitest with v8 coverage provider
- **Test Location**: `src/**/_tests/**/*.test.ts` pattern
- **Coverage Reports**: Text, LCOV formats (no HTML in CI)
- **Coverage Thresholds**: 80% for lines, functions, branches, and statements
- **Test Environment**: Node.js with global test functions enabled
- **Timeouts**: 10s for tests, 5s for hooks (optimized for browser operations)
- **Parallel Execution**: Up to 4 threads with session isolation
- **Global Setup**: Chromium cleanup and test environment preparation

### Coverage Analysis
- **LCOV Report**: `coverage/lcov.info` for CI/CD integration and detailed line-by-line analysis
- **Console Output**: Real-time coverage summary during test runs
- **Quality Pipeline**: Coverage runs automatically as part of `pnpm run quality`
- **Exclusions**: Test files, setup files, and CLI entrypoint excluded from coverage

### Coverage Validation & Analysis
```bash
# Run full quality pipeline (includes coverage)
pnpm run quality

# Run tests with coverage only
pnpm run test:coverage

# Analyze LCOV report for specific uncovered lines
grep -A 5 -B 5 "DA:.*,0" coverage/lcov.info

# Target specific test files during development
npx vitest run src/specific-module/_tests/
```

### Quality-Driven Development Workflow
1. **Run quality pipeline**: `pnpm run quality` (type check + lint + format + coverage)
2. **Analyze results**: Review console output for failures
3. **Fix issues**: Use `pnpm run lint:fix` for auto-fixable problems
4. **Target coverage gaps**: Focus on files below 80% threshold
5. **Iterative testing**: Use `npx vitest run path/to/specific/test` for focused development
6. **Repeat until all checks pass**

## Testing Approach

### Manual Testing Process
1. Start Chromium with remote debugging: `--remote-debugging-port=9222`
2. Build and run the server: `pnpm run dev` (or `pnpm run build && pnpm run start`)
3. Use MCP Inspector to test tools: `pnpx @modelcontextprotocol/inspector node dist/index.js`

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
- MCP Inspector provides interactive testing via stdio transport
- Comprehensive error handling with detailed error messages