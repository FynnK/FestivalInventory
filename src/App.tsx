import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ScanLine, Plus, AlertTriangle,
  Download, Upload, Tent, Warehouse,
  BarChart3, History,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  initDb, getItems, getItemById, findItemByBarcode,
  addItem, updateItem, deleteItem,
  getStages, addStage, deleteStage,
  issueItem, returnItem,
  getNetIssuedToStage, getLedgerWithDetails,
  reverseTransaction,
  exportData, importData, seedSampleData,
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

  const [editItem, setEditItem] = useState<Partial<Item> | null>(null)
  const [returnItemData, setReturnItemData] = useState<{ item: Item; maxQty: number } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null)
  const [addStageModal, setAddStageModal] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [deleteStageConfirm, setDeleteStageConfirm] = useState<number | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null)

  const [cart, setCart] = useState<CartEntry[]>([])
  const [checkoutStagePicker, setCheckoutStagePicker] = useState(false)
  const [checkoutReview, setCheckoutReview] = useState<CheckoutReview | null>(null)
  const [addStockPrompt, setAddStockPrompt] = useState<AddStockPrompt | null>(null)

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
    initDb()
    const saved = getStages()
    setStages(saved)
    setItems(getItems())
    setActiveStageId(saved.length > 0 ? saved[0].id : null)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('festivalInventory_darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    if (view === 'inventory' && !addStageModal && !editItem && !returnItemData && !deleteConfirm && !deleteStageConfirm && !checkoutStagePicker && !checkoutReview && !addStockPrompt) {
      barcodeRef.current?.focus()
    }
  }, [view, addStageModal, editItem, returnItemData, deleteConfirm, deleteStageConfirm, checkoutStagePicker, checkoutReview, addStockPrompt])

  const tryAddToCart = useCallback((item: Item) => {
    if (!item || !item.remaining || item.remaining <= 0) {
      showToast(`${item?.name || 'Item'} is out of stock.`, 'error')
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
  }, [showToast])

  const handleScan = useCallback((barcode: string) => {
    if (!barcode) return
    const item = findItemByBarcode(barcode)
    if (importMode) {
      if (item) {
        updateItem(item.id, { total: item.total + 1 })
        showToast(`Added 1 to ${item.name}`, 'success')
        refresh()
      } else {
        setEditItem({ barcode, name: '', description: '', category: 'General', total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10 })
      }
      return
    }
    if (!item) { setUnknownBarcode(barcode); return }
    tryAddToCart(item)
  }, [importMode, tryAddToCart, showToast, refresh])

  useScanner(handleScan, true)

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScan(barcodeInput)
    setBarcodeInput('')
  }

  const handleAddToCart = (item: Item) => { tryAddToCart(item) }

  const handleReturn = (item: Item) => {
    if (!activeStageId) { showToast('Select a stage first.', 'error'); return }
    const netAtStage = getNetIssuedToStage(item.id, activeStageId)
    if (netAtStage <= 0) { showToast('No items at this stage to return.', 'error'); return }
    setReturnItemData({ item, maxQty: netAtStage })
  }

  const confirmReturn = (qty: number) => {
    if (!returnItemData || !activeStageId) return
    const ok = returnItem(returnItemData.item.id, activeStageId, qty)
    if (ok) showToast(`Returned ${qty}x ${returnItemData.item.name}`, 'success')
    else showToast('Return failed.', 'error')
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
    if (cart.length === 0) { showToast('Cart is empty.', 'error'); return }
    if (activeStageId) setCheckoutReview({ stageId: activeStageId, cart: [...cart] })
    else setCheckoutStagePicker(true)
  }

  const handleCheckoutStagePick = (stageId: number) => {
    setCheckoutStagePicker(false)
    setCheckoutReview({ stageId, cart: [...cart] })
  }

  const confirmCheckout = () => {
    if (!checkoutReview) return
    const stage = stages.find(s => s.id === checkoutReview.stageId)
    let successCount = 0
    let failCount = 0
    for (const entry of checkoutReview.cart) {
      const ok = issueItem(entry.item.id, checkoutReview.stageId, entry.qty)
      if (ok) successCount++
      else failCount++
    }
    if (successCount > 0) showToast(`Checked out ${successCount} item(s) to ${stage?.name || 'stage'}.`, 'success')
    if (failCount > 0) showToast(`${failCount} item(s) failed — insufficient stock.`, 'error')
    setCart([])
    setCheckoutReview(null)
    refresh()
  }

  const handleSaveItem = (id: number | null | undefined, form: ItemFormData) => {
    if (id) {
      updateItem(id, form as Partial<Item>)
      showToast('Item updated.', 'success')
    } else {
      if (findItemByBarcode(form.barcode)) { showToast('Barcode already exists.', 'error'); return }
      addItem(form)
      showToast('Item added.', 'success')
    }
    refresh()
    setEditItem(null)
  }

  const handleDeleteItem = (item: Item) => { setDeleteConfirm(item) }

  const confirmDeleteItem = () => {
    if (!deleteConfirm) return
    deleteItem(deleteConfirm.id)
    showToast(`Deleted ${deleteConfirm.name}`, 'success')
    setDeleteConfirm(null)
    refresh()
  }

  const handleAddStage = () => { setAddStageModal(true); setNewStageName('') }

  const confirmAddStage = () => {
    if (!newStageName.trim()) return
    const stage = addStage(newStageName.trim())
    if (stage) { showToast(`Stage "${stage.name}" added.`, 'success'); refresh(); setAddStageModal(false) }
    else showToast('Stage name already exists.', 'error')
  }

  const handleDeleteStage = (stageId: number) => { setDeleteStageConfirm(stageId) }

  const confirmDeleteStage = () => {
    if (!deleteStageConfirm) return
    const stage = stages.find(s => s.id === deleteStageConfirm)
    deleteStage(deleteStageConfirm)
    showToast(`Stage "${stage?.name}" deleted. Items returned to stock.`, 'info')
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
      showToast('Exported to Excel.', 'success')
    } catch { showToast('Excel export failed.', 'error') }
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
      showToast('Data exported.', 'success')
    } catch { showToast('Export failed.', 'error') }
  }

  const handleImportJson = () => { fileInputRef.current?.click() }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = importData((ev.target as any)?.result as string)
      if (ok) { showToast('Data imported successfully.', 'success'); refresh() }
      else showToast('Import failed: invalid format.', 'error')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleSeed = () => { seedSampleData(); showToast('Sample data loaded.', 'success'); refresh() }

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
    if (ok) { showToast('Transaction reversed.', 'success'); refresh() }
    else showToast('Cannot reverse — insufficient stock.', 'error')
  }

  const totalConsumed: Record<number, number> = stages.reduce<Record<number, number>>((acc, s) => {
    acc[s.id] = items.reduce((sum, item) => sum + getNetIssuedToStage(item.id, s.id), 0)
    return acc
  }, {})

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
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
          { id: 'inventory' as const, label: 'Inventory', icon: Warehouse },
          { id: 'stages' as const, label: 'Stages', icon: Tent },
          { id: 'transactions' as const, label: 'Ledger', icon: History },
          { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Scan Barcode</h3>
              <form onSubmit={handleBarcodeSubmit}>
                <div className="relative">
                  <ScanLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input ref={barcodeRef} type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="Type or scan barcode..." className="w-full bg-background border border-input rounded-lg py-2.5 pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </form>
              <button onClick={() => setImportMode(!importMode)}
                className={`mt-2 w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${importMode ? 'bg-blue-600 text-white' : 'bg-accent text-foreground hover:bg-accent/80'}`}>
                <span className="flex items-center gap-2"><Plus size={16} />Import Mode</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${importMode ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'}`}>{importMode ? 'ON' : 'OFF'}</span>
              </button>
              {importMode && <p className="text-xs text-blue-500 mt-1.5">Scanning adds items to stock. Unknown barcodes open the add-item form.</p>}
            </div>
            <ScannedItemPanel cart={cart} onUpdateQty={handleUpdateCartQty} onAddQty={handleAddQty} onRemove={handleRemoveFromCart} onClearCart={handleClearCart} onCheckout={handleCheckout} stageName={activeStage?.name} />
          </aside>
          <main className="flex-1 p-4 overflow-hidden">
            <InventoryMatrix items={itemsWithBreakdown} stages={stages} activeStageId={activeStageId}
              onAddToCart={handleAddToCart} onReturn={handleReturn} onEdit={(item) => setEditItem(item)} onDelete={handleDeleteItem}
              onAddItem={() => setEditItem({ barcode: '', name: '', description: '', category: 'General', total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10 })} />
          </main>
        </div>
      )}

      {view === 'stages' && (
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-xl font-bold mb-4">Stage Usage Overview</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Item</th>
                    {stages.map(s => <th key={s.id} className="text-center py-3 px-3 font-semibold text-muted-foreground whitespace-nowrap">{s.name}</th>)}
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Total Out</th>
                    <th className="text-center py-3 px-3 font-semibold text-muted-foreground">Remaining</th>
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
                  {items.length === 0 && <tr><td colSpan={stages.length + 3} className="text-center py-12 text-muted-foreground">No items to display.</td></tr>}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="py-3 px-4 font-bold">Total Consumed</td>
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
          <h2 className="text-xl font-bold mb-4">Reports & Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Export</h3>
              <div className="space-y-2">
                <button onClick={handleExportExcel} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"><Download size={16} /> Export to Excel</button>
                <button onClick={handleExportJson} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground font-medium text-sm hover:bg-accent transition-colors"><Download size={16} /> Export as JSON</button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Import</h3>
              <div className="space-y-2">
                <button onClick={handleImportJson} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground font-medium text-sm hover:bg-accent transition-colors"><Upload size={16} /> Import from JSON</button>
                <button onClick={handleSeed} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground font-medium text-sm hover:bg-accent transition-colors"><Plus size={16} /> Load Sample Data</button>
              </div>
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
        <ConfirmationModal title="Delete Item" message={`Are you sure you want to delete "${deleteConfirm.name}"? This cannot be undone.`}
          confirmLabel="Delete" cancelLabel="Cancel" danger onConfirm={confirmDeleteItem} onCancel={() => setDeleteConfirm(null)} />
      )}

      {addStageModal && (
        <ConfirmationModal title="Add Stage" message="" confirmLabel="Add" cancelLabel="Cancel" onConfirm={confirmAddStage} onCancel={() => setAddStageModal(false)}>
          <input type="text" value={newStageName} onChange={e => setNewStageName(e.target.value)} placeholder="Stage name"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            autoFocus onKeyDown={e => { if (e.key === 'Enter') confirmAddStage() }} />
        </ConfirmationModal>
      )}

      {deleteStageConfirm && (
        <ConfirmationModal title="Delete Stage" message="Delete this stage? All items assigned will be returned to stock."
          confirmLabel="Delete Stage" cancelLabel="Cancel" danger onConfirm={confirmDeleteStage} onCancel={() => setDeleteStageConfirm(null)} />
      )}

      {checkoutStagePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-foreground mb-4">Select Destination</h4>
            <p className="text-sm text-muted-foreground mb-4">Choose a stage or crew to check out items to:</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stages.map(stage => (
                <button key={stage.id} onClick={() => handleCheckoutStagePick(stage.id)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-sm transition-colors">{stage.name}</button>
              ))}
            </div>
            <button onClick={() => setCheckoutStagePicker(false)} className="w-full mt-3 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">Cancel</button>
          </div>
        </div>
      )}

      {checkoutReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-foreground mb-1">Checkout Review</h4>
            <p className="text-sm text-muted-foreground mb-4">Checking out to <span className="font-semibold text-foreground">{stages.find(s => s.id === checkoutReview.stageId)?.name}</span></p>
            <div className="max-h-60 overflow-y-auto space-y-1.5 mb-4">
              {checkoutReview.cart.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between bg-accent/30 rounded-lg px-3 py-2">
                  <div><div className="text-sm font-semibold text-foreground">{entry.item.name}</div><div className="text-xs text-muted-foreground font-mono">{entry.item.barcode}</div></div>
                  <div className="text-lg font-bold text-foreground">x{entry.qty}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-muted-foreground">Total items:</span>
              <span className="font-bold text-foreground">{checkoutReview.cart.reduce((s, e) => s + e.qty, 0)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCheckoutReview(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">Cancel</button>
              <button onClick={confirmCheckout} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-colors">Confirm Checkout</button>
            </div>
          </div>
        </div>
      )}

      {addStockPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <h4 className="text-lg font-bold text-foreground">Insufficient Stock</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-1">Only <span className="font-semibold text-foreground">{addStockPrompt.item.remaining}</span> of <span className="font-semibold text-foreground">{addStockPrompt.item.name}</span> available.</p>
            <p className="text-muted-foreground text-sm mb-5">Add stock to increase quantity to {addStockPrompt.desiredQty}?</p>
            <div className="flex gap-3">
              <button onClick={handleCancelAddStock} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">Cancel</button>
              <button onClick={handleConfirmAddStock} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">Add {addStockPrompt.desiredQty - addStockPrompt.currentQty} to Stock</button>
            </div>
          </div>
        </div>
      )}

      {unknownBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={24} className="text-amber-500 shrink-0" />
              <h4 className="text-lg font-bold text-foreground">Unknown Barcode</h4>
            </div>
            <p className="text-muted-foreground text-sm mb-1">Barcode <span className="font-mono font-semibold text-foreground">{unknownBarcode}</span> was not found in inventory.</p>
            <p className="text-muted-foreground text-sm mb-5">Switch to Import Mode to add this item?</p>
            <div className="flex gap-3">
              <button onClick={() => { setImportMode(true); setEditItem({ barcode: unknownBarcode, name: '', description: '', category: 'General', total: 1, unitQuantity: 1, unitType: 'pcs', minStockThreshold: 10 }); setUnknownBarcode(null) }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">Import Item</button>
              <button onClick={() => setUnknownBarcode(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">Abort</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
