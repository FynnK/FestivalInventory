import { Download, Upload, FileSpreadsheet, Database, Sun, Moon, Cog, Globe } from 'lucide-react'
import { useI18n, type Locale } from '../i18n'

export default function TopBar({
  itemCount,
  onExportJson,
  onImportJson,
  onExportExcel,
  onSeed,
  darkMode,
  onToggleDark,
}: {
  itemCount: number
  onExportJson: () => void
  onImportJson: () => void
  onExportExcel: () => void
  onSeed: () => void
  darkMode: boolean
  onToggleDark: () => void
}) {
  const { t, locale, setLocale } = useI18n()

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'de' : 'en')
  }

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
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <button onClick={onSeed} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors">
          <Cog size={14} className="inline mr-1" />{t('topbar_seed_button')}
        </button>
        <button onClick={onExportJson} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors">
          <Download size={14} className="inline mr-1" />{t('topbar_export_button')}
        </button>
        <button onClick={onImportJson} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors">
          <Upload size={14} className="inline mr-1" />{t('topbar_import_button')}
        </button>
        <button onClick={onExportExcel} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors">
          <FileSpreadsheet size={14} className="inline mr-1" />{t('topbar_excel_button')}
        </button>
        <div className="w-px h-5 bg-border mx-1" />
        <button onClick={toggleLocale} className="px-2 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors" title={locale === 'en' ? 'Deutsch' : 'English'}>
          <Globe size={14} className="inline mr-1" />{locale.toUpperCase()}
        </button>
        <button onClick={onToggleDark} className="p-1.5 text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
