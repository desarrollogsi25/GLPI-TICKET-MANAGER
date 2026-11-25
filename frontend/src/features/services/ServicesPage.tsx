import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppWindow,
  BarChart3,
  ChevronRight,
  Cpu,
  FileSpreadsheet,
  FolderTree,
  Headset,
  KeyRound,
  Monitor,
  Mouse,
  Search,
  X,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { useServicesQuery } from '@/hooks/useServices'
import type { Service } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface FeaturedServiceCardDef {
  id: string
  title: string
  description: string
  categoryId: number
  categoryPath: string
  areaLabel: string
  icon: React.ComponentType<{ className?: string }>
}

const FEATURED_SERVICES: FeaturedServiceCardDef[] = [
  {
    id: 'req-sd',
    title: 'Requerimiento Service Desk',
    description: 'Solicitud de requerimientos como fichas del CRM, Accesos de Capacitación, etc.',
    categoryId: 7,
    categoryPath: 'Service Desk',
    areaLabel: 'Service Desk',
    icon: Headset,
  },
  {
    id: 'req-bi',
    title: 'Requerimiento BI',
    description: 'Solicitud de requerimientos dirigidos al área de BI, reportes y tableros analíticos.',
    categoryId: 14,
    categoryPath: 'BI > Requerimiento BI',
    areaLabel: 'BI',
    icon: BarChart3,
  },
  {
    id: 'app-gsi',
    title: 'Aplicaciones GSI',
    description: 'Ticket relacionado con las incidencias presentadas por los aplicativos internos y corporativos.',
    categoryId: 9,
    categoryPath: 'Desarrollo > Aplicaciones GSI',
    areaLabel: 'Desarrollo',
    icon: AppWindow,
  },
  {
    id: 'perifericos',
    title: 'Periféricos',
    description: 'Ticket relacionado a los problemas que se presentan con los periféricos (teclado, mouse, lector, etc.).',
    categoryId: 19,
    categoryPath: 'Service Desk > Periféricos',
    areaLabel: 'Service Desk',
    icon: Mouse,
  },
  {
    id: 'hardware',
    title: 'Hardware',
    description: 'Ticket relacionado a los problemas que se presentan con el Monitor, PC, fuentes o componentes físicos.',
    categoryId: 16,
    categoryPath: 'Service Desk > Hardware',
    areaLabel: 'Service Desk',
    icon: Monitor,
  },
  {
    id: 'software',
    title: 'Software',
    description: 'Ticket relacionado con las incidencias que se presentan en software base, ofimática y sistemas operativos.',
    categoryId: 4,
    categoryPath: 'Desarrollo > Software',
    areaLabel: 'Desarrollo',
    icon: Cpu,
  },
  {
    id: 'informes',
    title: 'Informes',
    description: 'Ticket relacionado con las incidencias que se presentan en los informes, extracciones de datos o planillas.',
    categoryId: 18,
    categoryPath: 'BI > Informes',
    areaLabel: 'BI',
    icon: FileSpreadsheet,
  },
  {
    id: 'acceso-sistema',
    title: 'Acceso a sistema',
    description: 'Solicitud de altas de usuario, permisos, credenciales y accesos a sistemas corporativos.',
    categoryId: 3,
    categoryPath: 'Requerimiento > Acceso a sistema',
    areaLabel: 'Service Desk',
    icon: KeyRound,
  },
]

interface ServiceNode extends Service {
  children: ServiceNode[]
}

function buildTree(services: Service[]): ServiceNode[] {
  const map = new Map<number, ServiceNode>()
  const roots: ServiceNode[] = []

  for (const item of services) {
    map.set(item.id, { ...item, children: [] })
  }

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

function filterTree(nodes: ServiceNode[], term: string): ServiceNode[] {
  if (!term) return nodes
  const lower = term.toLowerCase()
  const filtered: ServiceNode[] = []
  for (const node of nodes) {
    const matchingChildren = filterTree(node.children, term)
    if (
      node.name.toLowerCase().includes(lower) ||
      node.completeName.toLowerCase().includes(lower) ||
      matchingChildren.length > 0
    ) {
      filtered.push({ ...node, children: matchingChildren })
    }
  }
  return filtered
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
        className="flex items-center gap-2 rounded-lg py-2 px-3 transition-colors hover:bg-muted/60"
        style={{ paddingLeft: `${Math.max(level * 22 + 10, 10)}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggleExpand(node.id)}
            className="flex size-6 items-center justify-center rounded hover:bg-muted text-muted-foreground cursor-pointer"
            aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
            aria-expanded={isExpanded}
          >
            <ChevronRight
              className={cn('size-4 transition-transform duration-150', isExpanded && 'rotate-90')}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="flex size-6 items-center justify-center text-muted-foreground/40" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-current" />
          </span>
        )}

        <div className="flex flex-1 items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm', level === 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/90')}>
              {node.name}
            </span>
            {hasChildren && (
              <Badge variant="secondary" className="text-[11px] font-medium">
                {node.children.length} {node.children.length === 1 ? 'subservicio' : 'subservicios'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Nivel {node.level}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/tickets?serviceId=${node.id}`)}
              className="h-7 px-2.5 text-xs cursor-pointer"
              title={`Ver tickets de ${node.name}`}
            >
              Ver tickets
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-border/60 ml-5 pl-1 flex flex-col gap-0.5">
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
  const navigate = useNavigate()
  const { data: services, isLoading, isError, error, refetch } = useServicesQuery()
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [treeSearch, setTreeSearch] = useState('')

  useEffect(() => {
    if (services && services.length > 0) {
      setExpandedIds(new Set(services.map((s) => s.id)))
    }
  }, [services])

  const tree = useMemo(() => {
    if (!services) return []
    return buildTree(services)
  }, [services])

  const filteredTree = useMemo(() => filterTree(tree, treeSearch.trim()), [tree, treeSearch])

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
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Catálogo de Servicios"
        description="Servicios destacados con enrutamiento técnico automático y estructura jerárquica ITIL."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Servicios' }]}
        actions={
          services && services.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
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

      {/* Featured Corporate Services */}
      <section aria-labelledby="featured-services-heading" className="space-y-3">
        <SectionHeader
          id="featured-services-heading"
          title="Servicios Destacados"
          description="Consulta tickets filtrados por servicio. Las solicitudes nuevas se crean en el portal GLPI."
          count="8 servicios"
        />

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="featured-services-grid"
        >
          {FEATURED_SERVICES.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.id}
                data-testid={`featured-service-card-${item.id}`}
                className="flex flex-col justify-between border-border shadow-xs transition-colors hover:border-primary/40"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-surface-subtle border border-border text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {item.areaLabel}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold leading-snug">{item.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex items-center justify-between gap-2 border-t border-border/50 mt-2">
                  <span className="text-[11px] text-muted-foreground truncate" title={item.categoryPath}>
                    {item.categoryPath}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2.5 text-xs shrink-0 cursor-pointer"
                    onClick={() => navigate(`/tickets?serviceId=${item.categoryId}`)}
                    data-testid={`featured-service-open-${item.id}`}
                  >
                    Ver tickets
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ITIL Hierarchy Tree with Quick Search */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FolderTree className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>Categorías ITIL</span>
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Árbol navegable de servicios disponibles para clasificación de tickets.
            </CardDescription>
          </div>
          {services && services.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="Filtrar categoría ITIL…"
                aria-label="Filtrar categoría ITIL"
                className="h-8 pl-8 pr-7 text-xs"
              />
              {treeSearch && (
                <button
                  type="button"
                  onClick={() => setTreeSearch('')}
                  aria-label="Limpiar búsqueda de categoría"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading && (
            <div className="space-y-3 py-2">
              <Skeleton className="h-9 w-full" />
              <div className="pl-6 space-y-2">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-8 w-2/3" />
              </div>
              <Skeleton className="h-9 w-full" />
            </div>
          )}

          {isError && (
            <ErrorState
              message={`Error al cargar el catálogo de servicios: ${error?.message || 'Error desconocido'}`}
              onRetry={() => void refetch()}
            />
          )}

          {!isLoading && !isError && (!services || services.length === 0) && (
            <EmptyState icon={FolderTree} compact title="No hay servicios configurados" />
          )}

          {!isLoading && !isError && services && services.length > 0 && filteredTree.length === 0 && (
            <EmptyState
              icon={Search}
              compact
              title="Sin categorías coincidentes"
              description={`No se encontraron categorías para "${treeSearch}".`}
              action={
                <Button size="sm" variant="outline" onClick={() => setTreeSearch('')}>
                  Limpiar búsqueda
                </Button>
              }
            />
          )}

          {!isLoading && !isError && filteredTree.length > 0 && (
            <div className="divide-y divide-border/30 rounded-lg border border-border/70 bg-card p-1.5">
              {filteredTree.map((node) => (
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
