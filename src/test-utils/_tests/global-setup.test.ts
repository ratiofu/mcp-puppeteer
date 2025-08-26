import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { noOp } from '../../utils/noOp.js'

// Hoisted mock to satisfy Vitest mocking semantics
const { execSyncMock } = vi.hoisted(() => ({ execSyncMock: vi.fn() }))
vi.mock('node:child_process', () => ({ execSync: execSyncMock }))

describe('global-setup teardown sweep', () => {
  beforeEach(() => {
    vi.resetModules()
    execSyncMock.mockReset()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('invokes pkill sweep via child_process.execSync', async () => {
    execSyncMock.mockImplementationOnce(noOp)

    const mod = await import('../global-setup.js')
    const setup = mod.default as () => Promise<() => Promise<void>>
    const teardown = await setup()
    await teardown()

    expect(execSyncMock).toHaveBeenCalledTimes(1)
    const [cmd, opts] = execSyncMock.mock.calls[0]
    expect(String(cmd)).toContain("pkill -KILL -f -- '--user-data-dir=/tmp/chromium-test-profile-'")
    expect(opts).toMatchObject({ stdio: 'ignore' })
  })

  it('logs a warning when pkill sweep fails', async () => {
    execSyncMock.mockImplementationOnce(() => {
      throw new Error('fail')
    })
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(noOp)

    const mod = await import('../global-setup.js')
    const setup = mod.default as () => Promise<() => Promise<void>>
    const teardown = await setup()
    await teardown()

    expect(warnSpy).toHaveBeenCalled()
    const msg = String(warnSpy.mock.calls[0]?.[0] ?? '')
    expect(msg).toContain('globalSetup: final Chromium kill sweep failed:')

    warnSpy.mockRestore()
  })
})
