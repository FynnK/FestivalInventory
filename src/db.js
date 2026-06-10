const STORAGE_KEYS = {
  items: 'festivalInventory_items',
  stages: 'festivalInventory_stages',
  ledger: 'festivalInventory_ledger',
  version: 'festivalInventory_version',
}

const KNOWN_CATEGORIES = ['Hardware', 'Cables', 'Consumables', 'Electronics', 'Safety', 'General']
const CURRENT_VERSION = 3

let items = []
let stages = []
let ledger = []
let nextItemId = 1
let nextStageId = 1
let nextLedgerId = 1

function loadArray(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveArray(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error(`Failed to save ${key}:`, e)
  }
}

function recomputeIds() {
  nextItemId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1
  nextStageId = stages.length ? Math.max(...stages.map(s => s.id)) + 1 : 1
  nextLedgerId = ledger.length ? Math.max(...ledger.map(l => l.id)) + 1 : 1
}

function persistAll() {
  saveArray(STORAGE_KEYS.items, items)
  saveArray(STORAGE_KEYS.stages, stages)
  saveArray(STORAGE_KEYS.ledger, ledger)
}

export function ensureStorageStage() {
  const hasStorage = stages.some(s => s.name === 'Storage')
  if (!hasStorage) {
    const storage = { id: nextStageId++, name: 'Storage' }
    stages.unshift(storage)
    persistAll()
  }
}

export function initDb() {
  const version = loadArray(STORAGE_KEYS.version, 1)

  if (version === 1) {
    migrateV1toV2()
  }

  items = loadArray(STORAGE_KEYS.items, [])
  stages = loadArray(STORAGE_KEYS.stages, [])
  ledger = loadArray(STORAGE_KEYS.ledger, [])

  if (version < 3) {
    migrateV2toV3()
  }

  ensureStorageStage()
  recomputeIds()
  saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
}

function migrateV1toV2() {
  const oldItems = loadArray('festivalInventory', [])
  const oldStages = loadArray('festivalStages', ['Main Stage', 'Techno Tent', 'Acoustic Lounge', 'Cosmic Meadow', 'Warehouse'])

  if (!oldItems.length) {
    saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
    return
  }

  const stageMap = {}
  const newStages = oldStages.map((name, i) => {
    const id = i + 1
    stageMap[name] = id
    return { id, name }
  })

  const newItems = oldItems.map((oldItem, i) => ({
    id: i + 1,
    barcode: oldItem.id,
    name: oldItem.name,
    description: oldItem.description || '',
    total: oldItem.total,
    unitQuantity: oldItem.unitQuantity || 1,
    unitType: oldItem.unitType || 'pcs',
    minStockThreshold: 10,
  }))

  let ledgerId = 1
  const newLedger = []
  oldItems.forEach(oldItem => {
    const itemId = oldItems.indexOf(oldItem) + 1
    Object.entries(oldItem.usage || {}).forEach(([stageName, qty]) => {
      const stageId = stageMap[stageName]
      if (stageId && qty > 0) {
        newLedger.push({
          id: ledgerId++,
          itemId,
          stageId,
          qtyIssued: qty,
          qtyReturned: 0,
          timestamp: Date.now(),
        })
      }
    })
    if (oldItem.total - oldItem.remaining > 0 && !Object.keys(oldItem.usage || {}).length) {
      newLedger.push({
        id: ledgerId++,
        itemId,
        stageId: 0,
        qtyIssued: oldItem.total - oldItem.remaining,
        qtyReturned: 0,
        timestamp: Date.now(),
      })
    }
  })

  saveArray(STORAGE_KEYS.items, newItems)
  saveArray(STORAGE_KEYS.stages, newStages)
  saveArray(STORAGE_KEYS.ledger, newLedger)
  localStorage.removeItem('festivalInventory')
  localStorage.removeItem('festivalStages')
  saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
}

function migrateV2toV3() {
  items = items.map(item => ({
    ...item,
    category: item.category || 'General',
    note: item.note || '',
  }))
  saveArray(STORAGE_KEYS.items, items)
}

export function getItems() {
  return items.map(item => ({
    ...item,
    remaining: computeRemaining(item.id),
    netConsumed: computeNetConsumed(item.id),
  }))
}

export function getItemById(id) {
  const item = items.find(i => i.id === id)
  if (!item) return null
  return { ...item, remaining: computeRemaining(item.id), netConsumed: computeNetConsumed(item.id) }
}

export function findItemByBarcode(barcode) {
  const item = items.find(i => i.barcode === barcode)
  if (!item) return null
  return { ...item, remaining: computeRemaining(item.id), netConsumed: computeNetConsumed(item.id) }
}

export function addItem({ barcode, name, description, total, unitQuantity, unitType, minStockThreshold, category }) {
  const item = {
    id: nextItemId++,
    barcode,
    name,
    description: description || '',
    category: category || 'General',
    total: Number(total),
    unitQuantity: Number(unitQuantity) || 1,
    unitType: unitType || 'pcs',
    minStockThreshold: Number(minStockThreshold) || 10,
  }
  items.push(item)
  persistAll()
  return item
}

export function updateItem(id, updates) {
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return null
  const oldTotal = items[idx].total
  const delta = Number(updates.total) - oldTotal

  items[idx] = { ...items[idx], ...updates }

  if (delta !== 0) {
    const entry = {
      id: nextLedgerId++,
      itemId: id,
      stageId: 0,
      qtyIssued: delta < 0 ? Math.abs(delta) : 0,
      qtyReturned: delta > 0 ? delta : 0,
      timestamp: Date.now(),
    }
    ledger.push(entry)
  }

  persistAll()
  return items[idx]
}

export function deleteItem(id) {
  items = items.filter(i => i.id !== id)
  ledger = ledger.filter(l => l.itemId !== id)
  persistAll()
}

export function getStages() {
  return stages
}

export function addStage(name) {
  if (stages.some(s => s.name.toLowerCase() === name.toLowerCase())) return null
  const stage = { id: nextStageId++, name }
  stages.push(stage)
  persistAll()
  return stage
}

export function deleteStage(id) {
  const returnedEntries = ledger.filter(l => l.stageId === id && l.qtyReturned === 0)
  returnedEntries.forEach(entry => {
    const e = ledger.find(l => l.id === entry.id)
    if (e) e.qtyReturned = e.qtyIssued
  })
  stages = stages.filter(s => s.id !== id)
  if (stages.length > 0) persistAll()
  else {
    stages = []
    persistAll()
  }
}

export function issueItem(itemId, stageId, qty, note = '') {
  const item = items.find(i => i.id === itemId)
  if (!item) return false
  const currentStock = computeRemaining(itemId)
  if (currentStock < qty) return false
  if (!stageId) return false

  ledger.push({
    id: nextLedgerId++,
    itemId,
    stageId,
    qtyIssued: qty,
    qtyReturned: 0,
    timestamp: Date.now(),
    note,
  })
  persistAll()
  return true
}

export function returnItem(itemId, stageId, qty, note = '') {
  const item = items.find(i => i.id === itemId)
  if (!item) return false
  if (!stageId) return false

  const issuedToStage = ledger
    .filter(l => l.itemId === itemId && l.stageId === stageId)
    .reduce((sum, l) => sum + l.qtyIssued, 0)
  const returnedFromStage = ledger
    .filter(l => l.itemId === itemId && l.stageId === stageId)
    .reduce((sum, l) => sum + l.qtyReturned, 0)
  const netAtStage = issuedToStage - returnedFromStage

  if (qty > netAtStage) return false

  ledger.push({
    id: nextLedgerId++,
    itemId,
    stageId,
    qtyIssued: 0,
    qtyReturned: qty,
    timestamp: Date.now(),
    note,
  })
  persistAll()
  return true
}

export function getLedger() {
  return ledger
}

export function getLedgerForItem(itemId) {
  return ledger.filter(l => l.itemId === itemId)
}

export function getLedgerForItemAndStage(itemId, stageId) {
  return ledger.filter(l => l.itemId === itemId && l.stageId === stageId)
}

export function getLedgerWithDetails() {
  return ledger.map(entry => {
    const item = items.find(i => i.id === entry.itemId)
    const stage = stages.find(s => s.id === entry.stageId)
    let type = 'unknown'
    if (entry.qtyIssued > 0 && entry.qtyReturned === 0) type = 'issue'
    else if (entry.qtyReturned > 0 && entry.qtyIssued === 0) type = 'return'
    else if (entry.qtyIssued > 0 && entry.qtyReturned > 0) type = 'mixed'
    return {
      ...entry,
      itemName: item?.name || '(deleted item)',
      itemBarcode: item?.barcode || '',
      stageName: stage?.name || '(stock correction)',
      type,
      note: entry.note || '',
    }
  }).sort((a, b) => b.timestamp - a.timestamp)
}

export function reverseTransaction(entryId, note = '') {
  const entry = ledger.find(l => l.id === entryId)
  if (!entry) return false

  const qty = entry.qtyIssued || entry.qtyReturned
  if (qty <= 0) return false

  if (entry.qtyIssued > 0) {
    const netAtStage = getNetIssuedToStage(entry.itemId, entry.stageId)
    if (netAtStage < qty) return false
    ledger.push({
      id: nextLedgerId++,
      itemId: entry.itemId,
      stageId: entry.stageId,
      qtyIssued: 0,
      qtyReturned: qty,
      timestamp: Date.now(),
      note,
    })
  } else {
    ledger.push({
      id: nextLedgerId++,
      itemId: entry.itemId,
      stageId: entry.stageId,
      qtyIssued: qty,
      qtyReturned: 0,
      timestamp: Date.now(),
      note,
    })
  }

  persistAll()
  return true
}

export function getNetIssuedToStage(itemId, stageId) {
  const entries = ledger.filter(l => l.itemId === itemId && l.stageId === stageId)
  const issued = entries.reduce((s, e) => s + e.qtyIssued, 0)
  const returned = entries.reduce((s, e) => s + e.qtyReturned, 0)
  return issued - returned
}

function computeRemaining(itemId) {
  const item = items.find(i => i.id === itemId)
  if (!item) return 0
  const totalIssued = ledger
    .filter(l => l.itemId === itemId)
    .reduce((s, e) => s + e.qtyIssued, 0)
  const totalReturned = ledger
    .filter(l => l.itemId === itemId)
    .reduce((s, e) => s + e.qtyReturned, 0)
  return item.total - totalIssued + totalReturned
}

function computeNetConsumed(itemId) {
  const totalIssued = ledger
    .filter(l => l.itemId === itemId)
    .reduce((s, e) => s + e.qtyIssued, 0)
  const totalReturned = ledger
    .filter(l => l.itemId === itemId)
    .reduce((s, e) => s + e.qtyReturned, 0)
  return totalIssued - totalReturned
}

export function seedSampleData() {
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

  const sampleStages = [
    { id: nextStageId++, name: 'Storage' },
    { id: nextStageId++, name: 'Stage Build' },
    { id: nextStageId++, name: 'Lighting' },
    { id: nextStageId++, name: 'Sound' },
    { id: nextStageId++, name: 'Video' },
    { id: nextStageId++, name: 'Logistics' },
  ]

  items = sampleItems.map((s, i) => ({
    id: nextItemId++,
    ...s,
    description: s.description || '',
    minStockThreshold: 10,
    total: Number(s.total),
    unitQuantity: Number(s.unitQuantity) || 1,
    unitType: s.unitType || 'pcs',
  }))

  stages = sampleStages
  ledger = []

  persistAll()
}

export function exportData() {
  const data = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    items,
    stages,
    ledger,
  }
  return JSON.stringify(data, null, 2)
}

export function importData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.items || !data.stages) return false
    items = data.items
    stages = data.stages
    ledger = data.ledger || []
    recomputeIds()
    persistAll()
    saveArray(STORAGE_KEYS.version, CURRENT_VERSION)
    return true
  } catch {
    return false
  }
}
