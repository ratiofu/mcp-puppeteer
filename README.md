# Puppeteer MCP Server

A Model Context Protocol (MCP) server that provides browser automation capabilities through Puppeteer. This server enables AI assistants to control Chromium browsers, take screenshots, extract content, and interact with web pages.

✨ **The key difference of this implementation compared to others is that it enables access to the raw DOM content of the page and the console!** ✨

## MCP Client Configuration

Add this to your MCP client configuration:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@ratiofu/mcp-puppeteer"
      ]
    }
  }
}
```

**Notes:**
- Some MCP clients support additional server configuration options. Consult your MCP client's documentation for advanced configuration settings.
- If you're using other Puppeteer-based MCP servers, consider using a unique name like `"puppeteer-ratiofu"` to avoid conflicts. Only run one Puppeteer MCP server at a time, and update any local agent guidance accordingly if you change the server name.

## Available Tools

- `navigate`: Navigate to URLs
- `list_tab_urls`: List all open tab URLs  
- `click`: Click elements using CSS selectors
- `take_screenshot`: Capture page screenshots
- `get_html`: Extract page HTML content
- `get_console`: Retrieve browser console output

## Prerequisites

You need Chromium running with remote debugging enabled:

### macOS
```bash
open -a "Chromium" --args --remote-debugging-port=9222
```

### Linux
```bash
chromium --remote-debugging-port=9222
```

### Windows
```cmd
chromium --remote-debugging-port=9222
```

## How It Works

The server automatically downloads and runs via `npx` when your MCP client needs it. No manual installation required! It uses Chromium's remote debugging protocol to control your browser.

## Troubleshooting

### Chromium Connection Issues

**Error: "Could not connect to Chromium"**

Make sure Chromium is running with the debug port:

```bash
# macOS
open -a "Chromium" --args --remote-debugging-port=9222

# Linux  
chromium --remote-debugging-port=9222

# Windows
chromium --remote-debugging-port=9222
```

You can verify Chromium is ready by opening http://localhost:9222/json in your browser.

### MCP Client Issues

**Server not responding:**
1. Ensure Chromium is running with debug port (see above)
2. Check your MCP client configuration matches the examples
3. Verify Node.js 22+ is installed (`node --version`)

**Need to test manually?**
```bash
echo '{}' | npx @ratiofu/mcp-puppeteer
```

## Development

For local development:

```bash
git clone https://github.com/ratiofu/mcp-puppeteer
cd mcp-puppeteer
pnpm install
pnpm run build
pnpm start
```

### Development Scripts

```bash
pnpm run dev            # Auto-rebuild and restart
pnpm run test           # Run tests
pnpm run inspector      # Test with MCP Inspector
```

## Architecture

- **Pipe Transport**: Direct stdin/stdout communication with MCP clients
- **Puppeteer Core**: Browser automation without bundled browsers  
- **Automatic Cleanup**: Browser resources cleaned up on process exit
