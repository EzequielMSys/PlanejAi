import { useEffect } from 'react'
export default function useExitWarning(unsafe) {
  useEffect(() => {
    if (!unsafe) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsafe])
}
