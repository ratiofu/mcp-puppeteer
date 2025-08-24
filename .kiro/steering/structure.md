# Project Structure

## Root Directory
```
├── src/                    # Source code
├── dist/                   # Compiled JavaScript and type definitions
├── .kiro/                  # Kiro IDE configuration
├── .vscode/                # VS Code settings
├── .git/                   # Git repository
├── node_modules/           # Dependencies (pnpm)
├── package.json            # Project manifest
├── pnpm-lock.yaml         # Dependency lock file
├── tsconfig.json          # TypeScript configuration
├── .editorconfig          # Code formatting rules
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation
├── AGENTS.md              # AI agent guidance
└── LICENSE                # MIT license
```

## Source Code Organization (`src/`)
- **`index.ts`** - Main entry point, pipe transport server setup, session management
- **`PuppeteerMcpServer.ts`** - Core MCP server implementation with browser tools
- **`initBrowser.ts`** - Browser initialization and connection logic

## Build Output (`dist/`)
- **`index.js`** - Single bundled and minified JavaScript file (ESM, Node.js 22+)
- Generated via `pnpm run build` (uses `esbuild.config.js`)
- **Not committed to git** - Added to `.gitignore` (NPM publishing best practice)
- **Built automatically** - `prepublishOnly` script ensures fresh build before publishing

## Build Configuration (`esbuild.config.js`)
- **Entry point**: `src/index.ts`
- **Bundle settings**: Platform node, target node22, ESM format
- **Minification**: Enabled for production builds
- **External dependencies**: All runtime dependencies excluded from bundle

## Code Organization Patterns

### File Naming Style Guide
- **Primary Export Rule**: TypeScript files must be named after their primary export
- **Class Files**: Use PascalCase matching the class name (`PuppeteerMcpServer.ts` exports `PuppeteerMcpServer`)
- **Function Files**: Use camelCase matching the primary function (`initBrowser.ts` exports `initBrowser`)
- **Index Files**: Use `index.ts` for re-export files and main entry points
- **Multi-export Files**: Use descriptive names for files with multiple related exports (e.g., `test-helpers.ts`)
- **Import Extensions**: Include `.ts` extensions in imports (required for ESNext modules)

### Module Structure
- Each file should have a single primary export
- Use named exports for utilities and types
- Import with explicit `.js` extensions for local modules (required for compiled output)
- Use `.js` extensions when importing from `@modelcontextprotocol/sdk`

### Class Organization
- Constructor sets up core dependencies and session state
- Tool definitions follow the pattern: name, description, schema, handler
- Private methods for internal logic (e.g., `setupConsoleListener`)
- Cleanup methods for resource management (e.g., `disconnect`)



## Development Conventions
- Session-based architecture with proper cleanup
- Zod schemas for all tool input validation
- Error handling with `isError` flags in tool responses
- Console logging includes session IDs for traceability

## Extension Points
- Add new MCP tools in `PuppeteerMcpServer.ts`
- Modify browser initialization in `src/initBrowser.ts`
- Extend transport options in `src/index.ts`
- Add additional functionality in `src/index.ts`

## Operational Security Recommendations
- Run in isolated environments for production use
- Monitor resource usage (memory, CPU, browser processes)
- Implement rate limiting for production deployments
- Consider sandboxing browser instances
- Log security-relevant events (navigation, clicks)