import { useEffect, useState } from 'react'

// Tiny request cache shared by every pane: one in-flight promise per key, and
// the settled value kept for the session (TTL-bounded) so moving the cursor
// back to a symbol is instant.
type Entry = { at: number; promise: Promise<unknown>; value?: unknown; error?: unknown }
const cache = new Map<string, Entry>()
const TTL_MS = 5 * 60_000

export function load<T>(key: string, fetcher: () => Promise<T>, force = false): Promise<T> {
  const hit = cache.get(key)
  if (hit && !force && Date.now() - hit.at < TTL_MS && !hit.error) return hit.promise as Promise<T>
  const entry: Entry = { at: Date.now(), promise: Promise.resolve() }
  entry.promise = fetcher().then(
    (v) => { entry.value = v; return v },
    (e) => { entry.error = e; throw e },
  )
  cache.set(key, entry)
  return entry.promise as Promise<T>
}

export function peek<T>(key: string): T | undefined {
  return cache.get(key)?.value as T | undefined
}

export type Async<T> = { data: T | undefined; error: unknown; loading: boolean }

export function useAsync<T>(key: string | null, fetcher: () => Promise<T>, nonce = 0): Async<T> {
  const [state, setState] = useState<Async<T>>(() => ({
    data: key ? peek<T>(key) : undefined, error: undefined, loading: key != null && peek<T>(key) === undefined,
  }))
  useEffect(() => {
    if (!key) { setState({ data: undefined, error: undefined, loading: false }); return }
    let live = true
    const cached = peek<T>(key)
    setState({ data: cached, error: undefined, loading: cached === undefined })
    load(key, fetcher, nonce > 0).then(
      (data) => live && setState({ data, error: undefined, loading: false }),
      (error) => live && setState({ data: undefined, error, loading: false }),
    )
    return () => { live = false }
    // fetcher is recreated every render; the key fully identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce])
  return state
}

// Run fetchers with bounded concurrency (watchlist row quotes).
export async function eachLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<unknown>): Promise<void> {
  let i = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]!).catch(() => {})
  })
  await Promise.all(workers)
}
