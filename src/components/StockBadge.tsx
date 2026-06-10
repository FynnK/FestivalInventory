export default function StockBadge({ remaining, min = 10 }: { remaining: number; min?: number }) {
  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Out of Stock
      </span>
    )
  }
  if (remaining <= min) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Low Stock
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      In Stock
    </span>
  )
}
