import { useEffect, useRef, useState } from 'react'
import type { Provider } from '../config'
import { PROVIDER_META, getProviderMeta } from '../config'

interface ModelSelectorProps {
  provider: Provider
  disabled?: boolean
  onChange: (provider: Provider) => void
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`shrink-0 text-[#8e8e8e] transition-transform duration-500 ease-in-out ${
        open ? 'rotate-180' : ''
      }`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ModelSelector({ provider, disabled, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = getProviderMeta(provider)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const select = (id: Provider) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative flex justify-center">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`model-selector-trigger flex items-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#2f2f2f] px-3.5 py-2 text-left shadow-sm transition-all duration-500 ease-in-out hover:border-[#4a4a4a] hover:bg-[#353535] disabled:opacity-50 ${
          open ? 'border-[#5a5a5a] bg-[#353535] ring-1 ring-[#4a4a4a]/50' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-[#ececec]">{current.fullName}</span>
          <span className="text-[11px] text-[#8e8e8e] truncate max-w-[220px] sm:max-w-[280px]">
            {current.vendor} · {current.modelId}
          </span>
        </span>
        <IconChevron open={open} />
      </button>

      <div
        role="listbox"
        className={`absolute bottom-full left-1/2 z-50 mb-2 w-[min(100%,320px)] -translate-x-1/2 origin-bottom transition-all duration-500 ease-in-out ${
          open
            ? 'pointer-events-auto scale-100 opacity-100 translate-y-0'
            : 'pointer-events-none scale-95 opacity-0 translate-y-2'
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#2f2f2f] py-1 shadow-xl shadow-black/40">
          {PROVIDER_META.map((p) => {
            const active = p.id === provider
            return (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => select(p.id)}
                className={`model-selector-option flex w-full flex-col px-3.5 py-2.5 text-left transition-all duration-500 ease-in-out ${
                  active
                    ? 'bg-[#3a3a3a] text-[#ececec]'
                    : 'text-[#c5c5c5] hover:bg-[#353535] hover:text-[#ececec]'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{p.fullName}</span>
                  {active && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="shrink-0 text-[#10a37f]"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className="mt-0.5 text-[11px] text-[#8e8e8e]">{p.vendor}</span>
                <span className="mt-0.5 font-mono text-[10px] text-[#6a6a6a]">{p.modelId}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
