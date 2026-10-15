import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

const CUBIC_BEZIER: [number, number, number, number] = [0.16, 1, 0.3, 1]

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()

  const transition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.2, ease: CUBIC_BEZIER }

  return (
    <motion.div
      key={location.pathname}
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? undefined : { opacity: 0 }}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}
