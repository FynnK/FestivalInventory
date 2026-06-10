import { useState } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import type { Item } from '../db'
import { useI18n } from '../i18n'

export default function ReturnQtyModal({
  item,
  stageName,
  maxReturn,
  onConfirm,
  onClose,
}: {
  item: Item
  stageName: string
  maxReturn: number
  onConfirm: (qty: number) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const [qty, setQty] = useState(Math.min(1, maxReturn))

  const handleConfirm = () => {
    if (qty > 0 && qty <= maxReturn) onConfirm(qty)
  }

  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{t('return_modal_title')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>
        <p className="text-muted-foreground text-sm mb-1">{t('return_modal_from_stage', { stage: stageName })}</p>
        <p className="text-foreground font-medium text-base mb-4">{item.name}</p>
        <p className="text-xs text-muted-foreground mb-3">{t('return_modal_max_returnable', { max: maxReturn })}</p>
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}
            className="w-10 h-10 rounded-lg bg-accent hover:bg-accent/80 text-foreground disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"><Minus size={18} /></button>
          <span className="text-3xl font-bold text-foreground w-16 text-center">{qty}</span>
          <button onClick={() => setQty(Math.min(maxReturn, qty + 1))} disabled={qty >= maxReturn}
            className="w-10 h-10 rounded-lg bg-accent hover:bg-accent/80 text-foreground disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"><Plus size={18} /></button>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_cancel')}</button>
          <button onClick={handleConfirm} disabled={qty <= 0 || qty > maxReturn}
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed">{t('return_confirm_button', { qty })}</button>
        </div>
      </div>
    </div>
  )
}
