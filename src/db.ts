import Dexie, { Table } from 'dexie';

export interface User {
  id: number
  name: string
  role: string
  departmentId?: number
  crewId?: number
}

export interface Crew {
  id: number
  name: string
  departmentId?: number
}

export interface Department {
  id: number
  name: string
}

export interface Item {
  id: number
  barcode: string
  name: string
  description: string
  category: string
  itemType: 'consumable' | 'rental'
  total: number
  unitQuantity: number
  unitType: string
  minStockThreshold: number
  serialNumber?: string
  uniqueId?: string
  owner?: string
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
  userId?: number
  crewId?: number
  allocationStage?: string
  qtyIssued: number
  qtyReturned: number
  timestamp: number
  note?: string
}

export interface EnrichedLedgerEntry extends LedgerEntry {
  itemName: string
  itemBarcode: string
  stageName: string
  userName?: string
  crewName?: string
  type: 'issue' | 'return' | 'mixed' | 'unknown'
}

export type ItemFormData = {
  barcode: string
  name: string
  description: string
  category: string
  itemType: 'consumable' | 'rental'
  total: number
  unitQuantity: number
  unitType: string
  minStockThreshold: number
  serialNumber?: string
  uniqueId?: string
  owner?: string
}

class FestivalInventoryDB extends Dexie {
  items!: Table<Item>
  stages!: Table<Stage>
  ledger!: Table<LedgerEntry>
  users!: Table<User>
  crews!: Table<Crew>
  departments!: Table<Department>

  constructor() {
    super('FestivalInventoryDB')
    this.version(1).stores({
      items: 'id, barcode',
      stages: 'id',
      ledger: 'id, itemId, stageId'
    })
    this.version(2).stores({
      items: 'id, barcode',
      stages: 'id',
      ledger: 'id, itemId, stageId'
    })
    this.version(3).stores({
      items: 'id, barcode, itemType',
      stages: 'id',
      ledger: 'id, itemId, stageId, userId, crewId',
      users: 'id',
      crews: 'id, departmentId',
      departments: 'id'
    })
  }
}

const db = new FestivalInventoryDB()

export { db }

export let items: Item[] = []
export let stages: Stage[] = []
export let ledger: LedgerEntry[] = []
export let users: User[] = []
export let crews: Crew[] = []
export let departments: Department[] = []
export let nextItemId = 1
export let nextStageId = 1
export let nextLedgerId = 1
export let nextUserId = 1
export let nextCrewId = 1
export let nextDepartmentId = 1

function recomputeIds(): void {
  nextItemId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1
  nextStageId = stages.length ? Math.max(...stages.map(s => s.id)) + 1 : 1
  nextLedgerId = ledger.length ? Math.max(...ledger.map(l => l.id)) + 1 : 1
  nextUserId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1
  nextCrewId = crews.length ? Math.max(...crews.map(c => c.id)) + 1 : 1
  nextDepartmentId = departments.length ? Math.max(...departments.map(d => d.id)) + 1 : 1
}

function persistAll(): void {
  db.items.clear().then(() => db.items.bulkAdd(items))
  db.stages.clear().then(() => db.stages.bulkAdd(stages))
  db.ledger.clear().then(() => db.ledger.bulkAdd(ledger))
  db.users.clear().then(() => db.users.bulkAdd(users))
  db.crews.clear().then(() => db.crews.bulkAdd(crews))
  db.departments.clear().then(() => db.departments.bulkAdd(departments))
}

export async function initDb(): Promise<void> {
  items = await db.items.toArray() as Item[]
  stages = await db.stages.toArray() as Stage[]
  ledger = await db.ledger.toArray() as LedgerEntry[]
  users = await db.users.toArray() as User[]
  crews = await db.crews.toArray() as Crew[]
  departments = await db.departments.toArray() as Department[]

  items.forEach(item => {
    if (!item.itemType) item.itemType = 'consumable'
  })

  recomputeIds()
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
  const item: Item = {
    id: nextItemId++,
    barcode: data.barcode,
    name: data.name,
    description: data.description || '',
    category: data.category || 'General',
    itemType: data.itemType || 'consumable',
    total: Number(data.total),
    unitQuantity: Number(data.unitQuantity) || 1,
    unitType: data.unitType || 'pcs',
    minStockThreshold: Number(data.minStockThreshold) || 10,
    serialNumber: data.serialNumber || undefined,
    uniqueId: data.uniqueId || undefined,
    owner: data.owner || undefined,
  }
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
  persistAll()
}

export function issueItem(itemId: number, stageId: number, qty: number, note = '', userId?: number, crewId?: number): boolean {
  const item = items.find(i => i.id === itemId)
  if (!item || !stageId) return false
  if (computeRemaining(itemId) < qty) return false
  ledger.push({
    id: nextLedgerId++, itemId, stageId, qtyIssued: qty, qtyReturned: 0,
    timestamp: Date.now(), note, userId, crewId,
    allocationStage: stages.find(s => s.id === stageId)?.name,
  } as LedgerEntry)
  persistAll()
  return true
}

export function returnItem(itemId: number, stageId: number, qty: number, note = '', userId?: number): boolean {
  const item = items.find(i => i.id === itemId)
  if (!item || !stageId) return false
  const issuedToStage = ledger.filter(l => l.itemId === itemId && l.stageId === stageId).reduce((s, l) => s + l.qtyIssued, 0)
  const returnedFromStage = ledger.filter(l => l.itemId === itemId && l.stageId === stageId).reduce((s, l) => s + l.qtyReturned, 0)
  if (qty > issuedToStage - returnedFromStage) return false
  ledger.push({
    id: nextLedgerId++, itemId, stageId, qtyIssued: 0, qtyReturned: qty,
    timestamp: Date.now(), note, userId,
  } as LedgerEntry)
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
    const user = entry.userId ? users.find(u => u.id === entry.userId) : undefined
    const crew = entry.crewId ? crews.find(c => c.id === entry.crewId) : undefined
    let type: EnrichedLedgerEntry['type'] = 'unknown'
    if (entry.qtyIssued > 0 && entry.qtyReturned === 0) type = 'issue'
    else if (entry.qtyReturned > 0 && entry.qtyIssued === 0) type = 'return'
    else if (entry.qtyIssued > 0 && entry.qtyReturned > 0) type = 'mixed'
    return {
      ...entry,
      itemName: item?.name || '(deleted item)',
      itemBarcode: item?.barcode || '',
      stageName: stage?.name || '(stock correction)',
      userName: user?.name,
      crewName: crew?.name,
      type,
      note: entry.note || '',
    }
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

export function computeBurnRate(itemId: number, days = 7): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const recentIssued = ledger
    .filter(l => l.itemId === itemId && l.timestamp >= cutoff)
    .reduce((s, e) => s + e.qtyIssued, 0)
  return recentIssued / days
}

export function getMissingAssetsPerStage(): { stageId: number; stageName: string; missing: { item: Item; expected: number; actual: number }[] }[] {
  return stages.map(stage => {
    const missing = items
      .filter(item => item.itemType === 'consumable')
      .map(item => {
        const expected = ledger
          .filter(l => l.itemId === item.id && l.stageId === stage.id && l.timestamp < Date.now() - 24 * 60 * 60 * 1000)
          .reduce((s, e) => s + e.qtyIssued, 0)
        const actual = getNetIssuedToStage(item.id, stage.id)
        return { item, expected, actual }
      })
      .filter(m => m.expected > 0 && m.actual < m.expected)
    return { stageId: stage.id, stageName: stage.name, missing }
  }).filter(s => s.missing.length > 0)
}

export function getUsers(): User[] { return users }
export function addUser(name: string, role = 'operator'): User | null {
  if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) return null
  const user: User = { id: nextUserId++, name, role }
  users.push(user)
  persistAll()
  return user
}
export function deleteUser(id: number): void {
  users = users.filter(u => u.id !== id)
  persistAll()
}

export function getCrews(): Crew[] { return crews }
export function addCrew(name: string, departmentId?: number): Crew | null {
  if (crews.some(c => c.name.toLowerCase() === name.toLowerCase())) return null
  const crew: Crew = { id: nextCrewId++, name, departmentId }
  crews.push(crew)
  persistAll()
  return crew
}
export function deleteCrew(id: number): void {
  crews = crews.filter(c => c.id !== id)
  persistAll()
}

export function getDepartments(): Department[] { return departments }
export function addDepartment(name: string): Department | null {
  if (departments.some(d => d.name.toLowerCase() === name.toLowerCase())) return null
  const dept: Department = { id: nextDepartmentId++, name }
  departments.push(dept)
  persistAll()
  return dept
}
export function deleteDepartment(id: number): void {
  departments = departments.filter(d => d.id !== id)
  persistAll()
}

export function seedSampleData(): void {
  const sampleItems: Item[] = [
    { id: nextItemId++, barcode: 'BOLT-M8', name: 'M8 Bolt', total: 200, unitQuantity: 1, unitType: 'pcs', description: 'M8 hex bolt, 30mm length', category: 'Hardware', itemType: 'consumable', minStockThreshold: 10 },
    { id: nextItemId++, barcode: 'BOLT-M10', name: 'M10 Bolt', total: 150, unitQuantity: 1, unitType: 'pcs', description: 'M10 hex bolt, 40mm length', category: 'Hardware', itemType: 'consumable', minStockThreshold: 10 },
    { id: nextItemId++, barcode: 'TAPE-GAFF', name: 'Gaffer Tape Black', total: 24, unitQuantity: 50, unitType: 'meters per roll', description: 'Professional grade gaffer tape', category: 'Consumables', itemType: 'consumable', minStockThreshold: 10 },
    { id: nextItemId++, barcode: 'CBL-XLR3', name: 'XLR 3m Cable', total: 45, unitQuantity: 1, unitType: 'cable', description: 'Professional XLR audio cable', category: 'Cables', itemType: 'consumable', minStockThreshold: 10 },
    { id: nextItemId++, barcode: 'ZIP-200', name: 'Zip Tie 200mm', total: 1000, unitQuantity: 100, unitType: 'ties per bag', description: 'Nylon zip ties', category: 'Hardware', itemType: 'consumable', minStockThreshold: 10 },
    { id: nextItemId++, barcode: 'RADIO', name: 'Two-Way Radio', total: 12, unitQuantity: 1, unitType: 'radio', description: 'Handheld two-way radio', category: 'Electronics', itemType: 'rental', minStockThreshold: 2, owner: 'Festival' },
    { id: nextItemId++, barcode: 'PWR-STRIP', name: 'Power Strip 6-outlet', total: 30, unitQuantity: 1, unitType: 'strip', description: 'Heavy duty power strip', category: 'Electronics', itemType: 'consumable', minStockThreshold: 5 },
    { id: nextItemId++, barcode: '84729103847', name: 'Screws (Box of 1000)', total: 10, unitQuantity: 1000, unitType: 'screws per box', description: 'Standard wood screws', category: 'Hardware', itemType: 'consumable', minStockThreshold: 2 },
    { id: nextItemId++, barcode: 'TAPE-DUCT', name: 'Duct Tape Silver', total: 18, unitQuantity: 50, unitType: 'meters per roll', description: 'Silver duct tape', category: 'Consumables', itemType: 'consumable', minStockThreshold: 10 },
    { id: nextItemId++, barcode: 'CBL-PWR', name: 'PowerCON Cable', total: 30, unitQuantity: 1, unitType: 'cable', description: 'PowerCON mains cable', category: 'Cables', itemType: 'consumable', minStockThreshold: 5 },
  ]
  const sampleStages: Stage[] = [
    { id: nextStageId++, name: 'Stage Build' },
    { id: nextStageId++, name: 'Lighting' }, { id: nextStageId++, name: 'Sound' },
    { id: nextStageId++, name: 'Video' }, { id: nextStageId++, name: 'Logistics' },
  ]
  const sampleDepts: Department[] = [
    { id: nextDepartmentId++, name: 'Production' },
    { id: nextDepartmentId++, name: 'Technical' },
    { id: nextDepartmentId++, name: 'Logistics' },
  ]
  const sampleCrews: Crew[] = [
    { id: nextCrewId++, name: 'Stage Crew', departmentId: 1 },
    { id: nextCrewId++, name: 'Lighting Team', departmentId: 2 },
    { id: nextCrewId++, name: 'Sound Team', departmentId: 2 },
  ]
  items = sampleItems
  stages = sampleStages
  departments = sampleDepts
  crews = sampleCrews
  ledger = []
  users = []
  persistAll()
}

export function exportData(): string {
  return JSON.stringify({ version: 3, timestamp: Date.now(), items, stages, ledger, users, crews, departments }, null, 2)
}

export function importData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.items || !data.stages) return false
    items = data.items; stages = data.stages; ledger = data.ledger || []
    users = data.users || []; crews = data.crews || []; departments = data.departments || []
    items.forEach(item => { if (!item.itemType) item.itemType = 'consumable' })
    recomputeIds(); persistAll()
    return true
  } catch { return false }
}

export async function clearDatabase(): Promise<void> {
  await db.items.clear()
  await db.stages.clear()
  await db.ledger.clear()
  await db.users.clear()
  await db.crews.clear()
  await db.departments.clear()
  items = []; stages = []; ledger = []; users = []; crews = []; departments = []
  nextItemId = 1; nextStageId = 1; nextLedgerId = 1; nextUserId = 1; nextCrewId = 1; nextDepartmentId = 1
}
