import { AnimatePresence } from 'framer-motion';
import TaskCard from './TaskCard';
import type { Task } from '../types/index';

const COLUMNS: { key: Task['status'][]; label: string; accent: string }[] = [
  { key: ['pending'], label: '承認待ち', accent: '#E8863A' },
  { key: ['ready', 'in_progress'], label: '実行可能', accent: '#0EA5E9' },
  { key: ['blocked'], label: 'ブロック中', accent: '#D97706' },
];

interface ExecutiveDashboardProps {
  tasks: Task[];
  onExecute: (task: Task) => void;
  executingTaskId: string | null;
  onViewResult: (task: Task) => void;
  onApprove: (task: Task) => void;
  onReject: (task: Task) => void;
  onEdit: (task: Task, newTitle: string) => void;
}

export default function ExecutiveDashboard({
  tasks, onExecute, executingTaskId, onViewResult, onApprove, onReject, onEdit,
}: ExecutiveDashboardProps) {
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="space-y-6">
      {/* Status summary */}
      <div className="flex gap-2 text-xs font-medium flex-wrap">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => col.key.includes(t.status)).length;
          return (
            <span
              key={col.label}
              className="bg-white px-3 py-1.5 rounded-full border border-[#eae8e3]"
              style={{ color: col.accent }}
            >
              {col.label}
              <span className="ml-1.5 font-bold">{count}</span>
            </span>
          );
        })}
        {doneTasks.length > 0 && (
          <span className="bg-white px-3 py-1.5 rounded-full border border-[#eae8e3] text-emerald-600">
            完了
            <span className="ml-1.5 font-bold">{doneTasks.length}</span>
          </span>
        )}
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => col.key.includes(t.status));
          return (
            <div key={col.label} className="space-y-3">
              <h2 className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider px-1">
                {col.label}
                <span className="ml-2 font-normal normal-case">({colTasks.length})</span>
              </h2>
              <div className="space-y-3 min-h-[80px]">
                <AnimatePresence>
                  {colTasks.length === 0 ? (
                    <div className="text-xs text-[#BCBCBC] text-center py-8 border border-dashed border-[#eae8e3] rounded-2xl">
                      なし
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onExecute={onExecute}
                        isExecuting={executingTaskId === task.id}
                        onApprove={onApprove}
                        onReject={onReject}
                        onEdit={onEdit}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#8A8A8A] uppercase tracking-wider px-1">
            完了済み ({doneTasks.length})
          </h2>
          <div className="space-y-1.5">
            {doneTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                className={`w-full flex items-center gap-2 text-sm text-[#8A8A8A] px-3 py-2 rounded-xl text-left transition-all ${
                  task.executionResult
                    ? 'hover:bg-white hover:text-[#2D2D2D] cursor-pointer'
                    : 'cursor-default'
                }`}
                onClick={() => task.executionResult && onViewResult(task)}
                disabled={!task.executionResult}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="line-through flex-1 min-w-0 truncate">{task.title}</span>
                {task.executionResult && (
                  <span className="text-xs text-[#E8863A] flex-shrink-0 font-medium" style={{ textDecoration: 'none' }}>
                    確認
                  </span>
                )}
              </button>
            ))}
            {doneTasks.length > 5 && (
              <p className="text-xs text-[#BCBCBC] px-3">他 {doneTasks.length - 5} 件...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
