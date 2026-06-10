import { useState, useMemo } from 'react'
import { Search, RotateCcw, ArrowUpRight, ArrowDownLeft, AlertTriangle, MessageSquare } from 'lucide-react'
import type { EnrichedLedgerEntry } from '../db'
import { useI18n } from '../i18n'

export default function TransactionHistory({
  ledger,
  onReverse,
}: {
  ledger: EnrichedLedgerEntry[]
  onReverse: (entryId: number, note: string) => void
}) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [reverseEntry, setReverseEntry] = useState<EnrichedLedgerEntry | null>(null)
  const [reverseNote, setReverseNote] = useState('')

  const filtered = useMemo(() => {
    let result = ledger
    if (filterType !== 'all') result = result.filter(e => e.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.itemName?.toLowerCase().includes(q) || e.itemBarcode?.toLowerCase().includes(q) ||
        e.stageName?.toLowerCase().includes(q) || (e.note || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [ledger, search, filterType])

  const formatTime = (ts: number) => new Date(ts).toLocaleString()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" className="w-full bg-background border border-input rounded-lg py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t('txn_search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">{t('txn_filter_all_types')}</option>
          <option value="issue">{t('txn_filter_issues')}</option>
          <option value="return">{t('txn_filter_returns')}</option>
        </select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{t('txn_count_display', { filtered: filtered.length, total: ledger.length })}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-lg font-medium">{t('txn_no_transactions')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_time')}</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_type')}</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_item')}</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_stage')}</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_user_crew')}</th>
                <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_qty')}</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">{t('txn_table_header_note')}</th>
                <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{formatTime(entry.timestamp)}</td>
                  <td className="py-2.5 px-3">
                    {entry.type === 'issue' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600/20 text-emerald-600 dark:text-emerald-400"><ArrowUpRight size={12} /> {t('txn_type_issue')}</span>
                    ) : entry.type === 'return' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-600/20 text-amber-600 dark:text-amber-400"><ArrowDownLeft size={12} /> {t('txn_type_return')}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-600/20 text-blue-600 dark:text-blue-400"><AlertTriangle size={12} /> {t('txn_type_adjustment')}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{entry.itemName}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{entry.stageName}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">
                    {entry.userName && <span>{entry.userName}</span>}
                    {entry.userName && entry.crewName && <span className="mx-1">/</span>}
                    {entry.crewName && <span>{entry.crewName}</span>}
                    {!entry.userName && !entry.crewName && <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">{entry.qtyIssued || entry.qtyReturned}</td>
                  <td className="py-2.5 px-3 max-w-[200px]">
                    {entry.note ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare size={12} className="shrink-0" /><span className="truncate">{entry.note}</span></span>
                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button onClick={() => { setReverseEntry(entry); setReverseNote('') }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title={t('txn_reverse_tooltip')}><RotateCcw size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {reverseEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h4 className="text-lg font-bold mb-2 text-foreground">{t('txn_reverse_title')}</h4>
            <p className="text-muted-foreground text-sm mb-3">
              {t('txn_reverse_description', { type: reverseEntry.type === 'issue' ? t('txn_type_issue') : t('txn_type_return'), qty: reverseEntry.qtyIssued || reverseEntry.qtyReturned, item: reverseEntry.itemName, stage: reverseEntry.stageName })}
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('txn_reverse_reason_label')}</label>
              <textarea value={reverseNote} onChange={e => setReverseNote(e.target.value)} placeholder={t('txn_reverse_reason_placeholder')}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3} autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReverseEntry(null)} className="flex-1 px-4 py-2 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium">{t('txn_reverse_cancel_button')}</button>
              <button onClick={() => { onReverse(reverseEntry.id, reverseNote); setReverseEntry(null) }}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-opacity">{t('txn_reverse_confirm_button')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
