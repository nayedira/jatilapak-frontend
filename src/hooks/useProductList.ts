import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listProducts, type Product, type PageMeta, type ProductQuery } from '../lib/api/products'
import { ApiError } from '../lib/api/client'
import { authSession } from '../lib/session'

export function useProductList(query: ProductQuery) {
  const navigate = useNavigate()
  const key = JSON.stringify(query)
  const [items, setItems] = useState<Product[]>([])
  const [meta, setMeta] = useState<PageMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const fail = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.httpStatus === 401) {
      authSession.clear()
      navigate('/login', { replace: true })
      return
    }
    setError(err instanceof ApiError ? err.message : 'Gagal memuat produk. Coba lagi.')
  }, [navigate])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listProducts({ ...query, page: 1 })
      .then((d) => { if (!cancelled) { setItems(d.items ?? []); setMeta(d.meta ?? null) } })
      .catch((e) => { if (!cancelled) fail(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  async function loadMore() {
    if (!meta || loadingMore || meta.page >= meta.total_page) return
    setLoadingMore(true)
    try {
      const d = await listProducts({ ...query, page: meta.page + 1 })
      setItems((prev) => [...prev, ...(d.items ?? [])])
      setMeta(d.meta)
    } catch (e) { fail(e) } finally { setLoadingMore(false) }
  }

  const hasMore = !!meta && meta.page < meta.total_page
  return { items, meta, loading, loadingMore, error, hasMore, loadMore }
}