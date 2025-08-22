# A simple MCP Server for controlling Chrome via Puppeteer

✨ **The key difference of this implementation to other MCP Puppeteer implementations is that it enables access to the raw DOM content of the page and the console!**

This MCP server uses pipe transport (stdin/stdout) to communicate with MCP clients, following standard MCP protocol patterns without requiring HTTP ports or server management.

## Available Tools

- `navigate`: Navigate to URLs
- `list_tab_urls`: List all open tab URLs  
- `click`: Click elements using CSS selectors
- `take_screenshot`: Capture page screenshots
- `get_html`: Extract page HTML content
- `get_console`: Retrieve browser console output

## Prerequisites

This server uses `puppeteer-core` and does not install additional browsers. You need Chrome with remote debugging enabled:

```sh
open -a "Google Chrome" --args --remote-debugging-port=9222
```

## Setup

1. Install dependencies

```sh
pnpm install
```

2. Build the server

```sh
pnpm run build
```

3. Run the server

```sh
pnpm start
```

## Development Workflow

For development with auto-rebuild and restart:

```sh
pnpm run dev
```

This watches TypeScript files, automatically rebuilds with esbuild, and restarts the server when files change.

For development with MCP Inspector auto-restart:

```sh
pnpm run dev:inspector
```

This does the same as `dev` but also automatically restarts MCP Inspector for seamless testing.

### Available Scripts

```sh
# Type check only
pnpm run typecheck

# Run automated tests
pnpm run test

# Start MCP Inspector for testing
pnpm run inspector

# Restart MCP Inspector (kills existing and starts new)
pnpm run restart-inspector
```

## Testing

### Automated Testing
Run the test suite to validate MCP protocol functionality:

```sh
pnpm run test
```

### Interactive Testing with MCP Inspector
Test the server interactively using MCP Inspector:

```sh
pnpm run inspector
```

### MCP Client Configuration

For MCP clients like Cursor, configure the server using pipe transport:

```json
{
  "mcpServers": {
    "puppeteer-control": {
      "command": "node",
      "args": ["path/to/dist/index.js"]
    }
  }
}
```

Or if installed globally via npm:

```json
{
  "mcpServers": {
    "puppeteer-control": {
      "command": "npx",
      "args": ["puppeteer-mcp-server"]
    }
  }
}
```

## Architecture

This server uses:
- **Pipe Transport**: Direct stdin/stdout communication with MCP clients
- **Single Session**: One browser session per server process
- **esbuild Bundling**: Fast TypeScript compilation and bundling
- **Puppeteer Core**: Browser automation without bundled browsers
- **Automatic Cleanup**: Browser resources cleaned up on process exit
