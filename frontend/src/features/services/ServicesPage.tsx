import { motion } from 'motion/react'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useServicesQuery } from '@/hooks/useServices'
import type { Service } from '@/lib/api/types'

interface ServiceNode extends Service {
  children: ServiceNode[]
}

function buildTree(services: Service[]): ServiceNode[] {
  const map = new Map<number, ServiceNode>()
  const roots: ServiceNode[] = []

  // Initialize all nodes
  for (const item of services) {
    map.set(item.id, { ...item, children: [] })
  }

  // Link children to parents
  for (const item of services) {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

interface ServiceTreeNodeProps {
  node: ServiceNode
  level?: number
  expandedIds: Set<number>
  toggleExpand: (id: number) => void
}

function ServiceTreeNode({ node, level = 0, expandedIds, toggleExpand }: ServiceTreeNodeProps) {
  const navigate = useNavigate()
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center gap-2 rounded-md py-2 px-3 transition-colors hover:bg-muted/50"
        style={{ paddingLeft: `${Math.max(level * 24 + 12, 12)}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleExpand(node.id)}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted text-muted-foreground transition-transform"
            aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center text-muted-foreground/40">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>
        )}

        <div className="flex flex-1 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${level === 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'}`}>
              {node.name}
            </span>
            {hasChildren && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground font-medium">
                {node.children.length} {node.children.length === 1 ? 'subservicio' : 'subservicios'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Nivel {node.level}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/tickets?serviceId=${node.id}`)}
              className="h-7 px-2 text-xs"
              title={`Ver tickets de ${node.name}`}
            >
              Ver tickets
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-border/40 ml-6 pl-1 flex flex-col gap-0.5">
          {node.children.map((child) => (
            <ServiceTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ServicesPage() {
  const { data: services, isLoading, isError, error, refetch } = useServicesQuery()
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  // Default: all categories expanded once data is loaded
  useEffect(() => {
    if (services && services.length > 0) {
      setExpandedIds(new Set(services.map((s) => s.id)))
    }
  }, [services])

  const tree = useMemo(() => {
    if (!services) return []
    return buildTree(services)
  }, [services])

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    if (services) {
      setExpandedIds(new Set(services.map((s) => s.id)))
    }
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Servicios"
        description="Estructura jerárquica de categorías ITIL sincronizadas desde GLPI."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Servicios' }]}
        actions={
          services && services.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expandir todo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Colapsar todo
              </Button>
            </div>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categorías ITIL</CardTitle>
          <CardDescription>
            Árbol navegable de servicios disponibles para clasificación de tickets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3 py-2">
              <Skeleton className="h-9 w-full" />
              <div className="pl-6 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-2/3" />
              </div>
              <Skeleton className="h-9 w-full" />
              <div className="pl-6 space-y-2">
                <Skeleton className="h-8 w-4/5" />
              </div>
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm text-destructive">
                Error al cargar el catálogo de servicios: {error?.message || 'Error desconocido'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {!isLoading && !isError && (!services || services.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="py-12 text-center text-sm text-muted-foreground"
            >
              No hay servicios configurados
            </motion.div>
          )}

          {!isLoading && !isError && tree.length > 0 && (
            <div className="divide-y divide-border/20 rounded-md border border-border/50 bg-card p-2">
              {tree.map((node) => (
                <ServiceTreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
