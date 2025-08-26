import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type TestContext, withTestContext } from '../TestContext.js'
import { expectNotNull } from '../test-helpers.js'
import { setupTests, teardownTests } from '../test-setup.js'

describe('Test Context Factory', () => {
  beforeAll(async () => {
    await setupTests()
  })

  afterAll(async () => {
    await teardownTests()
  })

  describe('withTestContext', () => {
    it('should run test with test label', async () => {
      let contextFromTest: TestContext | null = null

      await withTestContext('basic-test', async (context) => {
        contextFromTest = context
        expect(context.sessionId).toMatch(/^basic-test-\d+-[a-z0-9]+$/)

        // Perform some test operations - client is auto-initialized on first use
        const tools = await context.client.listTools()
        expect(tools.tools).toBeDefined()
        expect(tools.tools.length).toBeGreaterThan(0)
        expect(context.client.isInitialized()).toBe(true)
      })

      // ensure test code in context ran
      const expected = expectNotNull<TestContext>(contextFromTest)
      expect(expected.sessionId).toMatch(/^basic-test-\d+-[a-z0-9]+$/)
    })

    it('should run test with config object', async () => {
      let contextFromTest: TestContext | null = null

      await withTestContext(
        {
          testLabel: 'config-test',
          webResourcesBaseDir: process.cwd(),
        },
        async (context) => {
          contextFromTest = context
          expect(context.sessionId).toMatch(/^config-test-\d+-[a-z0-9]+$/)
          expect(context.webResourcesBaseDir).toBe(process.cwd())

          // Client is auto-initialized on first use
          const tools = await context.client.listTools()
          expect(context.client.isInitialized()).toBe(true)
          expect(tools.tools).toBeDefined()
        },
      )

      // ensure test code in context ran
      const expected = expectNotNull<TestContext>(contextFromTest)
      expect(expected.sessionId).toMatch(/^config-test-\d+-[a-z0-9]+$/)
    })

    it('should cleanup even if test throws an error', async () => {
      await expect(
        withTestContext('error-test', async (context) => {
          // Client is auto-initialized on first use
          const tools = await context.client.listTools()
          expect(context.client.isInitialized()).toBe(true)
          expect(tools.tools).toBeDefined()
          throw new Error('Test error')
        }),
      ).rejects.toThrow('Test error')

      // The test should have thrown, but cleanup should still have occurred
      // This is verified by the fact that the test completes without hanging
    })

    it('should generate unique session IDs for concurrent contexts', async () => {
      const sessionIds: string[] = []

      await Promise.all([
        withTestContext('concurrent-test-1', async (context1) => {
          sessionIds.push(context1.sessionId)
          expect(context1.sessionId).toMatch(/^concurrent-test-1-\d+-[a-z0-9]+$/)
        }),
        withTestContext('concurrent-test-2', async (context2) => {
          sessionIds.push(context2.sessionId)
          expect(context2.sessionId).toMatch(/^concurrent-test-2-\d+-[a-z0-9]+$/)
        }),
      ])

      // Verify session IDs are unique
      expect(sessionIds).toHaveLength(2)
      expect(sessionIds[0]).not.toBe(sessionIds[1])
    })
  })

  describe('session isolation', () => {
    it('should maintain isolation between concurrent test contexts', async () => {
      const sessionIds: string[] = []

      await Promise.all([
        withTestContext({ testLabel: 'isolation-test-1' }, async (context1) => {
          sessionIds.push(context1.sessionId)
          await context1.webServer.addResource({
            path: '/',
            body: '<h1>Page 1</h1>',
            contentType: 'text/html',
          })

          // Client is auto-initialized on first use
          await context1.client.navigate(context1.webServer.getUrl('/'))

          const html1 = await context1.client.getHtml()
          expect(html1.content[0].text).toContain('Page 1')
          expect(context1.sessionId).toMatch(/^isolation-test-1-\d+-[a-z0-9]+$/)
          expect(context1.client.getSessionId()).toBe(context1.sessionId)
        }),
        withTestContext({ testLabel: 'isolation-test-2' }, async (context2) => {
          sessionIds.push(context2.sessionId)
          await context2.webServer.addResource({
            path: '/',
            body: '<h1>Page 2</h1>',
            contentType: 'text/html',
          })

          // Client is auto-initialized on first use
          await context2.client.navigate(context2.webServer.getUrl('/'))

          const html2 = await context2.client.getHtml()
          expect(html2.content[0].text).toContain('Page 2')
          expect(context2.sessionId).toMatch(/^isolation-test-2-\d+-[a-z0-9]+$/)
          expect(context2.client.getSessionId()).toBe(context2.sessionId)
        }),
      ])

      // Verify session IDs are different
      expect(sessionIds).toHaveLength(2)
      expect(sessionIds[0]).not.toBe(sessionIds[1])
    })
  })
})
