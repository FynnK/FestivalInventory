import { ShoppingCart, ArrowUpRight, Minus, Plus, Trash2, X } from 'lucide-react'

export default function ScannedItemPanel({ cart, onUpdateQty, onAddQty, onRemove, onClearCart, onCheckout, stageName }) {
  const totalItems = cart.reduce((sum, entry) => sum + entry.qty, 0)
  const uniqueItems = cart.length

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shopping Cart</h3>
        {totalItems > 0 && (
          <span className="text-xs text-muted-foreground">{uniqueItems} items ({totalItems} total)</span>
        )}
      </div>

      {totalItems === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No items scanned yet.<br />
          Scan barcodes to build your cart.
        </p>
      ) : (
        <>
          <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
            {cart.map((entry, idx) => (
              <div key={`${entry.item.id}-${idx}`} className="flex items-center gap-1.5 bg-accent/30 rounded-lg p-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{entry.item.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{entry.item.barcode}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onUpdateQty(entry.item.id, Math.max(1, entry.qty - 1))}
                    disabled={entry.qty <= 1}
                    className="w-6 h-6 rounded bg-accent hover:bg-accent/80 text-foreground disabled:opacity-30 flex items-center justify-center transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-foreground">{entry.qty}</span>
                  <button
                    onClick={() => onAddQty(entry.item)}
                    className="w-6 h-6 rounded bg-accent hover:bg-accent/80 text-foreground flex items-center justify-center transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => onRemove(entry.item.id)}
                    className="w-6 h-6 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onClearCart}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 mb-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Trash2 size={12} /> Clear Cart
          </button>

          <button
            onClick={onCheckout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <ShoppingCart size={16} />
            Checkout{stageName ? ` to ${stageName}` : ''}
          </button>
          {!stageName && (
            <p className="text-xs text-amber-500 mt-1.5 text-center">
              Select a stage or choose one during checkout.
            </p>
          )}
        </>
      )}
    </div>
  )
}