import { useEffect } from 'react'
import { NewTabPage } from '../../ui/components/NewTabPage'
import { getTheme, applyTheme } from '../../lib/storage'

export function App() {
  useEffect(() => {
    getTheme().then(applyTheme)
  }, [])

  return <NewTabPage />
}
