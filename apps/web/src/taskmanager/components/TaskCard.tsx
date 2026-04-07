import { useState } from 'react';
import { Mail, Code, Search, FileText, Calendar, Zap, CheckCircle, XCircle, Edit3, BarChart3, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '../types/index';

const TYPE_ICON: Record<Task['type'], React.ReactNode> = {
  email: <Mail size={16} />,
  coding: <Code size={16} />,
  research: <Search size={16} />,
  document: <FileText size={16} />,
  schedule: <Calendar size={16} />,
  analytics: <BarChart3 size={16} />,
  sns: <Share2 size={16} />,
};

const TYPE_ACCENT: Record<Task['type'], string> = {
  email: '#0EA5E9',
  coding: '#10B981',
  research: '#8B5CF6',
  document: '#E8863A',
  schedule: '#D97706',
  analytics: '#6366F1',
  sns: '#EC4899',
};

const PRIORITY_BADGE: Record<Task['priority'], { bg: string; text: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-600' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600' },
  low: { bg: 'bg-[#f5f5f0]', text: 'text-[#8A8A8A]' },
};

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  high: '高', medium: '中', low: '低',
};

const DEPT_LABEL: Record<string, string> = {
  SALES: '営業部', MARKETING: 'マーケ部', ACCOUNTING: '経理部', GENERAL: '総合AI',
};

function deadlineLabel(deadline?: string): { text: string; cls: string } | null {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: '期限超過', cls: 'text-red-500 font-semibold' };
  if (diff === 0) return { text: '今日まで', cls: 'text-[#E8863A] font-semibold' };
  return { text: `${diff}日後`, cls: 'text-[#8A8A8A]' };
}

interface TaskCardProps {
  task: Task;
  onExecute: (task: Task) => void;
  isExecuting: boolean;
  onApprove?: (task: Task) => void;
  onReject?: (task: Task) => void;
  onEdit?: (task: Task, newTitle: string) => void;
}

export default function TaskCard({ task, onExecute, isExecuting, onApprove, onReject, onEdit }: TaskCardProps) {
  const dl = deadlineLabel(task.deadline);
  const isPending = task.status === 'pending';
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const typeColor = TYPE_ACCENT[task.type] ?? '#8A8A8A';
  const priorityStyle = PRIORITY_BADGE[task.priority];

  const handleEditSave = () => {
    if (editTitle.trim() && onEdit) onEdit(task, editTitle.trim());
    setEditMode(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`bg-white border border-[#eae8e3] rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:border-[#E8863A]/20 ${isPending ? 'border-l-4 border-l-[#E8863A]' : ''}`}>
        {/* Pending badge */}
        {isPending && task.projectId && DEPT_LABEL[task.projectId] && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#E8863A] font-semibold bg-[#E8863A]/10 px-2 py-0.5 rounded-full">承認待ち</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f0] text-[#8A8A8A] font-medium">
              {DEPT_LABEL[task.projectId]}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
            >
              {TYPE_ICON[task.type]}
            </div>
            {editMode ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                className="text-sm font-semibold text-[#2D2D2D] border-b border-[#E8863A] bg-transparent outline-none w-full"
              />
            ) : (
              <span className="text-sm font-semibold text-[#2D2D2D] leading-tight line-clamp-2">
                {task.title}
              </span>
            )}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${priorityStyle.bg} ${priorityStyle.text}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-[#8A8A8A]">
          {task.projectId && !DEPT_LABEL[task.projectId] && (
            <span className="bg-[#f5f5f0] px-2 py-0.5 rounded-full text-[#8A8A8A] font-medium truncate max-w-[120px]">
              {task.projectId}
            </span>
          )}
          {dl && <span className={`ml-auto ${dl.cls}`}>{dl.text}</span>}
        </div>

        {/* Actions */}
        {isPending ? (
          <div className="flex gap-2">
            <motion.button
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-sm shadow-orange-200/50"
              onClick={() => onApprove?.(task)}
              whileTap={{ scale: 0.97 }}
            >
              <CheckCircle size={13} /> 承認
            </motion.button>
            <motion.button
              className="flex items-center justify-center gap-1 bg-[#f5f5f0] hover:bg-[#eae8e3] text-[#8A8A8A] text-xs font-semibold py-2 px-3 rounded-xl transition-all"
              onClick={() => setEditMode(true)}
              whileTap={{ scale: 0.97 }}
            >
              <Edit3 size={13} />
            </motion.button>
            <motion.button
              className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-400 text-xs font-semibold py-2 px-3 rounded-xl transition-all"
              onClick={() => onReject?.(task)}
              whileTap={{ scale: 0.97 }}
            >
              <XCircle size={13} />
            </motion.button>
          </div>
        ) : (
          <motion.button
            className="bg-[#E8863A] hover:bg-[#d6762f] text-white rounded-xl py-2 px-4 text-xs font-semibold w-full flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-orange-200/50 disabled:opacity-40"
            onClick={() => onExecute(task)}
            disabled={isExecuting}
            whileTap={{ scale: 0.97 }}
          >
            <Zap size={13} />
            {isExecuting ? '実行中...' : '実行'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
