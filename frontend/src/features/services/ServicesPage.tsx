import { motion } from 'motion/react'
import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppWindow,
  BarChart3,
  Cpu,
  FileSpreadsheet,
  Headset,
  KeyRound,
  Monitor,
  Mouse,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useServicesQuery } from '@/hooks/useServices'
import type { Service } from '@/lib/api/types'

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

        <div className="flex flex-1 items-center justify-between gap-2 flex-wrap">
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
  const navigate = useNavigate()
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
    <div className="space-y-6 overflow-y-auto pr-1 pb-6">
      <PageHeader
        title="Catálogo de Servicios"
        description="Servicios destacados con enrutamiento técnico automático y estructura jerárquica ITIL."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Servicios' }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {services && services.length > 0 ? (
              <>
                <Button variant="outline" size="sm" onClick={expandAll}>
                  Expandir todo
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  Colapsar todo
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      {/* Tarjetas de Servicios Destacados */}
      <section aria-labelledby="featured-services-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="featured-services-heading" className="text-base font-semibold tracking-tight">
              Servicios Destacados
            </h2>
            <p className="text-xs text-muted-foreground">
              Consulta los tickets por servicio. Las solicitudes nuevas se crean en el portal GLPI.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            8 servicios
          </Badge>
        </div>

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
                className="flex flex-col justify-between border-border/70 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="p-4 pb-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <Badge variant="outline" className="text-[11px]">
                      {item.areaLabel}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold leading-snug">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground truncate" title={item.categoryPath}>
                    {item.categoryPath}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2.5 text-xs shrink-0"
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
