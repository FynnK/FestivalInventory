import { useState, useMemo } from 'react'
import { Search, RotateCcw, ArrowUpRight, ArrowDownLeft, AlertTriangle, MessageSquare } from 'lucide-react'
import ConfirmationModal from './ConfirmationModal'

export default function TransactionHistory({ ledger, onReverse }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [reverseEntry, setReverseEntry] = useState(null)
  const [reverseNote, setReverseNote] = useState('')

  const filtered = useMemo(() => {
    let result = ledger
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(e =>
        e.itemName?.toLowerCase().includes(q) ||
        e.itemBarcode?.toLowerCase().includes(q) ||
        e.stageName?.toLowerCase().includes(q) ||
        (e.note || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [ledger, search, filterType])

  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleString()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full bg-background border border-input rounded-lg py-2 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search by item, barcode, stage, note..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="issue">Issues Only</option>
          <option value="return">Returns Only</option>
        </select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} of {ledger.length} transactions
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-lg font-medium">
            No transactions found
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Time</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Item</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Stage</th>
                <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Qty</th>
                <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Note</th>
                <th className="text-right py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {formatTime(entry.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    {entry.type === 'issue' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600/20 text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight size={12} /> Issue
                      </span>
                    ) : entry.type === 'return' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-600/20 text-amber-600 dark:text-amber-400">
                        <ArrowDownLeft size={12} /> Return
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-600/20 text-blue-600 dark:text-blue-400">
                        <AlertTriangle size={12} /> Adj.
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground">{entry.itemName}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{entry.stageName}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">
                    {entry.qtyIssued || entry.qtyReturned}
                  </td>
                  <td className="py-2.5 px-3 max-w-[200px]">
                    {entry.note ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare size={12} className="shrink-0" />
                        <span className="truncate">{entry.note}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => { setReverseEntry(entry); setReverseNote('') }}
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                      title="Reverse this transaction"
                    >
                      <RotateCcw size={14} />
                    </button>
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
            <h4 className="text-lg font-bold mb-2 text-foreground">Reverse Transaction</h4>
            <p className="text-muted-foreground text-sm mb-3">
              Create a reversing entry for <strong>{reverseEntry.type === 'issue' ? 'issue' : 'return'}</strong> of{' '}
              <strong>{reverseEntry.qtyIssued || reverseEntry.qtyReturned}x {reverseEntry.itemName}</strong>
              {' '}at <strong>{reverseEntry.stageName}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Reason / Comment</label>
              <textarea
                value={reverseNote}
                onChange={e => setReverseNote(e.target.value)}
                placeholder="Why are you reversing this?"
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setReverseEntry(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReverse(reverseEntry.id, reverseNote)
                  setReverseEntry(null)
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Reverse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
