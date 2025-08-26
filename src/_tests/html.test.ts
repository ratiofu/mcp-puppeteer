import { describe, expect, it } from 'vitest'
import { withTestContext } from '../test-utils/TestContext.js'
import { interactiveHtml, page2Html } from '../test-utils/test-fixtures.js'
import { type GetHtmlResponse, ToolNames } from '../types/api.js'

describe('HTML Extraction Tool', () => {
  describe('Valid HTML Content Extraction', () => {
    it('should extract HTML content from test pages', async () => {
      await withTestContext('html-basic-extraction', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Extract HTML content
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        // Verify successful HTML extraction
        expect(result.isError).toBe(false)
        expect(result.content).toHaveLength(1)

        const content = result.content[0]
        expect(content.type).toBe('text')

        const htmlContent = content.text
        expect(htmlContent).toContain('<!DOCTYPE html>')
        expect(htmlContent).toContain('<title>Interactive Test Page</title>')
        expect(htmlContent).toContain('<h1>Interactive Test Page</h1>')
        expect(htmlContent).toContain('id="test-button"')
        expect(htmlContent).toContain('handleButtonClick()')
      })
    })

    it('should extract complete HTML content including dynamic elements', async () => {
      await withTestContext('html-dynamic-content', async (context) => {
        // Add interactive page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Click button to modify page content
        await context.client.click('#test-button')

        // Extract HTML after interaction
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result.isError).toBe(false)

        const content = result.content[0]
        const htmlContent = content.text
        // Should contain the updated content from JavaScript
        expect(htmlContent).toContain('Button clicked 1 times')
        expect(htmlContent).toContain(
          '<div id="result" class="result">Button clicked 1 times</div>',
        )
      })
    })

    it('should extract HTML from different page types', async () => {
      await withTestContext('html-different-pages', async (context) => {
        await context.webServer.addResources([
          {
            path: '/page1',
            body: interactiveHtml,
            contentType: 'text/html',
          },
          {
            path: '/page2',
            body: page2Html,
            contentType: 'text/html',
          },
        ])

        // Extract HTML from first page
        await context.client.navigate(context.webServer.getUrl('/page1'))
        const result1 = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result1.isError).toBe(false)
        expect(result1.content[0].text).toContain('Interactive Test Page')

        // Extract HTML from second page
        await context.client.navigate(context.webServer.getUrl('/page2'))
        const result2 = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result2.isError).toBe(false)
        const content2 = result2.content[0]
        expect(content2.text).toContain('Page 2')
        expect(content2.text).toContain('This is the second page')

        // HTML content should be different
        expect(result1.content[0].text).not.toBe(content2.text)
      })
    })

    it('should extract HTML with various content types and structures', async () => {
      await withTestContext('html-various-structures', async (context) => {
        // Create a page with various HTML structures
        const complexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complex HTML Structure</title>
    <style>
        .container { max-width: 800px; margin: 0 auto; }
        .highlight { background-color: yellow; }
    </style>
</head>
<body>
    <header>
        <nav>
            <ul>
                <li><a href="#section1">Section 1</a></li>
                <li><a href="#section2">Section 2</a></li>
            </ul>
        </nav>
    </header>
    
    <main class="container">
        <section id="section1">
            <h2>Section 1</h2>
            <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
            <table>
                <thead>
                    <tr><th>Column 1</th><th>Column 2</th></tr>
                </thead>
                <tbody>
                    <tr><td>Data 1</td><td>Data 2</td></tr>
                </tbody>
            </table>
        </section>
        
        <section id="section2">
            <h2>Section 2</h2>
            <form>
                <input type="text" name="username" placeholder="Username" />
                <input type="password" name="password" placeholder="Password" />
                <button type="submit">Submit</button>
            </form>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2024 Test Page</p>
    </footer>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Complex page loaded');
        });
    </script>
</body>
</html>`

        await context.webServer.addResource({
          path: '/',
          body: complexHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Extract HTML
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result.isError).toBe(false)

        const content = result.content[0]
        const htmlContent = content.text
        // Verify various HTML structures are preserved
        expect(htmlContent).toContain('<header>')
        expect(htmlContent).toContain('<nav>')
        expect(htmlContent).toContain('<table>')
        expect(htmlContent).toContain('<thead>')
        expect(htmlContent).toContain('<tbody>')
        expect(htmlContent).toContain('<form>')
        expect(htmlContent).toContain('<footer>')
        expect(htmlContent).toContain('placeholder="Username"')
        expect(htmlContent).toContain('© 2024 Test Page')
        expect(htmlContent).toContain("console.log('Complex page loaded')")
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle error when no page is available', async () => {
      await withTestContext('html-no-page', async (context) => {
        // Try to extract HTML without navigating to any page first
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        // Verify error response
        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)

        const content = result.content[0]
        expect(content.type).toBe('text')
        expect(content.text).toBe('no current page')
      })
    })

    it('should handle HTML extraction failures gracefully', async () => {
      await withTestContext('html-extraction-failure', async (context) => {
        // Add page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Close the page to simulate a failure condition
        await context.server.disconnect()

        // Try to extract HTML after page is closed
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        // Should return error
        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)

        const content = result.content[0]
        expect(content.type).toBe('text')
        expect(content.text).toBe('no current page')
      })
    })
  })

  describe('Response Format Validation', () => {
    it('should return response matching GetHtmlResponse interface', async () => {
      await withTestContext('html-response-format', async (context) => {
        // Add test page (web server auto-starts)
        await context.webServer.addResource({
          path: '/',
          body: '<h1>Test Page</h1>',
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Extract HTML
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        // Verify response structure matches GetHtmlResponse interface
        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('isError')
        expect(Array.isArray(result.content)).toBe(true)
        expect(typeof result.isError).toBe('boolean')

        // Verify content structure for successful extraction
        expect(result.content).toHaveLength(1)
        const content = result.content[0]
        expect(content).toHaveProperty('type')
        expect(content).toHaveProperty('text')
        expect(content.type).toBe('text')
        expect(typeof content.text).toBe('string')
      })
    })

    it('should return consistent error response format', async () => {
      await withTestContext('html-error-format', async (context) => {
        // Try to extract HTML without a page
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

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

  describe('HTML Content Completeness', () => {
    it('should extract complete HTML including head and body', async () => {
      await withTestContext('html-completeness', async (context) => {
        const completeHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Complete HTML Test</title>
    <style>
        body { font-family: Arial; }
        .test { color: red; }
    </style>
    <script>
        var testVar = 'test value';
    </script>
</head>
<body>
    <h1 class="test">Complete HTML</h1>
    <p>This page tests complete HTML extraction.</p>
</body>
</html>`

        await context.webServer.addResource({
          path: '/',
          body: completeHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Extract HTML
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result.isError).toBe(false)

        const content = result.content[0]
        const htmlContent = content.text
        // Verify all parts of the HTML are included
        expect(htmlContent).toContain('<!DOCTYPE html>')
        expect(htmlContent).toContain('<html>')
        expect(htmlContent).toContain('<head>')
        expect(htmlContent).toContain('<meta charset="UTF-8">')
        expect(htmlContent).toContain('<title>Complete HTML Test</title>')
        expect(htmlContent).toContain('<style>')
        expect(htmlContent).toContain('body { font-family: Arial; }')
        expect(htmlContent).toContain('<script>')
        expect(htmlContent).toContain("var testVar = 'test value';")
        expect(htmlContent).toContain('<body>')
        expect(htmlContent).toContain('<h1 class="test">Complete HTML</h1>')
        expect(htmlContent).toContain('</html>')
      })
    })

    it('should preserve HTML formatting and whitespace', async () => {
      await withTestContext('html-formatting', async (context) => {
        const formattedHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Formatted HTML</title>
</head>
<body>
    <div>
        <p>Indented paragraph</p>
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
        </ul>
    </div>
</body>
</html>`

        await context.webServer.addResource({
          path: '/',
          body: formattedHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Extract HTML
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result.isError).toBe(false)

        const content = result.content[0]
        const htmlContent = content.text
        // Verify structure is preserved (though exact whitespace may vary)
        expect(htmlContent).toContain('<div>')
        expect(htmlContent).toContain('<p>Indented paragraph</p>')
        expect(htmlContent).toContain('<ul>')
        expect(htmlContent).toContain('<li>Item 1</li>')
        expect(htmlContent).toContain('<li>Item 2</li>')
        expect(htmlContent).toContain('</ul>')
        expect(htmlContent).toContain('</div>')
      })
    })
  })

  describe('Dynamic Content Extraction', () => {
    it('should extract HTML after JavaScript modifications', async () => {
      await withTestContext('html-after-js-modifications', async (context) => {
        // Create a page that modifies itself with JavaScript
        const dynamicHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Content</title>
</head>
<body>
    <div id="content">Initial content</div>
    <button id="modify-btn" onclick="modifyContent()">Modify Content</button>
    
    <script>
        function modifyContent() {
            document.getElementById('content').innerHTML = '<p>Modified by JavaScript</p><span>Additional element</span>';
            document.getElementById('content').setAttribute('data-modified', 'true');
        }
    </script>
</body>
</html>`

        await context.webServer.addResource({
          path: '/',
          body: dynamicHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Extract HTML before modification
        const beforeResult = (await context.client.callTool(
          ToolNames.getHtml,
          {},
        )) as GetHtmlResponse
        const beforeContentItem = beforeResult.content[0]
        const beforeContent = beforeContentItem.text
        expect(beforeContent).toContain('Initial content')
        // Note: The JavaScript source code will always be in the HTML, but the DOM changes won't be reflected yet
        expect(beforeContent).toContain('function modifyContent()')

        // Click button to modify content
        await context.client.click('#modify-btn')

        // Extract HTML after modification
        const afterResult = (await context.client.callTool(
          ToolNames.getHtml,
          {},
        )) as GetHtmlResponse

        expect(afterResult.isError).toBe(false)
        const afterContentItem = afterResult.content[0]
        const afterContent = afterContentItem.text

        // Should contain the dynamically modified DOM content
        expect(afterContent).toContain('Modified by JavaScript')
        expect(afterContent).toContain('<span>Additional element</span>')
        expect(afterContent).toContain('data-modified="true"')
        // The original "Initial content" should be replaced
        expect(afterContent).not.toContain('<div id="content">Initial content</div>')
      })
    })

    it('should extract HTML with dynamically loaded content', async () => {
      await withTestContext('html-dynamic-loading', async (context) => {
        // Create a page that loads content dynamically
        const loadingHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Loading</title>
</head>
<body>
    <div id="loading">Loading...</div>
    <div id="loaded-content" style="display: none;"></div>
    
    <script>
        setTimeout(function() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('loaded-content').style.display = 'block';
            document.getElementById('loaded-content').innerHTML = '<h2>Dynamically Loaded Content</h2><p>This was loaded after page load.</p>';
        }, 100);
    </script>
</body>
</html>`

        await context.webServer.addResource({
          path: '/',
          body: loadingHtml,
          contentType: 'text/html',
        })
        await context.client.navigate(context.webServer.getUrl('/'))

        // Wait a bit for the dynamic content to load
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Extract HTML after dynamic loading
        const result = (await context.client.callTool(ToolNames.getHtml, {})) as GetHtmlResponse

        expect(result.isError).toBe(false)
        const content = result.content[0]
        const htmlContent = content.text

        // Should contain the dynamically loaded content
        expect(htmlContent).toContain('Dynamically Loaded Content')
        expect(htmlContent).toContain('This was loaded after page load')
      })
    })
  })
})
