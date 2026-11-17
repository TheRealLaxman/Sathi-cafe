import { useEffect, useState } from 'react'

export default function DialogBox({ state, onClose }) {
  const [value, setValue] = useState(state.defaultValue ?? '')
  const isPrompt = state.type === 'prompt'
  const cancelResult = isPrompt ? null : false

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose(cancelResult)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, cancelResult])

  const submit = (e) => {
    e.preventDefault()
    onClose(isPrompt ? value : true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose(cancelResult)}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-cream rounded-2xl p-6 shadow-2xl border border-chai/20"
      >
        <h2 className="font-display text-2xl font-bold text-ink">
          {state.title || (isPrompt ? 'Enter a value' : 'Are you sure?')}
        </h2>
        <p className="mt-2 text-ink/70 whitespace-pre-line">{state.message}</p>

        {isPrompt && (
          <input
            autoFocus
            type={state.inputType || 'text'}
            min={state.inputType === 'number' ? 0 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={state.placeholder}
            className="mt-4 w-full rounded-xl border border-chai/30 bg-white/70 px-3 py-2 focus:outline-none focus:border-chai"
          />
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose(cancelResult)}
            className="px-4 py-2 rounded-full border border-chai/30 text-sm hover:border-chai transition-colors"
          >
            {state.cancelLabel || 'Cancel'}
          </button>
          <button
            type="submit"
            autoFocus={!isPrompt}
            className={`px-5 py-2 rounded-full text-sm font-medium text-cream transition-colors ${
              state.danger ? 'bg-brick hover:bg-ink' : 'bg-chai hover:bg-brick'
            }`}
          >
            {state.confirmLabel || 'OK'}
          </button>
        </div>
      </form>
    </div>
  )
}