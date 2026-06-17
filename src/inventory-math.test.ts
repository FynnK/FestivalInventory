import { describe, it, expect } from 'vitest'
import { computeRemaining, computeNetConsumed, computeNetIssuedToStage, getLastIssueTimestamp } from './inventory-math'

describe('computeRemaining', () => {
  it('returns total when no ledger entries', () => {
    expect(computeRemaining({ total: 100 }, [])).toBe(100)
  })

  it('subtracts issued quantities', () => {
    const entries = [
      { stageId: 1, qtyIssued: 20, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 10, qtyReturned: 0 },
    ]
    expect(computeRemaining({ total: 100 }, entries as any)).toBe(70)
  })

  it('adds returned quantities', () => {
    const entries = [
      { stageId: 1, qtyIssued: 30, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 10 },
    ]
    expect(computeRemaining({ total: 100 }, entries as any)).toBe(80)
  })

  it('ignores stageId === 0 entries (stock corrections)', () => {
    const entries = [
      { stageId: 0, qtyIssued: 0, qtyReturned: 50 },
      { stageId: 0, qtyIssued: 20, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 30, qtyReturned: 0 },
    ]
    // stageId !== 0: issued=30, returned=0 → remaining = 100 - 30 + 0 = 70
    // stock corrections (stageId=0) are ignored
    expect(computeRemaining({ total: 100 }, entries as any)).toBe(70)
  })

  it('handles multiple stage movements correctly', () => {
    const entries = [
      { stageId: 1, qtyIssued: 50, qtyReturned: 0 },
      { stageId: 2, qtyIssued: 30, qtyReturned: 0 },
      { stageId: 3, qtyIssued: 20, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 15 },
      { stageId: 2, qtyIssued: 0, qtyReturned: 5 },
    ]
    // issued: 50+30+20=100, returned: 15+5=20
    // remaining = 200 - 100 + 20 = 120
    expect(computeRemaining({ total: 200 }, entries as any)).toBe(120)
  })
})

describe('computeNetConsumed', () => {
  it('returns 0 when no ledger entries', () => {
    expect(computeNetConsumed([])).toBe(0)
  })

  it('computes net consumed from stage movements only', () => {
    const entries = [
      { stageId: 1, qtyIssued: 50, qtyReturned: 0 },
      { stageId: 2, qtyIssued: 30, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 10 },
      { stageId: 0, qtyIssued: 0, qtyReturned: 100 }, // stock correction - ignored
    ]
    // issued: 50+30=80, returned: 10 → net = 70
    expect(computeNetConsumed(entries as any)).toBe(70)
  })
})

describe('computeNetIssuedToStage', () => {
  it('computes net for a specific stage', () => {
    const entries = [
      { stageId: 1, qtyIssued: 50, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 25, qtyReturned: 0 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 10 },
    ]
    expect(computeNetIssuedToStage(entries as any)).toBe(65)
  })
})

describe('getLastIssueTimestamp', () => {
  it('returns null when no entries', () => {
    expect(getLastIssueTimestamp([])).toBeNull()
  })

  it('returns null when fully returned', () => {
    const entries = [
      { stageId: 1, qtyIssued: 5, qtyReturned: 0, timestamp: 1000 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 5, timestamp: 2000 },
    ]
    expect(getLastIssueTimestamp(entries as any)).toBeNull()
  })

  it('returns the most recent issue timestamp when still outstanding', () => {
    const entries = [
      { stageId: 1, qtyIssued: 5, qtyReturned: 0, timestamp: 1000 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 2, timestamp: 2000 },
      { stageId: 1, qtyIssued: 3, qtyReturned: 0, timestamp: 3000 },
    ]
    expect(getLastIssueTimestamp(entries as any)).toBe(3000)
  })

  it('returns first issue timestamp when partially returned', () => {
    const entries = [
      { stageId: 1, qtyIssued: 10, qtyReturned: 0, timestamp: 5000 },
      { stageId: 1, qtyIssued: 0, qtyReturned: 4, timestamp: 6000 },
    ]
    expect(getLastIssueTimestamp(entries as any)).toBe(5000)
  })
})
