import { motion } from 'motion/react'
import { useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useClaimTicketMutation,
  useGroupQueueQuery,
  useGroupsQuery,
} from '@/hooks/useTickets'
import { useRole } from '@/hooks/useRole'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils' 
import { priorityMeta } from '@/features/tickets/labels'
import { useToastStore } from '@/store/toastStore'

function GroupQueueCard({
  ticket,
  groupName,
  onClaim,
  pending,
}: {
  ticket: TicketSummary
  groupName?: string
  onClaim: (id: number) => void
  pending: boolean
}) {
  const priority = priorityMeta(ticket.priority)
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">#{ticket.id}</span>
            <span className="truncate font-medium">{ticket.title}</span>
            {groupName ? (
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {groupName}
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn('rounded px-2 py-0.5 font-medium', priority.badgeClass)}>{priority.label}</span>
            <span className="text-muted-foreground">Urgencia {ticket.urgency} · Impacto {ticket.impact}</span>
            <span className="text-muted-foreground">· {formatRelative(ticket.createdAt)}</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => onClaim(ticket.id)}
          disabled={pending}
          className="min-w-[105px] shrink-0"
        >
          {pending ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Asignando…
            </span>
          ) : (
            'Asignarme'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

import { useSearchParams } from 'react-router-dom'

export function GroupQueuePage() {
  const toast = useToastStore((state) => state.push)
  const groups = useGroupsQuery()
  const { isTechnician } = useRole()
  const [searchParams] = useSearchParams()
  const paramGroupId = searchParams.get('groupId') ? Number(searchParams.get('groupId')) : null
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [claimingTicketId, setClaimingTicketId] = useState<number | null>(null)

  const effectiveGroupId =
    selectedGroupId ?? paramGroupId ?? (groups.data && groups.data.length > 0 ? groups.data[0].id : null)

  const effectiveGroup = groups.data?.find((g) => g.id === effectiveGroupId)

  const queue = useGroupQueueQuery(effectiveGroupId)
  const claim = useClaimTicketMutation()

  const handleClaim = (ticketId: number) => {
    setClaimingTicketId(ticketId)
    claim.mutate(ticketId, {
      onSuccess: () => {
        setClaimingTicketId(null)
        toast({
          title: 'Ticket asignado correctamente',
          description: `Te has asignado el ticket #${ticketId}`,
          variant: 'success',
        })
      },
      onError: (err) => {
        setClaimingTicketId(null)
        toast({
          title: 'No se pudo asignar el ticket',
          description: getApiErrorMessage(err),
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cola de mi grupo"
        description="Tickets sin asignar del grupo seleccionado."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Cola' }]}
        actions={
          isTechnician ? (
            // H-36: a technician belongs to a single group; no selector, fixed label.
            <span
              className="inline-flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium"
              data-testid="technician-group-label"
            >
              Grupo: {effectiveGroup ? effectiveGroup.name : '…'}
            </span>
          ) : groups.data && groups.data.length > 1 ? (
            <Select
              aria-label="Seleccionar grupo de soporte"
              value={effectiveGroupId ? String(effectiveGroupId) : undefined}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              className="w-56"
            >
              {groups.data.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {groups.isLoading || queue.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : groups.isError || queue.isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {getApiErrorMessage(groups.error ?? queue.error)}
        </p>
      ) : queue.data?.items && queue.data.items.length > 0 ? (
        <div className="space-y-3">
          {queue.data.items.map((ticket) => (
            <GroupQueueCard
              key={ticket.id}
              ticket={ticket}
              groupName={effectiveGroup?.name}
              onClaim={handleClaim}
              pending={claimingTicketId === ticket.id}
            />
          ))}
        </div>
      ) : (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground"
        >
          No hay tickets sin asignar en tu grupo.
        </motion.p>
      )}
    </div>
  )
}