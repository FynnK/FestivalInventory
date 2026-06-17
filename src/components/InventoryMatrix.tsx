import { useState, useMemo } from 'react'
import { Search, Plus, Edit, Trash2, ShoppingCart } from 'lucide-react'
import StockBadge from './StockBadge'
import type { Item, Stage } from '../db'
import { useI18n } from '../i18n'

export default function InventoryMatrix({
  items,
  stages,
  activeStageId,
  stageDurations,
  onAddToCart,
  onReturn,
  onEdit,
  onDelete,
  onAddItem,
}: {
  items: Item[]
  stages: Stage[]
  activeStageId: number | null
  stageDurations?: Record<number, Record<number, number | null>>
  onAddToCart: (item: Item) => void
  onReturn: (item: Item) => void
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  onAddItem: () => void
}) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [unreturnedOnly, setUnreturnedOnly] = useState(false)

  function formatDuration(ts: number | null | undefined): string {
    if (!ts) return ''
    const diff = Date.now() - ts
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean))
    return ['all', ...Array.from(set).sort()]
  }, [items])

  const filtered = useMemo(() => {
    let result = items
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(i =>
        i.barcode?.toLowerCase().includes(q) ||
        i.name?.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q)
      )
    }
    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter)
    }
    if (unreturnedOnly) {
      result = result.filter(i => i.itemType === 'rental' && (i.netConsumed ?? 0) > 0)
    }
    return result
  }, [items, search, categoryFilter, unreturnedOnly])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full bg-background border border-input rounded-lg py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder={t('inventory_search_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'all' ? t('inventory_filter_all_categories') : c}</option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none transition-colors">
          <input type="checkbox" checked={unreturnedOnly} onChange={e => setUnreturnedOnly(e.target.checked)}
            className="rounded border-input" />
          {t('inventory_filter_unreturned')}
        </label>
        <button onClick={onAddItem} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
          <Plus size={16} /> {t('inventory_add_item_button')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-lg font-medium">
            {search || categoryFilter !== 'all' ? t('inventory_no_match_filters') : t('inventory_no_items')}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_barcode')}</th>
                <th className="text-left py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_name')}</th>
                <th className="text-left py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_category')}</th>
                <th className="text-center py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_stock')}</th>
                <th className="text-center py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_status')}</th>
                {activeStageId && (
                  <th className="text-center py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_at_stage')}</th>
                )}
                <th className="text-right py-2.5 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('inventory_table_header_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const netAtStage = activeStageId ? item.stageBreakdown?.[activeStageId] || 0 : 0
                return (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-xs text-muted-foreground">{item.barcode}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-medium text-foreground">{item.name}</div>
                      {item.description && <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{item.category || 'General'}</span>
                        {item.itemType === 'rental' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-600/15 text-blue-500 font-medium">{t('inventory_item_type_rental')}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="font-bold text-lg text-foreground">{Math.max(0, item.remaining ?? 0)}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {item.total}</span>
                      {item.unitType && (
                        <div className="text-xs text-muted-foreground">{item.unitQuantity > 1 ? `${item.unitQuantity} ${item.unitType}` : item.unitType}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="flex justify-center">
                        <StockBadge remaining={item.remaining ?? 0} min={item.minStockThreshold || 10} />
                      </div>
                    </td>
                    {activeStageId && (
                      <td className="py-2.5 px-2 text-center">
                        <span className={`font-semibold ${netAtStage > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                          {netAtStage > 0 ? netAtStage : '—'}
                        </span>
                        {netAtStage > 0 && item.itemType === 'rental' && stageDurations?.[item.id]?.[activeStageId] && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDuration(stageDurations[item.id][activeStageId])}
                          </div>
                        )}
                      </td>
                    )}
                    <td className="py-2.5 px-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onAddToCart(item)}
                          disabled={!item.remaining || item.remaining <= 0}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ShoppingCart size={12} className="inline mr-1" />{t('inventory_action_cart')}
                        </button>
                        <button
                          onClick={() => onReturn(item)}
                          disabled={!activeStageId || (activeStageId && (!item.stageBreakdown || !item.stageBreakdown[activeStageId]))}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-amber-600/20 text-amber-600 dark:text-amber-400 hover:bg-amber-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {t('inventory_action_return')}
                        </button>
                        <button onClick={() => onEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                          <Edit size={14} />
                        </button>
                        <button onClick={() => onDelete(item)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
