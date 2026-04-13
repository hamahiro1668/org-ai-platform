import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Package, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { DeliverableCard, type DeliverableData } from '../components/Deliverables/DeliverableCard';
import { FolderTabs } from '../components/Deliverables/FolderTabs';
import { useDeliverablesStore } from '../store/deliverablesStore';
import { DEPT_ACCENT } from '../constants/departments';

interface BackendTask {
  id: string;
  title: string;
  status: string;
  department: string;
  output: string | null;
  createdAt: string;
  logs?: { id: string; message: string; level: string; createdAt: string }[];
}

/**
 * DeliverablesPage — organized deliverables board.
 * See DESIGN.md §11.4. Uses Glass primitives, DnD-kit for DnD.
 */
export default function DeliverablesPage() {
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    folders,
    activeFolderId,
    setActiveFolder,
    reorderInFolder,
    moveToFolder,
    addItemIfMissing,
  } = useDeliverablesStore();

  // Fetch tasks
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ success: boolean; data: BackendTask[] }>('/tasks');
        if (res.data.success) {
          const done = res.data.data.filter((t) => t.status === 'DONE' && t.output);
          setTasks(done);
          done.forEach((t) => addItemIfMissing(t.id));
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [addItemIfMissing]);

  // Build id -> task map
  const taskMap = useMemo(() => {
    const m = new Map<string, BackendTask>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  // Active folder items
  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const displayItems: DeliverableData[] = useMemo(() => {
    if (activeFolderId === 'all') {
      return tasks.map((t) => ({
        id: t.id,
        title: t.title,
        department: t.department,
        output: t.output,
        createdAt: t.createdAt,
      }));
    }
    if (!activeFolder) return [];
    return activeFolder.itemIds
      .map((id) => taskMap.get(id))
      .filter((t): t is BackendTask => !!t)
      .map((t) => ({
        id: t.id,
        title: t.title,
        department: t.department,
        output: t.output,
        createdAt: t.createdAt,
      }));
  }, [activeFolderId, activeFolder, tasks, taskMap]);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!over) return;

      const overId = over.id as string;
      const activeIdStr = active.id as string;

      // Dropped on folder tab
      if (overId.startsWith('folder-drop-')) {
        const targetFolder = overId.replace('folder-drop-', '');
        moveToFolder(activeIdStr, targetFolder);
        return;
      }

      // Reorder within current folder
      if (activeIdStr !== overId && activeFolderId !== 'all') {
        reorderInFolder(activeFolderId, activeIdStr, overId);
      }
    },
    [activeFolderId, reorderInFolder, moveToFolder],
  );

  const activeTask = activeId ? taskMap.get(activeId) : null;

  // Department stats
  const deptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) counts[t.department] = (counts[t.department] ?? 0) + 1;
    return counts;
  }, [tasks]);

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 pb-6 pt-2">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <GlassCard variant="thick" padding="lg" radius="xl" reflectionTop>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md glass-regular flex items-center justify-center shadow-elev-2">
                <Package size={22} className="text-accent" />
              </div>
              <div>
                <h1 className="text-h2 font-bold text-primary">成果物</h1>
                <p className="text-sm text-secondary">
                  各部署のAIが作成した資料・データ・分析結果を整理・管理
                </p>
              </div>
            </div>
            <GlassButton variant="glass" size="sm" icon={<Sparkles size={13} />}>
              全 {tasks.length} 件
            </GlassButton>
          </div>

          {/* Department stats strip */}
          {Object.keys(deptCounts).length > 0 && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              {Object.entries(deptCounts).map(([dept, count]) => (
                <div
                  key={dept}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-thin"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: DEPT_ACCENT[dept] ?? '#8A8A8A' }}
                  />
                  <span className="text-xs text-secondary">{dept}</span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: DEPT_ACCENT[dept] ?? '#2A241C' }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Folder tabs */}
        <FolderTabs folders={folders} activeId={activeFolderId} onSelect={setActiveFolder} />

        {/* Grid with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={displayItems.map((i) => i.id)} strategy={rectSortingStrategy}>
            {loading ? (
              <GlassCard variant="thin" className="text-center py-12">
                <p className="text-sm text-muted">読み込み中...</p>
              </GlassCard>
            ) : displayItems.length === 0 ? (
              <GlassCard variant="thin" className="text-center py-16">
                <Package size={32} className="text-muted mx-auto mb-3" />
                <p className="text-sm text-secondary">
                  {activeFolderId === 'all'
                    ? 'まだ成果物がありません'
                    : 'このフォルダは空です'}
                </p>
                <p className="text-xs text-muted mt-1">
                  チャットからAIに依頼すると、ここに完了した成果物が集まります
                </p>
              </GlassCard>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                layout
              >
                {displayItems.map((item) => (
                  <DeliverableCard key={item.id} item={item} />
                ))}
              </motion.div>
            )}
          </SortableContext>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-90 rotate-2 scale-105 pointer-events-none">
                <DeliverableCard
                  item={{
                    id: activeTask.id,
                    title: activeTask.title,
                    department: activeTask.department,
                    output: activeTask.output,
                    createdAt: activeTask.createdAt,
                  }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
