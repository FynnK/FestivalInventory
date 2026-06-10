const STORAGE_KEYS = {
  items: 'festivalInventory_items',
  stages: 'festivalInventory_stages',
  ledger: 'festivalInventory_ledger',
  version: 'festivalInventory_version',
}

const CURRENT_VERSION = 3

export interface Item {
  id: number
  barcode: string
  name: string
  description: string
  category: string
  total: number
  unitQuantity: number
  unitType: string
  minStockThreshold: number
  remaining?: number
  netConsumed?: number
  stageBreakdown?: Record<number, number>
}

export interface Stage {
  id: number
  name: string
}

export interface LedgerEntry {
  id: number
  itemId: number
  stageId: number
  qtyIssued: number
  qtyReturned: number
  timestamp: number
  note?: string
}

export interface EnrichedLedgerEntry extends LedgerEntry {
  itemName: string
  itemBarcode: string
  stageName: string
  type: 'issue' | 'return' | 'mixed' | 'unknown'
}

export type ItemFormData = {
  barcode: string
  name: string
  description: string
  category: string
  total: number
  unitQuantity: number
  unitType: string
  minStockThreshold: number
}

let items: Item[] = []
let stages: Stage[] = []
let ledger: LedgerEntry[] = []
let nextItemId = 1
let nextStageId = 1
let nextLedgerId = 1

function loadArray(key: string, fallback: unknown[] = []): unknown[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveArray(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save ${key}:`, e)
  }
}

function recomputeIds(): void {
  nextItemId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1
  nextStageId = stages.length ? Math.max(...stages.map(s => s.id)) + 1 : 1
  nextLedgerId = ledger.length ? Math.max(...ledger.map(l => l.id)) + 1 : 1
}

function persistAll(): void {
  saveArray(STORAGE_KEYS.items, items)
  saveArray(STORAGE_KEYS.stages, stages)
  saveArray(STORAGE_KEYS.ledger, ledger)
}

export function ensureStorageStage(): void {
  const hasStorage = stages.some(s => s.name === 'Storage')
  if (!hasStorage) {
    const storage: Stage = { id: nextStageId++, name: 'Storage' }
    stages.unshift(storage)
    persistAll()
  }
}

export function initDb(): void {
  const version: number = (loadArray(STORAGE_KEYS.version, [1])[0] as number) || 1
  if (version === 1) migrateV1toV2()
  items = loadArray(STORAGE_KEYS.items, []) as Item[]
  stages = loadArray(STORAGE_KEYS.stages, []) as Stage[]
  ledger = loadArray(STORAGE_KEYS.ledger, []) as LedgerEntry[]
  if (version < 3) migrateV2toV3()
  ensureStorageStage()
  recomputeIds()
  saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
}

function migrateV1toV2(): void {
  const oldItems: any[] = loadArray('festivalInventory', []) as any[]
  const oldStages: string[] = loadArray('festivalStages', ['Main Stage', 'Techno Tent', 'Acoustic Lounge', 'Cosmic Meadow', 'Warehouse']) as string[]
  if (!oldItems.length) { saveArray(STORAGE_KEYS.version, CURRENT_VERSION); return }
  const stageMap: Record<string, number> = {}
  const newStages: Stage[] = oldStages.map((name, i) => { stageMap[name] = i + 1; return { id: i + 1, name } })
  const newItems: Item[] = oldItems.map((oldItem, i) => ({ id: i + 1, barcode: oldItem.id, name: oldItem.name, description: oldItem.description || '', total: oldItem.total, unitQuantity: oldItem.unitQuantity || 1, unitType: oldItem.unitType || 'pcs', minStockThreshold: 10, category: 'General' }))
  let ledgerId = 1
  const newLedger: LedgerEntry[] = []
  oldItems.forEach(oldItem => {
    const itemId = oldItems.indexOf(oldItem) + 1
    Object.entries(oldItem.usage || {}).forEach(([stageName, qty]) => {
      const stageId = stageMap[stageName]
      if (stageId && (qty as number) > 0) newLedger.push({ id: ledgerId++, itemId, stageId, qtyIssued: qty as number, qtyReturned: 0, timestamp: Date.now() })
    })
    if (oldItem.total - oldItem.remaining > 0 && !Object.keys(oldItem.usage || {}).length)
      newLedger.push({ id: ledgerId++, itemId, stageId: 0, qtyIssued: oldItem.total - oldItem.remaining, qtyReturned: 0, timestamp: Date.now() })
  })
  saveArray(STORAGE_KEYS.items, newItems)
  saveArray(STORAGE_KEYS.stages, newStages)
  saveArray(STORAGE_KEYS.ledger, newLedger)
  localStorage.removeItem('festivalInventory')
  localStorage.removeItem('festivalStages')
  saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
}

function migrateV2toV3(): void {
  items = items.map(item => ({ ...item, category: (item as any).category || 'General', note: (item as any).note || '' }))
  saveArray(STORAGE_KEYS.items, items)
}

export function getItems(): Item[] {
  return items.map(item => ({ ...item, remaining: computeRemaining(item.id), netConsumed: computeNetConsumed(item.id) }))
}

export function getItemById(id: number): Item | null {
  const item = items.find(i => i.id === id)
  return item ? { ...item, remaining: computeRemaining(item.id), netConsumed: computeNetConsumed(item.id) } : null
}

export function findItemByBarcode(barcode: string): Item | null {
  const item = items.find(i => i.barcode === barcode)
  return item ? { ...item, remaining: computeRemaining(item.id), netConsumed: computeNetConsumed(item.id) } : null
}

export function addItem(data: ItemFormData): Item {
  const item: Item = { id: nextItemId++, barcode: data.barcode, name: data.name, description: data.description || '', category: data.category || 'General', total: Number(data.total), unitQuantity: Number(data.unitQuantity) || 1, unitType: data.unitType || 'pcs', minStockThreshold: Number(data.minStockThreshold) || 10 }
  items.push(item)
  persistAll()
  return item
}

export function updateItem(id: number, updates: Partial<Item>): Item | null {
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  const oldTotal = items[idx].total
  const delta = Number(updates.total) - oldTotal
  items[idx] = { ...items[idx], ...updates }
  if (delta !== 0) ledger.push({ id: nextLedgerId++, itemId: id, stageId: 0, qtyIssued: delta < 0 ? Math.abs(delta) : 0, qtyReturned: delta > 0 ? delta : 0, timestamp: Date.now() } as LedgerEntry)
  persistAll()
  return items[idx]
}

export function deleteItem(id: number): void {
  items = items.filter(i => i.id !== id)
  ledger = ledger.filter(l => l.itemId !== id)
  persistAll()
}

export function getStages(): Stage[] { return stages }

export function addStage(name: string): Stage | null {
  if (stages.some(s => s.name.toLowerCase() === name.toLowerCase())) return null
  const stage: Stage = { id: nextStageId++, name }
  stages.push(stage)
  persistAll()
  return stage
}

export function deleteStage(id: number): void {
  ledger.filter(l => l.stageId === id && l.qtyReturned === 0).forEach(entry => { const e = ledger.find(l => l.id === entry.id); if (e) e.qtyReturned = e.qtyIssued })
  stages = stages.filter(s => s.id !== id)
  stages.length > 0 ? persistAll() : (stages = [], persistAll())
}

export function issueItem(itemId: number, stageId: number, qty: number, note = ''): boolean {
  const item = items.find(i => i.id === itemId)
  if (!item || computeRemaining(itemId) < qty || !stageId) return false
  ledger.push({ id: nextLedgerId++, itemId, stageId, qtyIssued: qty, qtyReturned: 0, timestamp: Date.now(), note } as LedgerEntry)
  persistAll()
  return true
}

export function returnItem(itemId: number, stageId: number, qty: number, note = ''): boolean {
  const item = items.find(i => i.id === itemId)
  if (!item || !stageId) return false
  const issuedToStage = ledger.filter(l => l.itemId === itemId && l.stageId === stageId).reduce((s, l) => s + l.qtyIssued, 0)
  const returnedFromStage = ledger.filter(l => l.itemId === itemId && l.stageId === stageId).reduce((s, l) => s + l.qtyReturned, 0)
  if (qty > issuedToStage - returnedFromStage) return false
  ledger.push({ id: nextLedgerId++, itemId, stageId, qtyIssued: 0, qtyReturned: qty, timestamp: Date.now(), note } as LedgerEntry)
  persistAll()
  return true
}

export function getLedger(): LedgerEntry[] { return ledger }
export function getLedgerForItem(itemId: number): LedgerEntry[] { return ledger.filter(l => l.itemId === itemId) }
export function getLedgerForItemAndStage(itemId: number, stageId: number): LedgerEntry[] { return ledger.filter(l => l.itemId === itemId && l.stageId === stageId) }

export function getLedgerWithDetails(): EnrichedLedgerEntry[] {
  return ledger.map(entry => {
    const item = items.find(i => i.id === entry.itemId)
    const stage = stages.find(s => s.id === entry.stageId)
    let type: EnrichedLedgerEntry['type'] = 'unknown'
    if (entry.qtyIssued > 0 && entry.qtyReturned === 0) type = 'issue'
    else if (entry.qtyReturned > 0 && entry.qtyIssued === 0) type = 'return'
    else if (entry.qtyIssued > 0 && entry.qtyReturned > 0) type = 'mixed'
    return { ...entry, itemName: item?.name || '(deleted item)', itemBarcode: item?.barcode || '', stageName: stage?.name || '(stock correction)', type, note: entry.note || '' }
  }).sort((a, b) => b.timestamp - a.timestamp)
}

export function reverseTransaction(entryId: number, note = ''): boolean {
  const entry = ledger.find(l => l.id === entryId)
  if (!entry) return false
  const qty = entry.qtyIssued || entry.qtyReturned
  if (qty <= 0) return false
  if (entry.qtyIssued > 0) {
    if (getNetIssuedToStage(entry.itemId, entry.stageId) < qty) return false
    ledger.push({ id: nextLedgerId++, itemId: entry.itemId, stageId: entry.stageId, qtyIssued: 0, qtyReturned: qty, timestamp: Date.now(), note } as LedgerEntry)
  } else {
    ledger.push({ id: nextLedgerId++, itemId: entry.itemId, stageId: entry.stageId, qtyIssued: qty, qtyReturned: 0, timestamp: Date.now(), note } as LedgerEntry)
  }
  persistAll()
  return true
}

export function getNetIssuedToStage(itemId: number, stageId: number): number {
  const entries = ledger.filter(l => l.itemId === itemId && l.stageId === stageId)
  return entries.reduce((s, e) => s + e.qtyIssued, 0) - entries.reduce((s, e) => s + e.qtyReturned, 0)
}

function computeRemaining(itemId: number): number {
  const item = items.find(i => i.id === itemId)
  if (!item) return 0
  const totalIssued = ledger.filter(l => l.itemId === itemId).reduce((s, e) => s + e.qtyIssued, 0)
  const totalReturned = ledger.filter(l => l.itemId === itemId).reduce((s, e) => s + e.qtyReturned, 0)
  return item.total - totalIssued + totalReturned
}

function computeNetConsumed(itemId: number): number {
  const totalIssued = ledger.filter(l => l.itemId === itemId).reduce((s, e) => s + e.qtyIssued, 0)
  const totalReturned = ledger.filter(l => l.itemId === itemId).reduce((s, e) => s + e.qtyReturned, 0)
  return totalIssued - totalReturned
}

export function seedSampleData(): void {
  const sampleItems = [
    { barcode: 'BOLT-M8', name: 'M8 Bolt', total: 200, unitQuantity: 1, unitType: 'pcs', description: 'M8 hex bolt, 30mm length', category: 'Hardware' },
    { barcode: 'BOLT-M10', name: 'M10 Bolt', total: 150, unitQuantity: 1, unitType: 'pcs', description: 'M10 hex bolt, 40mm length', category: 'Hardware' },
    { barcode: 'TAPE-GAFF', name: 'Gaffer Tape Black', total: 24, unitQuantity: 50, unitType: 'meters per roll', description: 'Professional grade gaffer tape', category: 'Consumables' },
    { barcode: 'CBL-XLR3', name: 'XLR 3m Cable', total: 45, unitQuantity: 1, unitType: 'cable', description: 'Professional XLR audio cable', category: 'Cables' },
    { barcode: 'ZIP-200', name: 'Zip Tie 200mm', total: 1000, unitQuantity: 100, unitType: 'ties per bag', description: 'Nylon zip ties', category: 'Hardware' },
    { barcode: 'RADIO', name: 'Two-Way Radio', total: 12, unitQuantity: 1, unitType: 'radio', description: 'Handheld two-way radio', category: 'Electronics' },
    { barcode: 'PWR-STRIP', name: 'Power Strip 6-outlet', total: 30, unitQuantity: 1, unitType: 'strip', description: 'Heavy duty power strip', category: 'Electronics' },
    { barcode: '84729103847', name: 'Screws (Box of 1000)', total: 10, unitQuantity: 1000, unitType: 'screws per box', description: 'Standard wood screws', category: 'Hardware' },
    { barcode: 'TAPE-DUCT', name: 'Duct Tape Silver', total: 18, unitQuantity: 50, unitType: 'meters per roll', description: 'Silver duct tape', category: 'Consumables' },
    { barcode: 'CBL-PWR', name: 'PowerCON Cable', total: 30, unitQuantity: 1, unitType: 'cable', description: 'PowerCON mains cable', category: 'Cables' },
  ]
  const sampleStages: Stage[] = [
    { id: nextStageId++, name: 'Storage' }, { id: nextStageId++, name: 'Stage Build' },
    { id: nextStageId++, name: 'Lighting' }, { id: nextStageId++, name: 'Sound' },
    { id: nextStageId++, name: 'Video' }, { id: nextStageId++, name: 'Logistics' },
  ]
  items = sampleItems.map(s => ({ id: nextItemId++, ...s, description: s.description || '', minStockThreshold: 10, total: Number(s.total), unitQuantity: Number(s.unitQuantity) || 1, unitType: s.unitType || 'pcs' }))
  stages = sampleStages
  ledger = []
  persistAll()
}

export function exportData(): string {
  return JSON.stringify({ version: CURRENT_VERSION, timestamp: Date.now(), items, stages, ledger }, null, 2)
}

export function importData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.items || !data.stages) return false
    items = data.items; stages = data.stages; ledger = data.ledger || []
    recomputeIds(); persistAll(); saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
    return true
  } catch { return false }
}
