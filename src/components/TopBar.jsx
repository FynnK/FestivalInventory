import { Download, Upload, FileSpreadsheet, Database, Sun, Moon, Cog } from 'lucide-react'

export default function TopBar({
  itemCount,
  onExportJson,
  onImportJson,
  onExportExcel,
  onSeed,
  darkMode,
  onToggleDark,
}) {
  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border">
      <div className="flex items-center gap-2 mr-4">
        <Database size={20} className="text-primary" />
        <h1 className="text-lg font-extrabold tracking-tight text-foreground">Festival Inventory</h1>
      </div>

      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-900/30 text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        {itemCount} items
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={onSeed}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors"
        >
          <Cog size={14} className="inline mr-1" />
          Seed
        </button>
        <button
          onClick={onExportJson}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors"
        >
          <Download size={14} className="inline mr-1" />
          Export
        </button>
        <button
          onClick={onImportJson}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors"
        >
          <Upload size={14} className="inline mr-1" />
          Import
        </button>
        <button
          onClick={onExportExcel}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors"
        >
          <FileSpreadsheet size={14} className="inline mr-1" />
          Excel
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={onToggleDark}
          className="p-1.5 text-muted-foreground hover:text-foreground bg-accent/50 hover:bg-accent rounded-lg transition-colors"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
