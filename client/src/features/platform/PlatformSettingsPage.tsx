import { Settings } from 'lucide-react'
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export function PlatformSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configuración de Plataforma" subtitle="Ajustes globales del sistema" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-navy-600" />
            <CardTitle>General</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-slate-800">Modo de mantenimiento</p>
                <p className="text-xs text-slate-400">Desactiva el acceso público a la plataforma</p>
              </div>
              <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 shadow" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-slate-800">Registro abierto</p>
                <p className="text-xs text-slate-400">Permite el auto-registro de nuevas academias</p>
              </div>
              <div className="w-10 h-6 bg-navy-600 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">Notificaciones globales</p>
                <p className="text-xs text-slate-400">Envía notificaciones a todos los usuarios</p>
              </div>
              <div className="w-10 h-6 bg-navy-600 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
