'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function CustomSelect({
  value,
  onChange,
  options,
  label,
  id,
  name,
  required,
  'aria-invalid': ariaInvalid,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label: string
  id: string
  name?: string
  required?: boolean
  'aria-invalid'?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectOption(opt: string) {
    onChange(opt)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setActiveIndex(options.indexOf(value))
      }
      return
    }
    switch (e.key) {
      case 'Escape':
        setOpen(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (activeIndex >= 0) selectOption(options[activeIndex])
        break
    }
  }

  return (
    <div className="custom-select" ref={rootRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        aria-label={label}
        aria-invalid={ariaInvalid}
        aria-required={required}
        className={`custom-select-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        <span>{value}</span>
        <ChevronDown size={17} className={`custom-select-chevron${open ? ' open' : ''}`} />
      </button>
      {open && (
        <ul id={`${id}-listbox`} className="custom-select-dropdown" role="listbox" aria-label={label}>
          {options.map((opt, i) => (
            <li
              key={opt}
              role="option"
              aria-selected={opt === value}
              className={`custom-select-option${opt === value ? ' selected' : ''}${i === activeIndex ? ' highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                selectOption(opt)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
