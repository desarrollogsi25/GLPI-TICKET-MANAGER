import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/format'

export interface BarChartDatum {
  label: string
  value: number
}

interface BarChartProps {
  title: string
  description?: string
  data: BarChartDatum[]
}

/** Simple dependency-free horizontal bar chart. */
export function BarChart({ title, description, data }: BarChartProps) {
  const max = Math.max(1, ...data.map((datum) => datum.value))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          data.map((datum) => (
            <div key={datum.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{datum.label}</span>
                <span className="text-muted-foreground">{formatNumber(datum.value)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(datum.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
