import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useReducedMotion } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReduced || !containerRef.current) return
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.18,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        },
      )
    },
    { dependencies: [location.pathname, prefersReduced] },
  )

  return <div ref={containerRef}>{children}</div>
}
