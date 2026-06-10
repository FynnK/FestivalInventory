import { useI18n } from '../i18n'

export default function StockBadge({ remaining, min = 10 }: { remaining: number; min?: number }) {
  const { t } = useI18n()
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        {t('badge_out_of_stock')}
      </span>
    )
  }
  if (remaining <= min) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {t('badge_low_stock')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {t('badge_in_stock')}
    </span>
  )
}
