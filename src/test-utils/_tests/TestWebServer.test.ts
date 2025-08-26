import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type TestResource, TestWebServer } from '../index.js'

describe('TestWebServer', () => {
  let server: TestWebServer
  let testDir: string

  beforeEach(async () => {
    // Create a temporary directory for test files
    testDir = join(tmpdir(), `test-web-server-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
    server = new TestWebServer(testDir)
  })

  afterEach(async () => {
    if (server) {
      await server.stop()
    }
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true })
    } catch (_error) {
      // Ignore cleanup errors
    }
  })

  it('should start server and assign auto port', async () => {
    const port = await server.start()
    expect(port).toBeGreaterThan(0)
    expect(port).toBeLessThan(65_536)
  })

  it('should serve inline content resources', async () => {
    const resource: TestResource = {
      path: '/test',
      body: '<html><body>Test Content</body></html>',
      contentType: 'text/html',
    }

    server.addResource(resource)
    const _port = await server.start()
    const url = server.getUrl('/test')

    const response = await fetch(url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')
    const text = await response.text()
    expect(text).toBe('<html><body>Test Content</body></html>')
  })

  it('should serve file-based resources', async () => {
    // Create a test file
    const testFileName = 'test-file.html'
    const testFilePath = join(testDir, testFileName)
    const testContent = '<html><body>File Content</body></html>'
    await writeFile(testFilePath, testContent)

    const resource: TestResource = {
      path: '/file-test',
      bodySourcePath: testFileName,
      contentType: 'text/html',
    }

    server.addResource(resource)
    const _port = await server.start()
    const url = server.getUrl('/file-test')

    const response = await fetch(url)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')
    const text = await response.text()
    expect(text).toBe(testContent)
  })

  it('should return 404 for unknown paths', async () => {
    const _port = await server.start()
    const url = server.getUrl('/unknown')

    const response = await fetch(url)
    expect(response.status).toBe(404)
    const text = await response.text()
    expect(text).toBe('Not Found')
  })

  it('should return 400 for resources with no body or bodySourcePath', async () => {
    const resource: TestResource = {
      path: '/invalid',
      contentType: 'text/html',
      // No body or bodySourcePath
    }

    server.addResource(resource)
    const _port = await server.start()
    const url = server.getUrl('/invalid')

    const response = await fetch(url)
    expect(response.status).toBe(400)
    const text = await response.text()
    expect(text).toBe('No body or bodySourcePath specified')
  })

  it('should return 500 for missing files', async () => {
    const resource: TestResource = {
      path: '/missing-file',
      bodySourcePath: 'non-existent-file.html',
      contentType: 'text/html',
    }

    server.addResource(resource)
    const _port = await server.start()
    const url = server.getUrl('/missing-file')

    const response = await fetch(url)
    expect(response.status).toBe(500)
    const text = await response.text()
    expect(text).toContain('Internal Server Error')
  })

  it('should add multiple resources', async () => {
    const resources: TestResource[] = [
      {
        path: '/page1',
        body: '<html><body>Page 1</body></html>',
        contentType: 'text/html',
      },
      {
        path: '/page2',
        body: '<html><body>Page 2</body></html>',
        contentType: 'text/html',
      },
    ]

    server.addResources(resources)
    const _port = await server.start()

    // Test first resource
    const response1 = await fetch(server.getUrl('/page1'))
    expect(response1.status).toBe(200)
    const text1 = await response1.text()
    expect(text1).toBe('<html><body>Page 1</body></html>')

    // Test second resource
    const response2 = await fetch(server.getUrl('/page2'))
    expect(response2.status).toBe(200)
    const text2 = await response2.text()
    expect(text2).toBe('<html><body>Page 2</body></html>')
  })

  it('should generate correct URLs', async () => {
    const port = await server.start()

    expect(server.getUrl()).toBe(`http://localhost:${port}/`)
    expect(server.getUrl('/')).toBe(`http://localhost:${port}/`)
    expect(server.getUrl('/test')).toBe(`http://localhost:${port}/test`)
    expect(server.getUrl('/path/to/resource')).toBe(`http://localhost:${port}/path/to/resource`)
  })

  it('should properly cleanup server resources', async () => {
    const _port = await server.start()

    // Verify server is running
    const resource: TestResource = {
      path: '/test',
      body: 'test',
      contentType: 'text/plain',
    }
    server.addResource(resource)

    const response = await fetch(server.getUrl('/test'))
    expect(response.status).toBe(200)

    // Get URL before stopping server
    const testUrl = server.getUrl('/test')

    // Stop server
    await server.stop()

    // Verify server is stopped - should reject with connection error
    await expect(fetch(testUrl)).rejects.toThrowError()

    // Verify multiple stops don't cause errors
    await expect(server.stop()).resolves.toBeUndefined()
  })
})
