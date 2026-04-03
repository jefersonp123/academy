import { useAuthStore } from '@/store/authStore'
import { UserMenu } from './UserMenu'

export function PlatformTopbar() {
  const { user } = useAuthStore()

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-30">
      <h1 className="text-sm font-semibold text-slate-700">Panel de Plataforma</h1>
      <UserMenu />
    </header>
  )
}
