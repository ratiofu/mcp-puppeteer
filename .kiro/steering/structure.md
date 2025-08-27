# Project Structure

## Root Directory
```
├── src/                    # Source code
├── dist/                   # Compiled JavaScript (single bundle)
├── coverage/               # Test coverage reports
├── .kiro/                  # Kiro IDE configuration
├── .vscode/                # VS Code settings
├── .git/                   # Git repository
├── node_modules/           # Dependencies (pnpm)
├── package.json            # Project manifest
├── pnpm-lock.yaml         # Dependency lock file
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Test configuration
├── esbuild.config.js      # Build configuration
├── biome.json             # Code quality configuration
├── .editorconfig          # Code formatting rules
├── .gitignore             # Git ignore patterns
├── README.md              # Project documentation
├── AGENTS.md              # AI agent guidance
└── LICENSE                # MIT license
```

## Source Code Organization (`src/`)
- **`index.ts`** - Main entry point, stdio transport server setup, session management
- **`PuppeteerMcpServer.ts`** - Core MCP server implementation with browser tools
- **`initBrowser.ts`** - Browser initialization and connection logic

## Code Organization Patterns

### File Naming Style Guide
- **Primary Export Rule**: TypeScript files must be named after their primary export
- **Class Files**: Use PascalCase matching the class name (`PuppeteerMcpServer.ts` exports `PuppeteerMcpServer`)
- **Function Files**: Use camelCase matching the primary function (`initBrowser.ts` exports `initBrowser`)
- **Index Files**: Use `index.ts` for re-export files and main entry points
- **Multi-export Files**: Use descriptive names for files with multiple related exports (e.g., `test-helpers.ts`)
- **Test Files**: Located in `_tests` subdirectories with `.test.ts` suffix

### Module Structure
- Each file should have a single primary export
- Use named exports for utilities and types (enforced by Biome)
- Import with explicit `.ts` extensions in source code
- Import with explicit `.js` extensions for local modules in compiled output
- Use `.js` extensions when importing from `@modelcontextprotocol/sdk`
- Avoid default exports except where required by frameworks (Vitest config, etc.)

### Class Organization
- Constructor sets up core dependencies and session state
- Tool definitions follow the pattern: name, description, schema, handler
- Private methods for internal logic (e.g., `setupConsoleListener`)
- Cleanup methods for resource management (e.g., `disconnect`)

## Extension Points
- Add new MCP tools in `PuppeteerMcpServer.ts`
- Modify browser initialization in `src/initBrowser.ts`
- Extend transport options in `src/index.ts`
- Add additional functionality in `src/index.ts`