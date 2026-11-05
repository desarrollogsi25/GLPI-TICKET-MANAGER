import type { PagedResult } from './types'

/** Collect every server page before publishing data used by client-side filters. */
export async function collectPages<T extends { id: number }>(
  fetchPage: (limit: number, offset: number) => Promise<PagedResult<T>>,
  signal?: AbortSignal,
): Promise<PagedResult<T>> {
  const items: T[] = []
  const ids = new Set<number>()
  const pageSize = 100
  let total: number | undefined

  do {
    signal?.throwIfAborted()
    const page = await fetchPage(pageSize, items.length)
    signal?.throwIfAborted()
    if (!Number.isSafeInteger(page.total) || page.total < 0 ||
        page.offset !== items.length || (total !== undefined && page.total !== total)) {
      throw new Error('La lista de tickets cambió durante la carga. Vuelve a intentarlo.')
    }
    total = page.total
    if ((page.items.length === 0 && items.length < total) ||
        items.length + page.items.length > total) {
      throw new Error('No se pudo cargar la lista completa de tickets. Vuelve a intentarlo.')
    }
    for (const item of page.items) {
      if (ids.has(item.id)) {
        throw new Error('La lista de tickets cambió durante la carga. Vuelve a intentarlo.')
      }
      ids.add(item.id)
      items.push(item)
    }
  } while (items.length < total)

  return { items, total, limit: items.length, offset: 0 }
}
