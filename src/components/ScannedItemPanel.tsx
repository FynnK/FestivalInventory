import { ShoppingCart, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Item } from '../db'
import { useI18n } from '../i18n'

interface CartEntry {
  item: Item
  qty: number
}

export default function ScannedItemPanel({
  cart,
  onUpdateQty,
  onAddQty,
  onRemove,
  onClearCart,
  onCheckout,
  stageName,
}: {
  cart: CartEntry[]
  onUpdateQty: (itemId: number, qty: number) => void
  onAddQty: (item: Item) => void
  onRemove: (itemId: number) => void
  onClearCart: () => void
  onCheckout: () => void
  stageName: string | undefined
}) {
  const { t } = useI18n()
  const totalItems = cart.reduce((sum, entry) => sum + entry.qty, 0)
  const uniqueItems = cart.length
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleFocus = (entry: CartEntry) => {
    setEditingId(entry.item.id)
    setEditValue(String(entry.qty))
  }

  const handleBlur = (entry: CartEntry) => {
    setEditingId(null)
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      onUpdateQty(entry.item.id, parsed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, entry: CartEntry) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur()
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('cart_heading')}</h3>
        {totalItems > 0 && <span className="text-xs text-muted-foreground">{t('cart_summary', { count: uniqueItems, total: totalItems })}</span>}
      </div>
      {totalItems === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{t('cart_empty_line1')}<br />{t('cart_empty_line2')}</p>
      ) : (
        <>
          <div className="space-y-1.5 max-h-60 overflow-y-auto mb-3">
            {cart.map((entry, idx) => (
              <div key={`${entry.item.id}-${idx}`} className="bg-accent/30 rounded-lg p-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{entry.item.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{entry.item.barcode}</div>
                  </div>
                  <button onClick={() => onRemove(entry.item.id)} className="w-6 h-6 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors shrink-0">
                    <X size={12} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-0.5">
                  {[1, 5, 10].map(n => (
                    <button key={`-${n}`} onClick={() => onUpdateQty(entry.item.id, Math.max(1, entry.qty - n))}
                      className="flex-1 py-0.5 text-[10px] font-medium rounded bg-accent hover:bg-accent/80 text-foreground transition-colors">
                      -{n}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={editingId === entry.item.id ? editValue : String(entry.qty)}
                    onFocus={() => handleFocus(entry)}
                    onBlur={() => handleBlur(entry)}
                    onKeyDown={e => handleKeyDown(e, entry)}
                    onChange={e => setEditValue(e.target.value)}
                    className="w-12 text-center text-sm font-bold text-foreground bg-background border border-input rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  {[1, 5, 10].map(n => (
                    <button key={`+${n}`} onClick={() => onUpdateQty(entry.item.id, entry.qty + n)}
                      className="flex-1 py-0.5 text-[10px] font-medium rounded bg-accent hover:bg-accent/80 text-foreground transition-colors">
                      +{n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={onClearCart} className="w-full flex items-center justify-center gap-1.5 py-1.5 mb-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <Trash2 size={12} /> {t('cart_clear_button')}
          </button>
          <button onClick={onCheckout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
            <ShoppingCart size={16} />{t('cart_checkout_button')}{stageName ? ` to ${stageName}` : ''}
          </button>
          {!stageName && <p className="text-xs text-amber-500 mt-1.5 text-center">{t('cart_no_stage_warning')}</p>}
        </>
      )}
    </div>
  )
}
