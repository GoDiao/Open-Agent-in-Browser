import { useEffect } from 'react'
import { PopupApp } from '../../ui/components/PopupApp'
import { getTheme, applyTheme } from '../../lib/storage'

export function App() {
  useEffect(() => {
    getTheme().then(applyTheme)
  }, [])

  return <PopupApp />
}
