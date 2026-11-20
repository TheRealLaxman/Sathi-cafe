import { useCallback, useRef, useState } from 'react'
import DialogBox from '../components/DialogBox'

// Manage dialog state and promise-based helpers.
export function useDialog() {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const open = useCallback(
    (config) =>
      new Promise((resolve) => {
        resolver.current = resolve
        setState(config)
      }),
    []
  )

  const close = useCallback((result) => {
    resolver.current?.(result)
    resolver.current = null
    setState(null)
  }, [])

  const confirm = (message, options = {}) => open({ type: 'confirm', message, ...options })

  const prompt = (message, defaultValue = '', options = {}) =>
    open({ type: 'prompt', message, defaultValue, ...options })

  const dialog = state ? <DialogBox state={state} onClose={close} /> : null

  return { dialog, confirm, prompt }
}
