import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1]

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()

  const transition = prefersReduced
    ? { duration: 0 }
    : { duration: 0.18, ease: EASE_OUT_STRONG }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={prefersReduced ? false : { opacity: 0, transform: 'translateY(6px)' }}
        animate={{ opacity: 1, transform: 'translateY(0px)' }}
        exit={prefersReduced ? undefined : { opacity: 0, transform: 'translateY(-4px)' }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
