import { useEffect } from 'react'
import { OptionsPage } from '../../ui/components/OptionsPage'
import { getTheme, applyTheme } from '../../lib/storage'

export function App() {
  useEffect(() => {
    getTheme().then(applyTheme)
  }, [])

  return <OptionsPage />
}
