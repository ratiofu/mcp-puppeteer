# A simple MCP Server for controlling Chrome via Puppeteer

## Usage

Note that this is using `puppeteer-core` and does not install additional browsers. The expectation here is that you know how to start Chrome with the remote debugging port enabled. On the Mac, for example, this may look something like this:

```sh
open -a "Google Chrome" --args --remote-debugging-port=9222
```

1. Install dependencies

```sh
% pnpm i
```

2. Run the MCP Server

```sh
% pnpm run start
```

3. Go to **Cursor** → Settings → Cursor Settings → MCP → Add new global MCP server and add the following configuration:

```json
{
  "mcpServers": {
    "puppeteer-control": {
      "url": "http://localhost:7742/sse"
    }
  }
}
```

## Learnings

1. The [documentation for the TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) describes the newer "Streamable HTTP" support in its example. What we need for Cursor, though, is the SSE support, which is better discribed in the [official MCP documentation for Server-Sent Events](https://modelcontextprotocol.io/docs/concepts/transports#server-sent-events-sse).
2. [The Inspector](https://modelcontextprotocol.io/docs/tools/inspector) is very helpful, but it's a bit misleading on how to start it. Assuming the local MCP server is already running and using SSE, a simple `pnpx @modelcontextprotocol/inspector` is sufficient.
