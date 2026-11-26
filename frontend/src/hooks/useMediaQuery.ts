import { useEffect, useState } from 'react'

/**
 * Suscribe un componente a una media query CSS. Responde tanto a cambios de
 * ventana como al zoom nativo del navegador (el zoom modifica los CSS px
 * disponibles y dispara `change`), por lo que no depende de `resize` ni de
 * `window.innerWidth`.
 */
export function useMediaQuery(query: string): boolean {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false
  const [matches, setMatches] = useState<boolean>(getMatch)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
