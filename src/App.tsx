import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ScanLine, Plus, AlertTriangle,
  Download, Upload, Tent, Warehouse,
  BarChart3, History, Trash2, FileSpreadsheet,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  initDb, getItems, getItemById, findItemByBarcode,
  addItem, updateItem, deleteItem,
  getStages, addStage, deleteStage,
  issueItem, returnItem,
  getNetIssuedToStage, getLedgerWithDetails,
  reverseTransaction,
  exportData, importData, seedSampleData, clearDatabase,
  getUsers, getCrews, computeBurnRate,
} from './db'
import type { Item, Stage, EnrichedLedgerEntry, ItemFormData } from './db'
import { useScanner } from './hooks/useScanner'
import TopBar from './components/TopBar'
import CrewSelector from './components/CrewSelector'
import ScannerWidget from './components/ScannerWidget'
import ScannedItemPanel from './components/ScannedItemPanel'
import InventoryMatrix from './components/InventoryMatrix'
import StockBadge from './components/StockBadge'
import ConfirmationModal from './components/ConfirmationModal'
import EditItemModal from './components/EditItemModal'
import ReturnQtyModal from './components/ReturnQtyModal'
import TransactionHistory from './components/TransactionHistory'
import BulkImportModal from './components/BulkImportModal'
import { useI18n } from './i18n'
import './App.css'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  show: boolean
  message: string
  type: ToastType
}

type View = 'inventory' | 'stages' | 'transactions' | 'reports'

interface CartEntry {
  item: Item
  qty: number
}

interface CheckoutReview {
  stageId: number
  cart: CartEntry[]
}

interface AddStockPrompt {
  item: Item
  desiredQty: number
  currentQty: number
}

interface StockShortage {
  item: Item
  requested: number
  available: number
  shortage: number
}

function OfflineBanner() {
  const { t } = useI18n()
  return (
    <div className="bg-amber-600 text-white text-center py-1.5 px-4 text-sm font-medium animate-pulse">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle size={16} />
        <span>{t('offline_banner_message')}</span>
      </div>
    </div>
  )
}

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {

  useEffect(() => {
    if (toast.show) { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }
  }, [toast.show, onClose])
  if (!toast.show) return null
  const colors: Record<ToastType, string> = {
    success: 'bg-emerald-600 border-emerald-500',
    error: 'bg-red-600 border-red-500',
    info: 'bg-blue-600 border-blue-500',
  }
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 ${colors[toast.type] || colors.info} text-white px-5 py-2.5 rounded-lg shadow-lg border text-sm font-medium animate-fade-in`}>
      {toast.message}
    </div>
  )
}

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [activeStageId, setActiveStageId] = useState<number | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' })
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('festivalInventory_darkMode')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [importMode, setImportMode] = useState(false)
  const [view, setView] = useState<View>('inventory')
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  const [editItem, setEditItem] = useState<Partial<Item> | null>(null)
  const [returnItemData, setReturnItemData] = useState<{ item: Item; maxQty: number } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null)
  const [addStageModal, setAddStageModal] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [deleteStageConfirm, setDeleteStageConfirm] = useState<number | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null)
  const [bulkImportModal, setBulkImportModal] = useState(false)

  const [cart, setCart] = useState<CartEntry[]>([])
  const [checkoutStagePicker, setCheckoutStagePicker] = useState(false)
  const [checkoutReview, setCheckoutReview] = useState<CheckoutReview | null>(null)
  const [addStockPrompt, setAddStockPrompt] = useState<AddStockPrompt | null>(null)
  const [insufficientStock, setInsufficientStock] = useState<{ shortages: StockShortage[]; checkoutStageId: number } | null>(null)

  const { t } = useI18n()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type })
  }, [])

  const closeToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'success' })
  }, [])

  const refresh = useCallback(() => {
    setItems(getItems())
    setStages(getStages())
  }, [])

  useEffect(() => {
    initDb().then(() => {
      const saved = getStages()
      setStages(saved)
      setItems(getItems())
      setActiveStageId(saved.length > 0 ? saved[0].id : null)
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('festivalInventory_darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const tryAddToCart = useCallback((item: Item) => {
    if (!item || !item.remaining || item.remaining <= 0) {
      showToast(t('toast_item_out_of_stock', { name: item?.name || 'Item' }), 'error')
      return
    }
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      const currentQty = existing ? existing.qty : 0
      const desiredQty = currentQty + 1
      if (desiredQty > (item.remaining ?? 0)) {
        setAddStockPrompt({ item, desiredQty, currentQty })
        return prev
      }
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty: desiredQty } : c)
      return [...prev, { item, qty: 1 }]
    })
  }, [showToast, t])

  const handleScan = useCallback((barcode: string) => {
    if (!barcode) return
    const item = findItemByBarcode(barcode)
    if (importMode) {
      if (item) {
        updateItem(item.id, { total: item.total + 1 })
        showToast(t('toast_added_1_to_item', { name: item.name }), 'success')
        refresh()
      } else {
        setEditItem({ barcode, name: '', description: '', category: 'General', itemType: 'consumable', total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10 })
      }
      return
    }
    if (!item) { setUnknownBarcode(barcode); return }
    tryAddToCart(item)
  }, [importMode, tryAddToCart, showToast, refresh, t])

  useScanner(handleScan, true)

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(barcodeInput)
    setBarcodeInput('')
  }

  const handleAddToCart = (item: Item) => { tryAddToCart(item) }

  const handleReturn = (item: Item) => {
    if (!activeStageId) { showToast(t('toast_select_stage_first'), 'error'); return }
    const netAtStage = getNetIssuedToStage(item.id, activeStageId)
    if (netAtStage <= 0) { showToast(t('toast_no_items_at_stage'), 'error'); return }
    setReturnItemData({ item, maxQty: netAtStage })
  }

  const confirmReturn = (qty: number) => {
    if (!returnItemData || !activeStageId) return
    const ok = returnItem(returnItemData.item.id, activeStageId, qty)
    if (ok) showToast(t('toast_returned_qty_item', { qty, name: returnItemData.item.name }), 'success')
    else showToast(t('toast_return_failed'), 'error')
    setReturnItemData(null)
    refresh()
  }

  const handleAddQty = (item: Item) => { tryAddToCart(item) }

  const handleUpdateCartQty = (itemId: number, qty: number) => {
    setCart(prev => prev.map(c => c.item.id === itemId ? { ...c, qty } : c))
  }

  const handleConfirmAddStock = () => {
    if (!addStockPrompt) return
    const { item, desiredQty } = addStockPrompt
    const freshItem = getItemById(item.id) || item
    const shortfall = desiredQty - (freshItem.remaining ?? 0)
    if (shortfall > 0) updateItem(item.id, { total: (freshItem.total ?? 0) + shortfall })
    const updatedItem = getItemById(item.id) || { ...freshItem, total: (freshItem.total ?? 0) + Math.max(0, shortfall), remaining: (freshItem.remaining ?? 0) + Math.max(0, shortfall) }
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) return prev.map(c => c.item.id === item.id ? { ...c, qty: desiredQty } : c)
      return [...prev, { item: updatedItem, qty: desiredQty }]
    })
    setAddStockPrompt(null)
    refresh()
  }

  const handleCancelAddStock = () => { setAddStockPrompt(null) }

  const handleRemoveFromCart = (itemId: number) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId))
  }

  const handleClearCart = () => { setCart([]) }

  const handleCheckout = () => {
    if (cart.length === 0) { showToast(t('toast_cart_empty'), 'error'); return }
    if (stages.length === 0) { showToast(t('toast_create_stage_first'), 'error'); return }
    if (activeStageId) setCheckoutReview({ stageId: activeStageId, cart: [...cart] })
    else setCheckoutStagePicker(true)
  }

  const handleCheckoutStagePick = (stageId: number) => {
    setCheckoutStagePicker(false)
    setCheckoutReview({ stageId, cart: [...cart] })
  }

  const confirmCheckout = () => {
    if (!checkoutReview) return
    const shortages: StockShortage[] = []
    for (const entry of checkoutReview.cart) {
      const fresh = getItemById(entry.item.id) || entry.item
      const remaining = fresh.remaining ?? 0
      if (remaining < entry.qty) {
        shortages.push({ item: entry.item, requested: entry.qty, available: remaining, shortage: entry.qty - remaining })
      }
    }
    if (shortages.length > 0) {
      setInsufficientStock({ shortages, checkoutStageId: checkoutReview.stageId })
      return
    }
    executeCheckout(checkoutReview.stageId, checkoutReview.cart)
  }

  const executeCheckout = (stageId: number, cartEntries: CartEntry[]) => {
    const stage = stages.find(s => s.id === stageId)
    let successCount = 0
    let failCount = 0
    for (const entry of cartEntries) {
      const ok = issueItem(entry.item.id, stageId, entry.qty)
      if (ok) successCount++
      else failCount++
    }
    if (successCount > 0) showToast(t('toast_checked_out_items', { count: successCount, stage: stage?.name || 'stage' }), 'success')
    if (failCount > 0) showToast(t('toast_checkout_insufficient_stock', { count: failCount }), 'error')
    setCart([])
    setCheckoutReview(null)
    refresh()
  }

  const handleAddShortageStock = () => {
    if (!insufficientStock) return
    for (const shortage of insufficientStock.shortages) {
      const fresh = getItemById(shortage.item.id) || shortage.item
      updateItem(shortage.item.id, { total: (fresh.total ?? 0) + shortage.shortage })
    }
    const cartForCheckout = insufficientStock.shortages.map(s => ({ item: getItemById(s.item.id) || s.item, qty: s.requested }))
    setInsufficientStock(null)
    refresh()
    executeCheckout(insufficientStock.checkoutStageId, cartForCheckout)
    showToast(t('toast_stock_updated_checkout_done'), 'success')
  }

  const handleSaveItem = (id: number | null | undefined, form: ItemFormData) => {
    if (id) {
      updateItem(id, form as Partial<Item>)
      showToast(t('toast_item_updated'), 'success')
    } else {
      if (findItemByBarcode(form.barcode)) { showToast(t('toast_barcode_already_exists'), 'error'); return }
      addItem(form)
      showToast(t('toast_item_added'), 'success')
    }
    refresh()
    setEditItem(null)
  }

  const handleDeleteItem = (item: Item) => { setDeleteConfirm(item) }

  const confirmDeleteItem = () => {
    if (!deleteConfirm) return
    deleteItem(deleteConfirm.id)
    showToast(t('toast_item_deleted', { name: deleteConfirm.name }), 'success')
    setDeleteConfirm(null)
    refresh()
  }

  const handleAddStage = () => { setAddStageModal(true); setNewStageName('') }

  const confirmAddStage = () => {
    if (!newStageName.trim()) return
    const stage = addStage(newStageName.trim())
    if (stage) { showToast(t('toast_stage_added', { name: stage.name }), 'success'); refresh(); setAddStageModal(false) }
    else showToast(t('toast_stage_name_exists'), 'error')
  }

  const handleDeleteStage = (stageId: number) => { setDeleteStageConfirm(stageId) }

  const confirmDeleteStage = () => {
    if (!deleteStageConfirm) return
    const stage = stages.find(s => s.id === deleteStageConfirm)
    deleteStage(deleteStageConfirm)
    showToast(t('toast_stage_deleted', { name: stage?.name || '' }), 'info')
    setDeleteStageConfirm(null)
    if (activeStageId === deleteStageConfirm) {
      const remaining = getStages()
      setActiveStageId(remaining.length > 0 ? remaining[0].id : null)
    }
    refresh()
  }

  const handleExportExcel = () => {
    try {
      const stagesList = getStages()
      const itemsList = getItems()
      const headers = ['Barcode ID', 'Item Name', 'Description', 'Total', 'Remaining', 'Unit Qty', 'Unit Type', ...stagesList.map(s => s.name)]
      const rows = itemsList.map(item => [
        item.barcode, item.name, item.description || '',
        item.total, Math.max(0, item.remaining ?? 0),
        item.unitQuantity || '', item.unitType || '',
        ...stagesList.map(s => getNetIssuedToStage(item.id, s.id)),
      ])
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
      XLSX.writeFile(wb, 'festival_inventory.xlsx')
      showToast(t('toast_exported_excel'), 'success')
    } catch { showToast(t('toast_export_excel_failed'), 'error') }
  }

  const handleExportJson = () => {
    try {
      const json = exportData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `festival_inventory_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast(t('toast_data_exported'), 'success')
    } catch { showToast(t('toast_export_failed'), 'error') }
  }

  const handleImportJson = () => { fileInputRef.current?.click() }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = importData((ev.target as any)?.result as string)
      if (ok) { showToast(t('toast_data_imported'), 'success'); refresh() }
      else showToast(t('toast_import_failed_format'), 'error')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSeed = () => { seedSampleData(); showToast(t('toast_sample_data_loaded'), 'success'); refresh() }

  const [clearDbConfirm, setClearDbConfirm] = useState(false)
  const handleClearDb = async () => { await clearDatabase(); setClearDbConfirm(false); refresh(); showToast(t('toast_database_cleared'), 'success') }

  const burnRateData = items.map(item => ({
    name: item.name,
    rate: computeBurnRate(item.id, 7),
  })).filter(d => d.rate > 0).sort((a, b) => b.rate - a.rate)

  const itemsWithBreakdown: Item[] = items.map(item => ({
    ...item,
    stageBreakdown: stages.reduce<Record<number, number>>((acc, s) => {
      acc[s.id] = getNetIssuedToStage(item.id, s.id)
      return acc
    }, {}),
  }))

  const activeStage = stages.find(s => s.id === activeStageId)

  const transactionLedger: EnrichedLedgerEntry[] = getLedgerWithDetails()

  const handleReverseTransaction = (entryId: number, note = '') => {
    const ok = reverseTransaction(entryId, note)
    if (ok) { showToast(t('toast_transaction_reversed'), 'success'); refresh() }
    else showToast(t('toast_reverse_insufficient_stock'), 'error')
  }

  const totalConsumed: Record<number, number> = stages.reduce<Record<number, number>>((acc, s) => {
    acc[s.id] = items.reduce((sum, item) => sum + getNetIssuedToStage(item.id, s.id), 0)
    return acc
  }, {})

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {isOffline && <OfflineBanner />}
      <TopBar
        itemCount={items.length}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportExcel={handleExportExcel}
        onSeed={handleSeed}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(d => !d)}
      />

      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border bg-card">
        {[
          { id: 'inventory' as const, label: t('tab_inventory'), icon: Warehouse },
          { id: 'stages' as const, label: t('tab_stages'), icon: Tent },
          { id: 'transactions' as const, label: t('tab_ledger'), icon: History },
          { id: 'reports' as const, label: t('tab_reports'), icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'inventory' && (
        <div className="flex-1 flex gap-0 overflow-hidden">
          <aside className="w-72 flex-shrink-0 flex flex-col gap-3 p-3 overflow-y-auto border-r border-border bg-card/50">
            <CrewSelector stages={stages} activeStageId={activeStageId} onSelect={setActiveStageId} onAdd={handleAddStage} onDelete={handleDeleteStage} />
            <ScannerWidget onScan={handleScan} />
            <div className="bg-card border border-border rounded-lg p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('sidebar_scan_barcode_heading')}</h3>
              <form onSubmit={handleBarcodeSubmit}>
                <div className="relative">
                  <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input ref={barcodeRef} type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                    placeholder={t('sidebar_barcode_placeholder')} className="w-full bg-background border border-input rounded-lg py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </form>
              <button onClick={() => setImportMode(!importMode)}
                className={`mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${importMode ? 'bg-blue-600 text-white' : 'bg-accent text-foreground hover:bg-accent/80'}`}>
                <span className="flex items-center gap-2"><Plus size={16} />{t('sidebar_import_mode_label')}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${importMode ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>{importMode ? t('sidebar_import_mode_on') : t('sidebar_import_mode_off')}</span>
              </button>
              {importMode && <p className="text-xs text-blue-500 mt-1.5">{t('sidebar_import_mode_hint')}</p>}
            </div>
            <button onClick={() => setBulkImportModal(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-foreground hover:bg-accent/80 transition-colors text-sm font-medium">
              <FileSpreadsheet size={16} /> {t('sidebar_bulk_import_button')}
            </button>
            <ScannedItemPanel cart={cart} onUpdateQty={handleUpdateCartQty} onAddQty={handleAddQty} onRemove={handleRemoveFromCart} onClearCart={handleClearCart} onCheckout={handleCheckout} stageName={activeStage?.name} />
          </aside>
          <main className="flex-1 p-4 overflow-hidden">
            <InventoryMatrix items={itemsWithBreakdown} stages={stages} activeStageId={activeStageId}
              onAddToCart={handleAddToCart} onReturn={handleReturn} onEdit={(item) => setEditItem(item)} onDelete={handleDeleteItem}
              onAddItem={() => setEditItem({ barcode: '', name: '', description: '', category: 'General', itemType: 'consumable', total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10 })} />
          </main>
        </div>
      )}

      {view === 'stages' && (
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4">{t('stages_overview_heading')}</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">{t('stages_table_header_item')}</th>
                    {stages.map(s => <th key={s.id} className="text-center py-3 px-3 font-semibold text-muted-foreground whitespace-nowrap">{s.name}</th>)}
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">{t('stages_table_header_total_out')}</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">{t('stages_table_header_remaining')}</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsWithBreakdown.map(item => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 font-medium">{item.name}</td>
                      {stages.map(s => (
                        <td key={s.id} className="text-center py-2.5 px-3">
                          {item.stageBreakdown?.[s.id] ? <span className="font-semibold text-primary">{item.stageBreakdown[s.id]}</span> : <span className="text-muted-foreground/40">—</span>}
                        </td>
                      ))}
                      <td className="text-center py-2.5 px-3 font-semibold text-destructive">{item.netConsumed}</td>
                      <td className="text-center py-2.5 px-3"><StockBadge remaining={item.remaining ?? 0} min={item.minStockThreshold || 10} /></td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={stages.length + 3} className="text-center py-12 text-muted-foreground">{t('stages_no_items')}</td></tr>}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="py-3 px-4 font-bold">{t('stages_total_consumed')}</td>
                    {stages.map(s => (
                      <td key={s.id} className="text-center py-3 px-3 font-bold text-destructive">{totalConsumed[s.id] > 0 ? totalConsumed[s.id] : '—'}</td>
                    ))}
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'transactions' && (
        <div className="flex-1 p-4 overflow-hidden">
          <TransactionHistory ledger={transactionLedger} onReverse={handleReverseTransaction} />
        </div>
      )}

      {view === 'reports' && (
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4">{t('reports_heading')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('reports_export_heading')}</h3>
              <div className="space-y-2">
                <button onClick={handleExportExcel} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"><Download size={16} /> {t('reports_export_excel_button')}</button>
                <button onClick={handleExportJson} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground font-medium text-sm hover:bg-accent transition-colors"><Download size={16} /> {t('reports_export_json_button')}</button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('reports_import_heading')}</h3>
              <div className="space-y-2">
                <button onClick={handleImportJson} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground font-medium text-sm hover:bg-accent transition-colors"><Upload size={16} /> {t('reports_import_json_button')}</button>
                <button onClick={handleSeed} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground font-medium text-sm hover:bg-accent transition-colors"><Plus size={16} /> {t('reports_load_sample_data_button')}</button>
              </div>
            </div>
            {burnRateData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-5 md:col-span-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('reports_burn_rate_heading')}</h3>
                <div className="space-y-2">
                  {burnRateData.map(d => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-40 truncate">{d.name}</span>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${Math.min(100, (d.rate / Math.max(...burnRateData.map(b => b.rate))) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-mono text-muted-foreground w-16 text-right">{d.rate.toFixed(1)}{t('reports_burn_rate_unit')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-card border border-destructive/30 rounded-xl p-5 md:col-span-2">
              <h3 className="text-sm font-semibold text-destructive uppercase tracking-wider mb-3">{t('reports_danger_zone_heading')}</h3>
              <p className="text-sm text-muted-foreground mb-3">{t('reports_danger_zone_description')}</p>
              <button onClick={() => setClearDbConfirm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 font-medium text-sm hover:bg-destructive/20 transition-colors"><Trash2 size={16} /> {t('reports_clear_database_button')}</button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={closeToast} />
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

      {editItem && <EditItemModal item={editItem} onSave={handleSaveItem} onClose={() => setEditItem(null)} />}

      {returnItemData && (
        <ReturnQtyModal item={returnItemData.item} stageName={activeStage?.name || ''} maxReturn={returnItemData.maxQty}
          onConfirm={confirmReturn} onClose={() => setReturnItemData(null)} />
      )}

      {deleteConfirm && (
        <ConfirmationModal title={t('modal_delete_item_title')} message={t('modal_delete_item_message', { name: deleteConfirm.name })}
          confirmLabel={t('modal_confirm_delete')} cancelLabel={t('modal_cancel')} danger onConfirm={confirmDeleteItem} onCancel={() => setDeleteConfirm(null)} />
      )}

      {addStageModal && (
        <ConfirmationModal title={t('modal_add_stage_title')} message="" confirmLabel={t('modal_confirm_add')} cancelLabel={t('modal_cancel')} onConfirm={confirmAddStage} onCancel={() => setAddStageModal(false)}>
          <input type="text" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder={t('modal_add_stage_placeholder')}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus onKeyDown={e => { if (e.key === 'Enter') confirmAddStage() }} />
        </ConfirmationModal>
      )}

      {deleteStageConfirm && (
        <ConfirmationModal title={t('modal_delete_stage_title')} message={t('modal_delete_stage_message')}
          confirmLabel={t('modal_confirm_delete_stage')} cancelLabel={t('modal_cancel')} danger onConfirm={confirmDeleteStage} onCancel={() => setDeleteStageConfirm(null)} />
      )}

      {checkoutStagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-foreground mb-4">{t('modal_select_destination_title')}</h4>
            <p className="text-sm text-muted-foreground mb-4">{t('modal_select_destination_message')}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">{t('modal_no_stages_created')}</p>
              ) : stages.map(stage => (
                <button key={stage.id} onClick={() => handleCheckoutStagePick(stage.id)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-sm transition-colors">{stage.name}</button>
              ))}
            </div>
            <button onClick={() => setCheckoutStagePicker(false)} className="w-full mt-3 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_cancel')}</button>
          </div>
        </div>
      )}

      {checkoutReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-foreground mb-1">{t('modal_checkout_review_title')}</h4>
            <p className="text-sm text-muted-foreground mb-4">{t('modal_checkout_review_message', { stage: stages.find(s => s.id === checkoutReview.stageId)?.name || 'Unknown Stage' })}</p>
            <div className="max-h-60 overflow-y-auto space-y-1.5 mb-4">
              {checkoutReview.cart.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between bg-accent/30 rounded-lg px-3 py-2">
                  <div><div className="text-sm font-semibold text-foreground">{entry.item.name}</div><div className="text-xs text-muted-foreground font-mono">{entry.item.barcode}</div></div>
                  <div className="text-lg font-bold text-foreground">x{entry.qty}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-muted-foreground">{t('modal_checkout_total_items')}</span>
              <span className="font-bold text-foreground">{checkoutReview.cart.reduce((s, e) => s + e.qty, 0)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCheckoutReview(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_cancel')}</button>
              <button onClick={confirmCheckout} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-colors">{t('modal_confirm_checkout')}</button>
            </div>
          </div>
        </div>
      )}

      {addStockPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <h4 className="text-lg font-bold text-foreground">{t('modal_insufficient_stock_title')}</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-1">{t('modal_insufficient_stock_available', { remaining: addStockPrompt.item.remaining, name: addStockPrompt.item.name })}</p>
            <p className="text-muted-foreground text-sm mb-5">{t('modal_insufficient_stock_prompt', { desiredQty: addStockPrompt.desiredQty })}</p>
            <div className="flex gap-3">
              <button onClick={handleCancelAddStock} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_cancel')}</button>
              <button onClick={handleConfirmAddStock} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">{t('modal_add_to_stock_button', { count: addStockPrompt.desiredQty - addStockPrompt.currentQty })}</button>
            </div>
          </div>
        </div>
      )}

      {unknownBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <h4 className="text-lg font-bold text-foreground">{t('modal_unknown_barcode_title')}</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-1">{t('modal_unknown_barcode_message', { barcode: unknownBarcode })}</p>
            <p className="text-muted-foreground text-sm mb-5">{t('modal_unknown_barcode_suggestion')}</p>
            <div className="flex gap-3">
              <button onClick={() => { setImportMode(true); setEditItem({ barcode: unknownBarcode, name: '', description: '', category: 'General', itemType: 'consumable', total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10 }); setUnknownBarcode(null) }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">{t('modal_import_item_button')}</button>
              <button onClick={() => setUnknownBarcode(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_abort_button')}</button>
            </div>
          </div>
        </div>
      )}

      {insufficientStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <h4 className="text-lg font-bold text-foreground">{t('modal_checkout_shortage_title')}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t('modal_checkout_shortage_message')}</p>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {insufficientStock.shortages.map(s => (
                <div key={s.item.id} className="flex items-center justify-between bg-accent/30 rounded-lg px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{s.item.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.item.barcode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-destructive">{t('modal_checkout_shortage_need_have', { requested: s.requested, available: s.available })}</div>
                    <div className="text-xs text-muted-foreground">{t('modal_checkout_shortage_short_by', { shortage: s.shortage })}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t('modal_checkout_shortage_offer', { total: insufficientStock.shortages.reduce((s, x) => s + x.shortage, 0) })}</p>
            <div className="flex gap-3">
              <button onClick={() => setInsufficientStock(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('modal_cancel')}</button>
              <button onClick={handleAddShortageStock} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-colors">{t('modal_add_stock_and_checkout_button')}</button>
            </div>
          </div>
        </div>
      )}

      {clearDbConfirm && (
        <ConfirmationModal title={t('modal_clear_database_title')} message={t('modal_clear_database_message')}
          confirmLabel={t('modal_confirm_clear_everything')} cancelLabel={t('modal_cancel')} danger onConfirm={handleClearDb} onCancel={() => setClearDbConfirm(false)} />
      )}

      {bulkImportModal && <BulkImportModal onClose={() => setBulkImportModal(false)} />}
    </div>
  )
}
