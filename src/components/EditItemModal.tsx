import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Item, ItemFormData } from '../db'
import { useI18n } from '../i18n'

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
  const { t } = useI18n()
  const [form, setForm] = useState<ItemFormData>({
    barcode: '', name: '', description: '', category: 'General',
    itemType: 'consumable',
    total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10,
    serialNumber: '', uniqueId: '', owner: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        barcode: item.barcode || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'General',
        itemType: item.itemType || 'consumable',
        total: item.total || 1,
        unitQuantity: item.unitQuantity || 1,
        unitType: item.unitType || 'pcs',
        minStockThreshold: item.minStockThreshold || 10,
        serialNumber: item.serialNumber || '',
        uniqueId: item.uniqueId || '',
        owner: item.owner || '',
      })
    }
  }, [item])

  const handleSave = () => {
    if (!form.name.trim() || !form.barcode.trim()) {
      setError(t('edit_error_name_barcode_required'))
      return
    }
    if (form.total < 0) {
      setError(t('edit_error_total_negative'))
      return
    }
    if (item?.id && form.total < (item.remaining ?? 0)) {
      setError(t('edit_error_total_below_issued', { remaining: item.remaining ?? 0 }))
      return
    }
    setError('')
    onSave(item?.id, form)
  }

  if (!item) return null

  const isNew = !item.id
  const isRental = form.itemType === 'rental'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{isNew ? t('edit_modal_title_add') : t('edit_modal_title_edit')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_barcode_label')}</label>
              <input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_barcode_placeholder')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_item_type_label')}</label>
              <select value={form.itemType} onChange={e => setForm({ ...form, itemType: e.target.value as 'consumable' | 'rental' })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="consumable">{t('edit_field_item_type_consumable')}</option>
                <option value="rental">{t('edit_field_item_type_rental')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_name_label')}</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_name_placeholder')} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_category_label')}</label>
            <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_category_placeholder')} list="category-list" />
            <datalist id="category-list">{KNOWN_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_description_label')}</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_description_placeholder')} />
          </div>
          {isRental && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_serial_number_label')}</label>
                  <input type="text" value={form.serialNumber || ''} onChange={e => setForm({ ...form, serialNumber: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_serial_number_placeholder')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_unique_id_label')}</label>
                  <input type="text" value={form.uniqueId || ''} onChange={e => setForm({ ...form, uniqueId: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_unique_id_placeholder')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_owner_label')}</label>
                <input type="text" value={form.owner || ''} onChange={e => setForm({ ...form, owner: e.target.value })}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_owner_placeholder')} />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_total_qty_label')}</label>
              <input type="number" min="0" value={form.total} onChange={e => setForm({ ...form, total: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_low_stock_label')}</label>
              <input type="number" min="0" value={form.minStockThreshold} onChange={e => setForm({ ...form, minStockThreshold: parseInt(e.target.value) || 0 })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_units_per_package_label')}</label>
              <input type="number" min="1" value={form.unitQuantity} onChange={e => setForm({ ...form, unitQuantity: parseInt(e.target.value) || 1 })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('edit_field_unit_type_label')}</label>
              <input type="text" value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })}
                className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t('edit_field_unit_type_placeholder')} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_cancel')}</button>
            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm">{isNew ? t('edit_confirm_add_button') : t('edit_confirm_save_button')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
