import { motion, useReducedMotion } from 'motion/react'
import { type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation()
  const prefersReduced = useReducedMotion()
  const isKanban = location.pathname === '/' || location.pathname === '/kanban'

  return (
    <motion.div
      key={location.pathname}
      tabIndex={isKanban ? undefined : 0}
      initial={prefersReduced ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReduced
          ? { duration: 0 }
          : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }
      }
      className={cn(
        'flex-1 flex flex-col h-full w-full min-h-0',
        isKanban ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar',
      )}
    >
      {children}
    </motion.div>
  )
}
