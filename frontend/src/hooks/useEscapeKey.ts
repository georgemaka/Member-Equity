import { useEffect } from 'react'

/**
 * Custom hook that calls a callback function when the Escape key is pressed
 * @param callback - Function to call when Escape is pressed
 * @param isActive - Whether the hook should be active (default: true)
 */
export function useEscapeKey(callback: () => void, isActive: boolean = true) {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        event.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [callback, isActive])
}