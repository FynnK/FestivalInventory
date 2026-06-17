import type { Item, LedgerEntry } from './db'

export function computeRemaining(item: { total: number }, ledgerForItem: LedgerEntry[]): number {
  const totalIssued = ledgerForItem
    .filter(e => e.stageId !== 0)
    .reduce((s, e) => s + e.qtyIssued, 0)
  const totalReturned = ledgerForItem
    .filter(e => e.stageId !== 0)
    .reduce((s, e) => s + e.qtyReturned, 0)
  return item.total - totalIssued + totalReturned
}

export function computeNetConsumed(ledgerForItem: LedgerEntry[]): number {
  const totalIssued = ledgerForItem
    .filter(e => e.stageId !== 0)
    .reduce((s, e) => s + e.qtyIssued, 0)
  const totalReturned = ledgerForItem
    .filter(e => e.stageId !== 0)
    .reduce((s, e) => s + e.qtyReturned, 0)
  return totalIssued - totalReturned
}

export function computeNetIssuedToStage(ledgerForItemAndStage: LedgerEntry[]): number {
  return ledgerForItemAndStage.reduce((s, e) => s + e.qtyIssued, 0)
    - ledgerForItemAndStage.reduce((s, e) => s + e.qtyReturned, 0)
}

export function computeBurnRate(ledgerForItem: LedgerEntry[], days = 7): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const recentIssued = ledgerForItem
    .filter(e => e.timestamp >= cutoff)
    .reduce((s, e) => s + e.qtyIssued, 0)
  return recentIssued / days
}

export function getLastIssueTimestamp(ledgerForItemAndStage: LedgerEntry[]): number | null {
  let balance = 0
  let lastTimestamp: number | null = null
  const sorted = [...ledgerForItemAndStage].sort((a, b) => a.timestamp - b.timestamp)
  for (const entry of sorted) {
    balance += entry.qtyIssued - entry.qtyReturned
    if (entry.qtyIssued > 0) {
      lastTimestamp = entry.timestamp
    }
  }
  return balance > 0 ? lastTimestamp : null
}
