import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { noOp } from '../utils/noOp'

// Hoisted mock function to satisfy Vitest's hoisting of vi.mock
const { connectMock } = vi.hoisted(() => ({ connectMock: vi.fn() }))

vi.mock('puppeteer-core', () => ({ default: { connect: connectMock }, connect: connectMock }))

describe('initBrowser', () => {
  beforeEach(() => {
    vi.resetModules()
    connectMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects successfully and returns a browser', async () => {
    connectMock.mockResolvedValueOnce({})
    const errSpy = vi.spyOn(console, 'error').mockImplementation(noOp)

    const mod = await import('../initBrowser.js')
    const { initBrowser } = mod

    const browser = await initBrowser()
    expect(connectMock).toHaveBeenCalled()
    expect(browser).toBeDefined()
    // Success path logs a success line
    expect(errSpy).toHaveBeenCalledWith('Successfully connected to Chromium instance')

    errSpy.mockRestore()
  })

  it('on failure logs errors and exits process', async () => {
    connectMock.mockRejectedValueOnce(new Error('connect fail'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(noOp)
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((_code?: string | number | null | undefined) => {
        // prevent test process exit
        return undefined as never
      })

    const mod = await import('../initBrowser.js')
    const { initBrowser } = mod

    await initBrowser()

    expect(connectMock).toHaveBeenCalled()
    expect(exitSpy).toHaveBeenCalledWith(1)
    // Should print friendly guidance
    const allErrors = errSpy.mock.calls.map((c) => String(c[0] ?? ''))
    expect(allErrors.some((m) => m.includes('Failed to connect to Chromium'))).toBe(true)

    errSpy.mockRestore()
    exitSpy.mockRestore()
  })

  it('initBrowserSafe returns structured result without exiting', async () => {
    connectMock.mockRejectedValueOnce(new Error('connect fail'))

    const mod = await import('../initBrowser.js')
    const { initBrowserSafe } = mod

    const res = await initBrowserSafe()
    expect(res.success).toBe(false)
    expect(typeof res.error).toBe('string')
  })
})
