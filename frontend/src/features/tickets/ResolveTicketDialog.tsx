import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCompleteTicketTaskMutation, useResolveTicketMutation, useTicketResolveEligibilityQuery, useTicketTasksQuery } from '@/hooks/useTickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'

export function ResolveTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<{ content: string }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { content: '' },
  })
  const content = watch('content')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskError, setTaskError] = useState('')
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const resolveTicket = useResolveTicketMutation()
  const completeTask = useCompleteTicketTaskMutation()
  const pushToast = useToastStore((state) => state.push)
  const { data: eligibility } = useTicketResolveEligibilityQuery(
    ticketId,
    open && ticketId > 0,
  )
  const { data: tasks } = useTicketTasksQuery(ticketId, open && ticketId > 0)
  const pendingTasks = (tasks ?? []).filter((t) => t.state === 1)

  /**
   * Synchronous in-flight guard. `resolveTicket.isPending` only becomes true after
   * React re-renders, so a fast double click could fire two requests before the
   * button is actually disabled. The second request would be rejected by the API
   * with 409 and the technician would see a spurious error toast. This ref flips
   * the moment the handler starts, so the second click is dropped immediately.
   */
  const submittingRef = useRef(false)

  const trimmed = content.trim()
  const pending = resolveTicket.isPending || isSubmitting || completeTask.isPending
  // Short solutions are valid ("OK", "Listo"); only an empty one blocks the ticket.
  const hasError = Boolean(errors.content)

  /**
   * Closes the dialog unconditionally (never gated on `pending`). Used after a
   * successful mutation so the modal always dismisses on mobile, where the ticket
   * may have moved to the "Resuelto" column underneath.
   */
  const closeDialog = () => {
    reset()
    onOpenChange(false)
  }

  /**
   * Resolves the ticket with a single call (BUG-031 / H-31).
   *
   * `POST /tickets/{id}/resolve` writes the solution, moves the ticket to its
   * resolved state and emits one realtime event. The previous two-call sequence
   * ("POST /solutions" then "PATCH /status") made the same technician action fail
   * with 400/422, because GLPI already solves the ticket when the solution is
   * written and the solution-presence query applied a minimum length the API never
   * enforced. One call removes the inconsistency by construction.
   */
  const submit = async () => {
    if (submittingRef.current || trimmed.length === 0) {
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)

    let resolvedStatus: number
    try {
      const result = await resolveTicket.mutateAsync({
        ticketId,
        content: trimmed,
        completePendingTasks: false,
      })
      resolvedStatus = result.status
    } catch (err) {
      // The ticket may still have been solved server-side (e.g. the write succeeded
      // but the response was lost), so always refresh before reporting the failure.
      void queryClient.invalidateQueries({ queryKey: ['tickets'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      pushToast({
        title: getApiErrorTitle(err, 'No se pudo resolver el ticket'),
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
      return
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }

    closeDialog()
    void queryClient.invalidateQueries({ queryKey: ['tickets'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    pushToast({
      title: resolvedStatus === 6 ? 'Ticket cerrado correctamente' : 'Ticket resuelto correctamente',
      description: resolvedStatus === 6
        ? `El ticket #${ticketId} figura como Cerrado en GLPI.`
        : `El ticket #${ticketId} figura como Resuelto en GLPI. El cierre automático depende de la configuración de la entidad y de la tarea closeticket.`,
      variant: 'success',
    })
  }

  return (
    <Dialog
      className="rounded-2xl bg-card"
      open={open}
      onClose={() => {
        // Backdrop / Escape: keep the dialog open while the resolve is in flight so the
        // user cannot dismiss it mid-flight and lose the operation's result.
        if (!pending) {
          closeDialog()
        }
      }}
      title={`Resolver ticket #${ticketId}`}
      description="Escribí la solución. Puede ser breve (por ejemplo «OK»), pero no puede quedar vacía: sin solución el ticket no puede marcarse como resuelto."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        {taskError && <p role="alert" className="mb-3 text-sm text-red-700 dark:text-red-400">{taskError}</p>}
        {pendingTasks.length > 0 ? (
          <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-2">
            <p className="font-semibold">Tareas pendientes por hacer ({pendingTasks.length})</p>
            <p className="text-muted-foreground">
              Un ticket no puede finalizar con tareas inconclusas. Completa cada tarea pendiente antes de registrar la solución.
            </p>
            <div className="space-y-1.5 pt-1">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/60 p-2 border border-border/40">
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    Tarea #{task.id}: {task.content ? task.content.replace(/<[^>]+>/g, '').slice(0, 35) : 'Planificada'}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-11 shrink-0 px-2 text-xs"
                    disabled={pending || !(user?.role === 'admin' || user?.role === 'supervisor' || user?.userId === task.technicianId)}
                    title={user?.role === 'technician' && user.userId !== task.technicianId
                      ? 'Esta tarea pertenece a otro técnico. Solicita al supervisor que revise el responsable.' : undefined}
                    onClick={async () => {
                      setTaskError('')
                      try {
                        await completeTask.mutateAsync({ ticketId, taskId: task.id })
                        void queryClient.invalidateQueries({ queryKey: ['tickets', 'tasks', ticketId] })
                        void queryClient.invalidateQueries({ queryKey: ['tickets', 'resolve-eligibility', ticketId] })
                        pushToast({ title: `Tarea #${task.id} completada`, variant: 'success' })
                      } catch (err) {
                        setTaskError(getApiErrorMessage(err))
                        pushToast({ title: getApiErrorTitle(err, 'No se pudo completar la tarea'),
                          description: getApiErrorMessage(err), variant: 'destructive' })
                      }
                    }}
                  >
                    ✓ Completar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : eligibility && !eligibility.canResolve ? (
          <div className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <p className="font-semibold">Requisitos de resolución no cumplidos</p>
            <p className="mt-0.5">{eligibility.reason}</p>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="resolve-solution">Solución</Label>
          <Textarea
            id="resolve-solution"
            maxLength={2000}
            {...register('content', { validate: (value) => value.trim().length > 0 || 'La solución no puede estar vacía.' })}
            placeholder="Describí la solución aplicada..."
            className={cn('min-h-[120px] rounded-xl bg-background/50', hasError && 'border-destructive focus-visible:ring-destructive')}
            aria-invalid={hasError}
            aria-describedby={hasError ? 'solution-error' : undefined}
          />
          <div className="flex items-center justify-between text-xs">
            {hasError ? (
              <p id="solution-error" role="alert" className="text-red-700 dark:text-red-400">
                La solución no puede estar vacía.
              </p>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground ml-auto">
              {content.length} / 2000
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={closeDialog}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              pending ||
              pendingTasks.length > 0 ||
              (eligibility != null && !eligibility.canResolve)
            }
          >
            {pending ? 'Guardando...' : 'Resolver'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
