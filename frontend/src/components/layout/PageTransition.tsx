import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      key={location.pathname}
      initial={prefersReduced ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }
      }
    >
      {children}
    </motion.div>
  )
}
