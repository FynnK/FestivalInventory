import { Plus, Trash2, Warehouse } from 'lucide-react'

export default function CrewSelector({ stages, activeStageId, onSelect, onAdd, onDelete }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stages / Crews</h3>
        <button
          onClick={onAdd}
          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="space-y-1.5">
        {stages.length === 0 && (
          <p className="text-sm text-muted-foreground italic px-2">No stages yet.</p>
        )}
        {stages.map(stage => {
          const isStorage = stage.name === 'Storage'
          return (
            <div key={stage.id} className="flex gap-1">
              <button
                onClick={() => onSelect(activeStageId === stage.id ? null : stage.id)}
                className={`flex-1 flex items-center gap-2 text-left px-3.5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
                  activeStageId === stage.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-card text-card-foreground hover:bg-accent border border-transparent'
                }`}
              >
                {isStorage && <Warehouse size={14} className="shrink-0" />}
                {stage.name}
              </button>
              {!isStorage && (
                <button
                  onClick={() => onDelete(stage.id)}
                  className="px-2 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-accent transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}