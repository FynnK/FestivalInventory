import { Database } from 'lucide-react'
import { useI18n } from '../i18n'

export default function TopBar({ itemCount }: { itemCount: number }) {
  const { t } = useI18n()

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border">
      <div className="flex items-center gap-2 mr-4">
        <Database size={20} className="text-primary" />
        <h1 className="text-lg font-extrabold tracking-tight text-foreground">{t('topbar_app_title')}</h1>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-900/30 text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {t('topbar_item_count', { count: itemCount })}
      </span>
    </header>
  )
}
