import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Item, ItemFormData } from '../db'

const KNOWN_CATEGORIES = ['Hardware', 'Cables', 'Consumables', 'Electronics', 'Safety', 'General']

export default function EditItemModal({
  item,
  onSave,
  onClose,
}: {
  item: Partial<Item> & { barcode?: string; name?: string }
  onSave: (id: number | null | undefined, form: ItemFormData) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ItemFormData>({
    barcode: '', name: '', description: '', category: 'General',
    total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        barcode: item.barcode || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'General',
        total: item.total || 1,
        unitQuantity: item.unitQuantity || 1,
        unitType: item.unitType || 'pcs',
        minStockThreshold: item.minStockThreshold || 10,
      })
    }
  }, [item])

  const handleSave = () => {
    if (!form.name.trim() || !form.barcode.trim()) {
      setError('Name and barcode are required.')
      return
    }
    if (form.total < 0) {
      setError('Total quantity cannot be negative.')
      return
    }
    if (item?.id && form.total < (item.remaining ?? 0)) {
      setError(`Cannot set total below current issued quantity (${item.remaining} in circulation).`)
      return
    }
    setError('')
    onSave(item?.id, form)
  }

  if (!item) return null

  const isNew = !item.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{isNew ? 'Add New Item' : 'Edit Item'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Barcode</label>
            <input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Scan or enter barcode" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Item name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
            <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Hardware, Cables, Consumables..." list="category-list" />
            <datalist id="category-list">{KNOWN_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Total Qty</label>
              <input type="number" min="0" value={form.total} onChange={e => setForm({ ...form, total: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Low Stock At</label>
              <input type="number" min="0" value={form.minStockThreshold} onChange={e => setForm({ ...form, minStockThreshold: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Units Per Package</label>
              <input type="number" min="1" value={form.unitQuantity} onChange={e => setForm({ ...form, unitQuantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Unit Type</label>
              <input type="text" value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="pcs, meters, etc." />
            </div>
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">Cancel</button>
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm">{isNew ? 'Add Item' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
