/**
 * Central TanStack Query cache keys, so every hook invalidates the same strings.
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  tickets: {
    all: ['tickets'] as const,
    byAssignee: (assigneeId: number) => ['tickets', 'assignee', assigneeId] as const,
    detail: (id: number) => ['tickets', 'detail', id] as const,
  },
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
  },
} as const
