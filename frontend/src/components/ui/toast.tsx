import { Toaster as SonnerToaster } from 'sonner'

import { useIsMobile } from '@/hooks/useIsMobile'
import { MAX_VISIBLE_TOASTS } from '@/store/toastStore'

/**
 * Unified Sonner Toaster (H-42 / H-60):
 * - Desktop: `top-right`
 * - Mobile: `top-center` (con offset para no tapar el header)
 * - Max 3 visible toasts stacked with 8px gap
 */
export function Toaster() {
  const isMobile = useIsMobile(768)

  return (
    <div data-testid="toast-container">
      <SonnerToaster
        position={isMobile ? 'top-center' : 'top-right'}
        visibleToasts={MAX_VISIBLE_TOASTS}
        gap={8}
        expand={true}
        closeButton={false}
        offset={isMobile ? { top: 68 } : { top: 68, right: 16 }}
        mobileOffset={{ top: 68 }}
        toastOptions={{
          unstyled: true,
        }}
      />
    </div>
  )
}
