import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, X, Check, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { addItem, addStage, addCrew, addUser } from '../db'
import type { ItemFormData } from '../db'
import { useI18n } from '../i18n'

type ImportType = 'items' | 'stages' | 'crews' | 'users'

interface ParsedRow {
  [key: string]: string | number
}

const FIELD_MAPPINGS: Record<ImportType, { field: string; aliases: string[] }[]> = {
  items: [
    { field: 'barcode', aliases: ['barcode', ' Barcode', 'Barcode ID', 'SKU', 'sku', 'id'] },
    { field: 'name', aliases: ['name', 'Name', 'Item Name', 'Item', 'item', 'product', 'Product'] },
    { field: 'description', aliases: ['description', 'Description', 'Desc', 'desc', 'notes', 'Notes'] },
    { field: 'category', aliases: ['category', 'Category', 'Type', 'type', 'group', 'Group'] },
    { field: 'itemType', aliases: ['itemType', 'Item Type', 'item type', 'type', 'Type', 'consumable', 'rental'] },
    { field: 'total', aliases: ['total', 'Total', 'Qty', 'qty', 'Quantity', 'quantity', 'Stock', 'stock', 'Count', 'count'] },
    { field: 'unitQuantity', aliases: ['unitQuantity', 'Unit Qty', 'Units', 'units', 'Units Per Package'] },
    { field: 'unitType', aliases: ['unitType', 'Unit Type', 'unit type', 'Unit', 'unit'] },
    { field: 'minStockThreshold', aliases: ['minStockThreshold', 'Min Stock', 'Low Stock', 'Threshold', 'threshold'] },
    { field: 'serialNumber', aliases: ['serialNumber', 'Serial Number', 'Serial', 'serial', 'S/N'] },
    { field: 'uniqueId', aliases: ['uniqueId', 'Unique ID', 'Asset Tag', 'Asset ID', 'UID'] },
    { field: 'owner', aliases: ['owner', 'Owner', 'Vendor', 'vendor', 'Supplier', 'supplier'] },
  ],
  stages: [
    { field: 'name', aliases: ['name', 'Name', 'Stage', 'stage', 'Stage Name', 'Crew Name'] },
  ],
  crews: [
    { field: 'name', aliases: ['name', 'Name', 'Crew', 'crew', 'Crew Name', 'Team', 'team'] },
    { field: 'departmentId', aliases: ['departmentId', 'Department', 'department', 'Dept', 'dept'] },
  ],
  users: [
    { field: 'name', aliases: ['name', 'Name', 'User', 'user', 'Employee', 'employee', 'Staff', 'staff'] },
    { field: 'role', aliases: ['role', 'Role', 'Position', 'position', 'Title', 'title'] },
  ],
}

function mapRowToFields(row: ParsedRow, mappings: { field: string; aliases: string[] }[]): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  const headers = Object.keys(row)

  for (const mapping of mappings) {
    for (const alias of mapping.aliases) {
      const match = headers.find(h => h.trim().toLowerCase() === alias.trim().toLowerCase())
      if (match && row[match] !== undefined && row[match] !== '') {
        result[mapping.field] = row[match]
        break
      }
    }
  }
  return result
}

export default function BulkImportModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const [importType, setImportType] = useState<ImportType>('items')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ParsedRow[]>([])
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResults(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(sheet)
        setPreview(jsonData.slice(0, 5))
      } catch {
        setPreview([])
      }
    }
    reader.readAsArrayBuffer(f)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)

    try {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet)
          const mappings = FIELD_MAPPINGS[importType]

          let success = 0
          const errors: string[] = []

          for (let i = 0; i < rows.length; i++) {
            try {
              const mapped = mapRowToFields(rows[i], mappings)

              if (importType === 'items') {
                if (!mapped.barcode || !mapped.name) {
                  errors.push(`Row ${i + 2}: Missing barcode or name`)
                  continue
                }
                const form: ItemFormData = {
                  barcode: String(mapped.barcode),
                  name: String(mapped.name),
                  description: String(mapped.description || ''),
                  category: String(mapped.category || 'General'),
                  itemType: (mapped.itemType === 'rental' ? 'rental' : 'consumable') as 'consumable' | 'rental',
                  total: Number(mapped.total) || 1,
                  unitQuantity: Number(mapped.unitQuantity) || 1,
                  unitType: String(mapped.unitType || 'pcs'),
                  minStockThreshold: Number(mapped.minStockThreshold) || 10,
                  serialNumber: String(mapped.serialNumber || ''),
                  uniqueId: String(mapped.uniqueId || ''),
                  owner: String(mapped.owner || ''),
                }
                addItem(form)
                success++
              } else if (importType === 'stages') {
                if (!mapped.name) { errors.push(`Row ${i + 2}: Missing name`); continue }
                const result = addStage(String(mapped.name))
                if (!result) errors.push(`Row ${i + 2}: Stage "${mapped.name}" already exists`)
                else success++
              } else if (importType === 'crews') {
                if (!mapped.name) { errors.push(`Row ${i + 2}: Missing name`); continue }
                const result = addCrew(String(mapped.name))
                if (!result) errors.push(`Row ${i + 2}: Crew "${mapped.name}" already exists`)
                else success++
              } else if (importType === 'users') {
                if (!mapped.name) { errors.push(`Row ${i + 2}: Missing name`); continue }
                const result = addUser(String(mapped.name), String(mapped.role || 'operator'))
                if (!result) errors.push(`Row ${i + 2}: User "${mapped.name}" already exists`)
                else success++
              }
            } catch (err) {
              errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`)
            }
          }

          setResults({ success, errors })
          setLoading(false)
        } catch {
          setResults({ success: 0, errors: ['Failed to parse file'] })
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } catch {
      setResults({ success: 0, errors: ['Failed to read file'] })
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{t('bulk_import_title')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('bulk_import_type_label')}</label>
            <select value={importType} onChange={e => { setImportType(e.target.value as ImportType); setFile(null); setPreview([]); setResults(null) }}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="items">{t('bulk_import_type_items')}</option>
              <option value="stages">{t('bulk_import_type_stages')}</option>
              <option value="crews">{t('bulk_import_type_crews')}</option>
              <option value="users">{t('bulk_import_type_users')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('bulk_import_upload_label')}</label>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-input text-muted-foreground hover:text-foreground hover:border-primary transition-colors">
              {file ? <FileSpreadsheet size={20} /> : <Upload size={20} />}
              <span className="text-sm font-medium">{file ? file.name : t('bulk_import_click_to_select')}</span>
            </button>
          </div>

          {preview.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('bulk_import_preview_label')}</label>
              <div className="bg-muted/30 rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(preview[0]).map(key => (
                        <th key={key} className="px-2 py-1.5 text-left font-semibold text-muted-foreground">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-border/30">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-2 py-1.5 text-foreground">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results && (
            <div className={`rounded-lg p-3 ${results.errors.length === 0 ? 'bg-emerald-600/10 border border-emerald-600/30' : 'bg-amber-600/10 border border-amber-600/30'}`}>
              <div className="flex items-center gap-2 mb-1">
                {results.errors.length === 0 ? <Check size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                <span className="text-sm font-semibold text-foreground">{t('bulk_import_success_count', { count: results.success })}</span>
              </div>
              {results.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.errors.slice(0, 10).map((err, i) => (
                    <p key={i} className="text-xs text-destructive">{err}</p>
                  ))}
                  {results.errors.length > 10 && <p className="text-xs text-muted-foreground">{t('bulk_import_more_errors', { count: results.errors.length - 10 })}</p>}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium text-sm">{t('bulk_import_close_button')}</button>
            <button onClick={handleImport} disabled={!file || loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
              {loading ? t('bulk_import_importing') : t('bulk_import_data_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
