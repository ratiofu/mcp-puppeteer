import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import puppeteer from "puppeteer-core";
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from "zod";

// Define tools for the MCP server
export function setupMcpServer(browser: puppeteer.Page, transport: StreamableHTTPServerTransport) {
    const server = new McpServer({
        name: 'puppeteer-mcp',
        version: '1.0.0',
        description: 'MCP server for controlling Chrome via Puppeteer',
    })

    server.tool(
        "navigate",
        "Navigate to a specific URL",
        {
            url: z.string().describe("URL to navigate to")
        },
        async ({ url }) => {
            await browser.goto(url);
            return {
                content: [{ type: "text", text: `Navigated to ${url}` }],
                isError: false
            }
        }
    )

    server.tool(
        "take_screenshot",
        "Take a screenshot of the current page",
        {},
        async () => {
            const buffer = await browser.screenshot();
            return {
                content: [{ type: "image", data: Buffer.from(buffer).toString('base64'), mimeType: "image/png" }],
                isError: false
            }
        }
    )

    server.connect(transport);
}


// {
//     name: "start_session",
//         description: "Start a new browser session with a specific tab",
//             parameters: {
//         type: "object",
//             properties: {
//             tabIndex: {
//                 type: "number",
//                     description: "Index of the tab to control (0-based)"
//             }
//         }
//     }
// },
// {
//     name: "refresh_page",
//         description: "Refresh the current page",
//             parameters: {
//         type: "object",
//             properties: { }
//     }
// },
// {
//     name: "navigate",
//         description: "Navigate to a new URL",
//             parameters: {
//         type: "object",
//             properties: {
//             url: {
//                 type: "string",
//                     description: "URL to navigate to"
//             }
//         },
//         required: ["url"]
//     }
// },
// {
//     name: "take_screenshot",
//         description: "Take a screenshot of the current page",
//             parameters: {
//         type: "object",
//             properties: { }
//     }
// }
//     ]);

// // Set handlers for tools
// server.setToolHandler("list_tabs", async () => {
//     if (!browser) {
//         return {
//             content: [{ type: "text", text: "Error: Browser not connected" }],
//             isError: true
//         };
//     }

//     const pages = await browser.pages();
//     const tabs = await Promise.all(pages.map(async (page, index) => ({
//         index,
//         title: await page.title(),
//         url: page.url()
//     })));

//     // Format the response as text
//     return {
//         content: [
//             {
//                 type: "text",
//                 text: `Found ${tabs.length} tabs:\n${tabs.map(tab =>
//                     `${tab.index}: ${tab.title || 'Untitled'} - ${tab.url}`
//                 ).join('\n')}`
//             }
//         ],
//         data: { tabs }
//     };
// });

// server.setToolHandler("start_session", async (params) => {
//     const tabIndex = params?.tabIndex as number || 0;

//     if (!browser) {
//         return {
//             content: [{ type: "text", text: "Error: Browser not connected" }],
//             isError: true
//         };
//     }

//     const pages = await browser.pages();
//     if (tabIndex >= 0 && tabIndex < pages.length) {
//         activePage = pages[tabIndex];
//         const title = await activePage.title();

//         return {
//             content: [
//                 {
//                     type: "text",
//                     text: `Session started with tab ${tabIndex}: ${title || 'Untitled'} - ${activePage.url()}`
//                 }
//             ],
//             data: {
//                 title,
//                 url: activePage.url()
//             }
//         };
//     } else {
//         return {
//             content: [{ type: "text", text: `Error: Invalid tab index. Available tabs: ${pages.length}` }],
//             isError: true
//         };
//     }
// });

// server.setToolHandler("refresh_page", async () => {
//     if (!activePage) {
//         return {
//             content: [{ type: "text", text: "Error: No active page" }],
//             isError: true
//         };
//     }

//     await activePage.reload();
//     return {
//         content: [{ type: "text", text: "Page refreshed" }]
//     };
// });

// server.setToolHandler("navigate", async (params) => {
//     const url = params?.url as string;

//     if (!url) {
//         return {
//             content: [{ type: "text", text: "Error: URL is required" }],
//             isError: true
//         };
//     }

//     if (!activePage) {
//         return {
//             content: [{ type: "text", text: "Error: No active page" }],
//             isError: true
//         };
//     }

//     await activePage.goto(url);
//     return {
//         content: [{ type: "text", text: `Navigated to ${url}` }]
//     };
// });

// server.setToolHandler("take_screenshot", async () => {
//     if (!activePage) {
//         return {
//             content: [{ type: "text", text: "Error: No active page" }],
//             isError: true
//         };
//     }

//     const buffer = await activePage.screenshot();
//     return {
//         content: [
//             {
//                 type: "image",
//                 data: buffer.toString('base64'),
//                 mimeType: "image/png"
//             }
//         ]
//     };
// });
//   }
