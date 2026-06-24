import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassBadge } from '../ui/GlassBadge';
import { DEPT_LABEL, DEPT_ACCENT } from '../../constants/departments';
import { TYPE_ICON, TYPE_LABEL, DeliverablePreview } from './deliverableConstants';
import { parseOutputJson } from '../../utils/parseTaskOutput';

export interface DeliverableData {
  id: string;
  title: string;
  department: string;
  output: string | null;
  createdAt: string;
}

export type Importance = 'high' | 'mid' | 'low';

const IMPORTANCE_META: Record<Importance, { label: string; color: string }> = {
  high: { label: '高', color: '#E11D48' },
  mid: { label: '中', color: '#F59E0B' },
  low: { label: '低', color: '#94A3B8' },
};

interface DeliverableCardProps {
  item: DeliverableData;
  onClick?: () => void;
  importance?: Importance;
  onCycleImportance?: () => void;
}

/**
 * DeliverableCard — sortable glass card for the Deliverables board.
 * Uses DESIGN.md GlassCard primitive.
 */
export function DeliverableCard({ item, onClick, importance, onCycleImportance }: DeliverableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const parsed = parseOutputJson(item.output ?? undefined);
  const taskType = parsed?.taskType;
  const Icon = TYPE_ICON[taskType] ?? FileText;
  const accent = DEPT_ACCENT[item.department] ?? '#8A8A8A';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <GlassCard
        variant="regular"
        tone={item.department}
        interactive
        padding="md"
        radius="lg"
        className="relative group"
        onClick={onClick}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-base text-muted hover:text-primary cursor-grab active:cursor-grabbing"
          aria-label="ドラッグで移動"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${accent}18`, color: accent }}
          >
            <Icon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary truncate">
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {(() => {
                const meta = IMPORTANCE_META[importance ?? 'mid'];
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCycleImportance?.();
                    }}
                    title="クリックで重要度を変更（高→中→低）"
                    className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-micro font-bold transition-transform hover:scale-105"
                    style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    重要度{meta.label}
                  </button>
                );
              })()}
              <GlassBadge tone={item.department} size="xs">
                {DEPT_LABEL[item.department] ?? item.department}
              </GlassBadge>
              {taskType && (
                <span className="text-micro text-muted">
                  {TYPE_LABEL[taskType] ?? taskType}
                </span>
              )}
              <span className="text-micro text-muted">
                ·{' '}
                {new Date(item.createdAt).toLocaleDateString('ja-JP', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Preview */}
        {parsed ? (
          <DeliverablePreview data={parsed} />
        ) : item.output ? (
          <p className="text-xs text-secondary line-clamp-3">
            {item.output.slice(0, 150)}
          </p>
        ) : null}
      </GlassCard>
    </div>
  );
}
