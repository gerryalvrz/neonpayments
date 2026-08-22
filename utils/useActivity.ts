'use client'

import { useEffect, useState } from 'react'
import { fetchUserActivity, type ActivityItem } from '@/utils/intent-logging'

export function useActivity(address: string | null | undefined) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) {
      setItems([])
      return
    }
    let cancelled = false

    const load = () => {
      setLoading(true)
      fetchUserActivity(address)
        .then((next) => {
          if (!cancelled) setItems(next)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [address])

  return { items, loading }
}
