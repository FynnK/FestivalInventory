import { Database, Warehouse, Tent, History, BarChart3, Settings } from 'lucide-react'
import { useI18n } from '../i18n'

const tabs = [
  { id: 'inventory', icon: Warehouse, labelKey: 'tab_inventory' },
  { id: 'stages', icon: Tent, labelKey: 'tab_stages' },
  { id: 'transactions', icon: History, labelKey: 'tab_ledger' },
  { id: 'reports', icon: BarChart3, labelKey: 'tab_reports' },
  { id: 'settings', icon: Settings, labelKey: 'sidebar_settings_heading' },
]

export default function TopBar({
  itemCount,
  view,
  onViewChange,
}: {
  itemCount: number
  view: string
  onViewChange: (v: string) => void
}) {
  const { t } = useI18n()

  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-2 mr-2 shrink-0">
        <Database size={20} className="text-primary" />
        <h1 className="text-base font-extrabold tracking-tight text-foreground">{t('topbar_app_title')}</h1>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {t('topbar_item_count', { count: itemCount })}
      </span>
      <div className="flex-1 min-w-0" />
      <div className="flex flex-wrap items-center gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <tab.icon size={14} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
    </header>
  )
}
