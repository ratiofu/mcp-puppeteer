# Product Overview

This is a **Puppeteer MCP Server** - a Model Context Protocol server that provides browser automation capabilities through Puppeteer. It enables AI agents to control Chromium browsers remotely via a standardized protocol interface.

✨ **The key difference of this implementation compared to others is that it enables access to the raw DOM content of the page and the console!**

## Core Purpose
- Bridge between AI agents and browser automation
- Provide standardized MCP tools for web interaction
- Enable remote Chromium control through Puppeteer
- Support concurrent browser sessions with proper isolation
- Give the AI agent access to the current page's DOM

## Available MCP Tools
- `navigate`: Navigate to URLs
- `list_tab_urls`: List all open tab URLs
- `click`: Click elements using CSS selectors
- `take_screenshot`: Capture page screenshots
- `get_html`: Extract page HTML content
- `get_console`: Retrieve browser console output

## Target Use Cases
- AI-driven web testing and automation
- Content extraction and web scraping
- Interactive browser control for AI agents
- Remote browser debugging and monitoring

## Security Considerations

### Browser Security
- **Remote debugging port**: Only bind to localhost (9222)
- **Session isolation**: Each MCP session gets its own browser page
- **Resource cleanup**: Pages are closed when sessions disconnect

### Input Validation
- All tool inputs validated with Zod schemas
- URL validation for navigation
- CSS selector sanitization for clicks
- No arbitrary code execution in browser context

### Operational Security
- Run in isolated environments for production use
- Monitor resource usage (memory, CPU, browser processes)
- Implement rate limiting for production deployments
- Consider sandboxing browser instances
- Log security-relevant events (navigation, clicks)

## Package Information
- **NPM Package**: `@ratiofu/mcp-puppeteer`
- **Current Version**: 1.1.0
- **Installation**: `npx @ratiofu/mcp-puppeteer`
- **Repository**: https://github.com/ratiofu/mcp-puppeteer

## Roadmap
- ✅ Convert to using local pipe instead of SSE
- ✅ Publish as public NPM package so it can be run via `npx`
- 🔄 Automatic Chromium management and installation
- 🔄 Smart connection fallback with configurable retry logic
- 🔄 Enhanced error reporting and debugging capabilities
