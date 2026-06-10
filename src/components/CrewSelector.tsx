import { Plus, Trash2 } from 'lucide-react'
import type { Stage } from '../db'
import { useI18n } from '../i18n'

export default function CrewSelector({
  stages,
  activeStageId,
  onSelect,
  onAdd,
  onDelete,
}: {
  stages: Stage[]
  activeStageId: number | null
  onSelect: (id: number | null) => void
  onAdd: () => void
  onDelete: (id: number) => void
}) {
  const { t } = useI18n()
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('crew_selector_heading')}</h3>
        <button onClick={onAdd} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          <Plus size={12} /> {t('crew_selector_add_button')}
        </button>
      </div>
      <div className="space-y-1.5">
        {stages.length === 0 && <p className="text-sm text-muted-foreground italic px-2">{t('crew_selector_no_stages')}</p>}
        {stages.map(stage => (
          <div key={stage.id} className="flex gap-1">
            <button
              onClick={() => onSelect(activeStageId === stage.id ? null : stage.id)}
              className={`flex-1 flex items-center gap-2 text-left px-3.5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
                activeStageId === stage.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-card text-card-foreground hover:bg-accent border border-transparent'
              }`}
            >
              {stage.name}
            </button>
            <button onClick={() => onDelete(stage.id)} className="px-2 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
