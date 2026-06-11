import { describe, it, expect, afterEach, vi } from 'vitest'
import { acFetch, ACRequestError } from './audiochord'

afterEach(() => vi.unstubAllGlobals())

async function failureKindOf(p: Promise<unknown>): Promise<string> {
  try {
    await p
    return 'ok'
  } catch (e) {
    return e instanceof ACRequestError ? e.kind : `unexpected:${String(e)}`
  }
}

/** fetch stub that hangs until its abort signal fires. */
function hangingFetch() {
  return (_input: unknown, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () =>
        reject(new DOMException('aborted', 'AbortError')),
      )
    })
}

describe('acFetch failure classification', () => {
  it('network refusal → server-down', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')))
    expect(await failureKindOf(acFetch('/api/v1/x'))).toBe('server-down')
  })

  it('401/403 → auth', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 401 })))
    expect(await failureKindOf(acFetch('/api/v1/x'))).toBe('auth')

    vi.stubGlobal('fetch', () => Promise.resolve(new Response('', { status: 403 })))
    expect(await failureKindOf(acFetch('/api/v1/x'))).toBe('auth')
  })

  it('deadline exceeded → timeout', async () => {
    vi.stubGlobal('fetch', hangingFetch())
    expect(await failureKindOf(acFetch('/api/v1/x', {}, { timeoutMs: 20 }))).toBe('timeout')
  })

  it('caller abort → aborted (not timeout)', async () => {
    vi.stubGlobal('fetch', hangingFetch())
    const ctrl = new AbortController()
    const pending = failureKindOf(acFetch('/api/v1/x', {}, { timeoutMs: 60_000, signal: ctrl.signal }))
    ctrl.abort()
    expect(await pending).toBe('aborted')
  })

  it('other HTTP statuses pass through for the caller (e.g. 404 = not cached)', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('nope', { status: 404 })))
    const res = await acFetch('/api/v1/x')
    expect(res.status).toBe(404)
  })
})
