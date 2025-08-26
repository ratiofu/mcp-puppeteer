import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { withTestContext } from '../TestContext.js'
import { interactiveHtml, page2Html } from '../test-fixtures.js'
import { setupTests, teardownTests } from '../test-setup.js'

describe('Test Fixtures', () => {
  beforeAll(async () => {
    await setupTests()
  })

  afterAll(async () => {
    await teardownTests()
  })

  describe('interactiveHtml fixture', () => {
    it('should contain expected interactive elements', () => {
      expect(interactiveHtml).toContain('Interactive Test Page')
      expect(interactiveHtml).toContain('id="test-button"')
      expect(interactiveHtml).toContain('id="console-button"')
      expect(interactiveHtml).toContain('id="error-button"')
      expect(interactiveHtml).toContain('id="test-form"')
      expect(interactiveHtml).toContain('id="navigation-link"')
      expect(interactiveHtml).toContain('handleButtonClick()')
      expect(interactiveHtml).toContain('logToConsole()')
      expect(interactiveHtml).toContain('throwError()')
    })

    it('should work with test context and web server', async () => {
      await withTestContext('interactive-fixture-test', async (context) => {
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        const result = await context.client.navigate(context.webServer.getUrl('/'))
        expect(result.isError).toBe(false)

        const html = await context.client.getHtml()
        expect(html.content[0].text).toContain('Interactive Test Page')
        expect(html.content[0].text).toContain('Click Me')
      })
    })

    it('should support button interactions', async () => {
      await withTestContext('button-interaction-test', async (context) => {
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        await context.client.navigate(context.webServer.getUrl('/'))
        await context.client.click('#test-button')

        const html = await context.client.getHtml()
        expect(html.content[0].text).toContain('Button clicked 1 times')
      })
    })

    it('should support console logging', async () => {
      await withTestContext('console-logging-test', async (context) => {
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        await context.client.navigate(context.webServer.getUrl('/'))
        await context.client.click('#console-button')

        const console = await context.client.getConsole()
        expect(console.content[0].text).toContain('Test log message')
      })
    })
  })

  describe('page2Html fixture', () => {
    it('should contain expected content', () => {
      expect(page2Html).toContain('Page 2')
      expect(page2Html).toContain('navigation testing')
      expect(page2Html).toContain('id="back-link"')
      expect(page2Html).toContain('Page 2 loaded')
    })

    it('should work with navigation testing', async () => {
      await withTestContext('navigation-fixture-test', async (context) => {
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        await context.webServer.addResource({
          path: '/page2',
          body: page2Html,
          contentType: 'text/html',
        })

        // Navigate to main page
        await context.client.navigate(context.webServer.getUrl('/'))
        let html = await context.client.getHtml()
        expect(html.content[0].text).toContain('Interactive Test Page')

        // Navigate to page 2
        await context.client.navigate(context.webServer.getUrl('/page2'))
        html = await context.client.getHtml()
        expect(html.content[0].text).toContain('Page 2')
        expect(html.content[0].text).toContain('navigation testing')

        // Check console for page load message
        const console = await context.client.getConsole()
        expect(console.content[0].text).toContain('Page 2 loaded')
      })
    })
  })

  describe('fixture reusability', () => {
    it('should support multiple tests using the same fixtures', async () => {
      const testResults: string[] = []

      // First test using interactive fixture
      await withTestContext('reusability-test-1', async (context) => {
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        await context.client.navigate(context.webServer.getUrl('/'))
        const html = await context.client.getHtml()
        testResults.push('test1-success')
        expect(html.content[0].text).toContain('Interactive Test Page')
      })

      // Second test using the same fixture
      await withTestContext('reusability-test-2', async (context) => {
        await context.webServer.addResource({
          path: '/',
          body: interactiveHtml,
          contentType: 'text/html',
        })

        await context.client.navigate(context.webServer.getUrl('/'))
        await context.client.click('#test-button')
        const html = await context.client.getHtml()
        testResults.push('test2-success')
        expect(html.content[0].text).toContain('Button clicked 1 times')
      })

      expect(testResults).toEqual(['test1-success', 'test2-success'])
    })
  })
})
