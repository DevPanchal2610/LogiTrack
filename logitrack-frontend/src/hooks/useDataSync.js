import { useEffect } from 'react'
import { useNotif } from '../context/NotifContext'

export default function useDataSync(refetch, types) {
  const { onDataChange } = useNotif()

  useEffect(() => {
    if (!onDataChange || !refetch) return
    const unsubscribe = onDataChange((data) => {
      if (types && !types.includes(data.type)) return
      refetch()
    })
    return unsubscribe
  }, [onDataChange, refetch])
}
