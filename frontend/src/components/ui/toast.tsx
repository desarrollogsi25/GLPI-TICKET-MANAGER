import { Toaster as SonnerToaster } from 'sonner'

import { useIsMobile } from '@/hooks/useIsMobile'
import { MAX_VISIBLE_TOASTS } from '@/store/toastStore'

/**
 * Unified Sonner Toaster (H-42):
 * - Desktop: `top-right`
 * - Mobile: `bottom-center`
 * - Max 3 visible toasts stacked with 8px gap
 */
export function Toaster() {
  const isMobile = useIsMobile(768)

  return (
    <div data-testid="toast-container">
      <SonnerToaster
        position={isMobile ? 'bottom-center' : 'top-right'}
        visibleToasts={MAX_VISIBLE_TOASTS}
        gap={8}
        expand={true}
        closeButton={false}
        offset={16}
        mobileOffset={16}
        toastOptions={{
          unstyled: true,
        }}
      />
    </div>
  )
}
