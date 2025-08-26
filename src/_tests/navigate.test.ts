import { describe, expect, it } from 'vitest'
import { withTestContext } from '../test-utils/TestContext.js'
import { interactiveHtml, page2Html } from '../test-utils/test-fixtures.js'
import { type NavigateResponse, ToolNames } from '../types/api.js'

describe('Navigate Tool', () => {
  describe('Valid URL Navigation', () => {
    it('should navigate to a valid URL with local test server', async () => {
      await withTestContext('navigate-valid-url', async (context) => {
        // Add test resource (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        // Navigate to the test page
        const result = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/'),
        })) as NavigateResponse

        // Verify successful navigation
        expect(result.isError).toBe(false)
        expect(result.content).toHaveLength(1)

        const content = result.content[0]
        expect(content.type).toBe('text')
        expect(content.text).toContain('Navigated to')
        expect(content.text).toContain(context.webServer.getUrl('/'))
      })
    })

    it('should navigate to different page types (HTML)', async () => {
      await withTestContext('navigate-html-page', async (context) => {
        // Add multiple pages (web server auto-starts)
        await context.webServer.addResources([
          {
            path: '/',
            body: interactiveHtml,
            contentType: 'text/html',
          },
          {
            path: '/page2',
            body: page2Html,
            contentType: 'text/html',
          },
        ])

        // Navigate to first page
        const result1 = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/'),
        })) as NavigateResponse

        expect(result1.isError).toBe(false)
        expect(result1.content[0].text).toContain(context.webServer.getUrl('/'))

        // Navigate to second page
        const result2 = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/page2'),
        })) as NavigateResponse

        expect(result2.isError).toBe(false)
        expect(result2.content[0].text).toContain(context.webServer.getUrl('/page2'))
      })
    })

    it('should handle redirects properly', async () => {
      await withTestContext('navigate-redirects', async (context) => {
        // Add a redirect response (302) - web server auto-starts
        const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=/target">
    <title>Redirect Page</title>
</head>
<body>
    <p>Redirecting...</p>
</body>
</html>`

        const targetHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Target Page</title>
</head>
<body>
    <h1>Target Page</h1>
    <p>This is the redirect target.</p>
</body>
</html>`

        await context.webServer.addResources([
          {
            path: '/redirect',
            body: redirectHtml,
            contentType: 'text/html',
          },
          {
            path: '/target',
            body: targetHtml,
            contentType: 'text/html',
          },
        ])

        // Navigate to redirect page
        const result = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/redirect'),
        })) as NavigateResponse

        expect(result.isError).toBe(false)
        const content = result.content[0]
        expect(content.text).toContain('Navigated to')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid URLs with validation errors', async () => {
      await withTestContext('navigate-invalid-url', async (context) => {
        // Try to navigate to an invalid URL - this should throw a validation error
        await expect(async () => {
          await context.client.callTool(ToolNames.navigate, {
            url: 'not-a-valid-url',
          })
        }).rejects.toThrow('Invalid arguments for tool navigate')
      })
    })

    it('should handle network failures', async () => {
      await withTestContext('navigate-network-failure', async (context) => {
        // Try to navigate to a non-existent domain (valid URL format but unreachable)
        const result = (await context.client.callTool(ToolNames.navigate, {
          url: 'http://nonexistent-domain-12345.com/test',
        })) as NavigateResponse

        // Verify error response
        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        const content = result.content[0]
        expect(content.type).toBe('text')
        expect(content.text).toContain('navigation failed')
      })
    })

    it('should handle malformed URLs with validation errors', async () => {
      await withTestContext('navigate-malformed-url', async (context) => {
        // Try to navigate to a malformed URL - this should throw a validation error
        await expect(async () => {
          await context.client.callTool(ToolNames.navigate, {
            url: 'http://[invalid-url',
          })
        }).rejects.toThrow('Invalid arguments for tool navigate')
      })
    })

    it('should handle non-HTTP protocols', async () => {
      await withTestContext('navigate-non-http', async (context) => {
        // Try to navigate to a non-HTTP URL
        const result = (await context.client.callTool(ToolNames.navigate, {
          url: 'ftp://example.com',
        })) as NavigateResponse

        // Verify error response (should fail validation or navigation)
        expect(result.isError).toBe(true)
        const content = result.content[0]
        expect(content.text).toContain('navigation failed')
      })
    })
  })

  describe('Response Format Validation', () => {
    it('should return response matching NavigateResponse interface', async () => {
      await withTestContext('navigate-response-format', async (context) => {
        // Add test resource (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html',
        })

        // Navigate to the test page
        const result = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/'),
        })) as NavigateResponse

        // Verify response structure matches NavigateResponse interface
        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('isError')
        expect(Array.isArray(result.content)).toBe(true)
        expect(typeof result.isError).toBe('boolean')

        // Verify content structure
        expect(result.content).toHaveLength(1)
        const content = result.content[0]
        expect(content).toHaveProperty('type')
        expect(content).toHaveProperty('text')
        expect(content.type).toBe('text')
        expect(typeof content.text).toBe('string')
      })
    })

    it('should return consistent error response format for server errors', async () => {
      await withTestContext('navigate-error-format', async (context) => {
        // Try to navigate to a valid URL format but unreachable domain
        const result = (await context.client.callTool(ToolNames.navigate, {
          url: 'http://nonexistent-domain-12345.com/test',
        })) as NavigateResponse

        // Verify error response structure
        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('isError')
        expect(result.isError).toBe(true)
        expect(Array.isArray(result.content)).toBe(true)
        expect(result.content).toHaveLength(1)

        const content = result.content[0]
        expect(content.type).toBe('text')
        expect(typeof content.text).toBe('string')
        expect(content.text.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Navigation State Management', () => {
    it('should maintain navigation state between calls', async () => {
      await withTestContext('navigate-state-management', async (context) => {
        // Add test resources (web server auto-starts)
        await context.webServer.addResources([
          {
            path: '/page1',
            body: '<h1>Page 1</h1><p>First page content</p>',
            contentType: 'text/html',
          },
          {
            path: '/page2',
            body: '<h1>Page 2</h1><p>Second page content</p>',
            contentType: 'text/html',
          },
        ])

        // Navigate to first page
        const result1 = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/page1'),
        })) as NavigateResponse

        expect(result1.isError).toBe(false)

        // Navigate to second page
        const result2 = (await context.client.callTool(ToolNames.navigate, {
          url: context.webServer.getUrl('/page2'),
        })) as NavigateResponse

        expect(result2.isError).toBe(false)

        // Verify we can get HTML from the current (second) page
        const htmlResult = await context.client.callTool('get_html', {})
        expect(htmlResult.isError).toBe(false)
        const htmlContent = htmlResult.content[0]
        expect(htmlContent.text).toContain('Page 2')
      })
    })
  })
})
