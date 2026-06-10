# Festival Inventory Management - Project Roadmap

## Infrastructure & Core Capability
- [x] **PWA Implementation**
    - [x] Install and configure `vite-plugin-pwa`
    - [x] Configure service workers for offline asset caching (index.html, bundles, assets)
    - [x] Implement an "Offline Status" visual banner in the UI
- [ ] **Database Migration & Sync Engine**
    - [x] Migrate from `localStorage` to `IndexedDB` (using Dexie.js or RxDB)
    - [ ] Implement multi-user sync and conflict resolution engine (e.g., Last-Write-Wins based on precise timestamps)
    - [ ] Create a manual "Force Sync Now" button for operators leaving a dead zone
    - [x] Update `src/db.js` initialization logic

## Data Model & Schema Expansion
- [x] **Entity Models**
    - [x] Create `users` collection
    - [x] Create `crews` and `departments` collections
- [x] **Inventory Schema Update**
    - [x] Add `itemType` ('consumable' vs. 'rental') to `items`
    - [x] Add `serialNumber` / `uniqueId` support for Rentals
    - [x] Add `owner` field to rentals (to distinguish Festival stock from Third-Party Rental Company A/B)
    - [x] Update `ledger` to include `userId`, `crewId`, and `allocationStage` for accountability
- [x] **Bulk Data Ingestion (Crucial Pre-Festival Step)**
    - [x] Create an active CSV/Excel parser to bulk-upload thousands of items, crews, and users into IndexedDB simultaneously before the gates open

## Feature Implementation
- [x] **Hybrid Checkout Logic**
    - [x] Refactor `issueItem` / `returnItem` to branch based on `itemType` (decrement quantity vs. toggle status to 'deployed')
    - [ ] Implement "Sticky Session" for rapid scanning (preset Crew/Stage/User combo)
    - [ ] Implement a "Bulk Add Multiplier" UI override (so an operator can scan one box of screws but manually type x10 instead of scanning it 10 times)
- [ ] **Analytics & Strike Tools**
    - [x] Build "Burn Rate" calculation engine (velocity of consumables usage over time)
    - [ ] Implement "Strike Mode" to identify missing assets per stage
    - [ ] Generate "Missing Asset" checklist grouped by Original Supplier/Owner for tear-down phase

## UI/UX & Polish
- [ ] **Scanner Optimization**
    - [ ] Add "Rapid Scan" mode with auto-focus for device camera
    - [x] Keyboard Input Listener: Ensure the app seamlessly intercepts inputs from physical USB/Bluetooth hardware barcode scanners (which act as standard keyboards terminating with an Enter key)
    - [ ] Implement aggressive visual/audio feedback for successful scan vs. error (loud beep / screen flash—crucial in loud festival environments)
    - [ ] Implement "Return Mode" high-contrast visual indicator (e.g., screen goes orange/blue so the operator knows they are checking things in instead of out)
- [x] **Reporting Dashboard & System Maintenance**
    - [x] Add visual "Burn Rate" charts using `recharts`
    - [x] Emergency Nuclear Option: Add a hidden "Clear/Reset Local DB" button in settings for troubleshooting sync corruption on-site
