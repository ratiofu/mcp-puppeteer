# Product Overview

This is a **Puppeteer MCP Server** - a Model Context Protocol server that provides browser automation capabilities through Puppeteer. It enables AI agents to control Chrome browsers remotely via a standardized protocol interface.

✨ **The key difference of this implementation compared to others is that it enables access to the raw DOM content of the page and the console!**

## Core Purpose
- Bridge between AI agents and browser automation
- Provide standardized MCP tools for web interaction
- Enable remote Chrome control through Puppeteer
- Support concurrent browser sessions with proper isolation
- Give the AI agent access to the current page's DOM

## Key Components
- **MCP Server**: Implements the Model Context Protocol for browser automation
- **Puppeteer Integration**: Uses puppeteer-core to control Chrome via remote debugging
- **Express Server**: Provides HTTP/SSE transport for MCP communication
- **Session Management**: Handles multiple concurrent browser sessions

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
- **Network exposure**: Server runs on localhost:7742 by default
- **Session isolation**: Each MCP session gets its own browser page
- **Resource cleanup**: Pages are closed when sessions disconnect

### Input Validation
- All tool inputs validated with Zod schemas
- URL validation for navigation
- CSS selector sanitization for clicks
- No arbitrary code execution in browser context

### Roadmap
- Convert to using local pipe instead of SSE
- Publish as public NPM package so it can be run via `npx`
- If the already running Chrome instance does not have its debug port enables, offer to install Chromium and use that
- Automatically start Chromium if it is available, but offer a flag to try to connect to a running instance instead and give up if no open debug port can be found
