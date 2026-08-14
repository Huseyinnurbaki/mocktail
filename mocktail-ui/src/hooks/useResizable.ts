import { useEffect, useState } from 'react'

/** A width value with a drag handle, persisted to localStorage under `key`. */
export function useResizable(key: string, initial: number, min: number, max: number) {
  const [width, setWidth] = useState(() => {
    try {
      const v = Number(localStorage.getItem(key))
      return v >= min && v <= max ? v : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, String(width))
    } catch {
      /* storage disabled */
    }
  }, [key, width])

  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => setWidth(Math.min(max, Math.max(min, window.innerWidth - ev.clientX)))
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return { width, startResize }
}
