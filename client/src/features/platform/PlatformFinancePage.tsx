import { useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'

import { platformApi } from '@/lib/api/platform'
import { PageHeader, Card, CardContent, EmptyState, Skeleton } from '@/components/ui'

export function PlatformFinancePage() {
  const { data: finance, isLoading } = useQuery({
    queryKey: ['platform.finance'],
    queryFn: () => platformApi.consolidatedFinance(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzas Consolidadas" subtitle="Vista global de todas las academias" />

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : !finance || (finance as unknown[]).length === 0 ? (
        <EmptyState
          icon={<BarChart3 />}
          title="Sin datos financieros"
          description="Los datos consolidados estarán disponibles cuando las academias registren transacciones"
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">
              Dashboard financiero consolidado con datos de todas las academias de la plataforma.
            </p>
            {/* Additional charts and tables would go here */}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
