import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={prefersReduced ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
        }
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
