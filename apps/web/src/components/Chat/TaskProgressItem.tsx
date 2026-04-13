import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Check, AlertCircle, Loader2, Clock,
  Mail, Share2, FileText, Calendar, BarChart3,
} from 'lucide-react';
import { DEPT_ACCENT, DEPT_LABEL } from '../../constants/departments';
import { parseOutputJson } from '../../utils/parseTaskOutput';

interface TaskLog {
  message: string;
  level: string;
  createdAt: string;
}

export interface TaskProgressItemData {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'done' | 'failed';
  department: string;
  logs: TaskLog[];
  output?: string;
  createdAt?: string;
}

interface TaskProgressItemProps {
  task: TaskProgressItemData;
}

const STEP_LABELS = [
  'Intent分析中...',
  'エージェント割り当て中...',
  'タスク実行中...',
  'リスク評価中...',
  '結果を整形中...',
];

const TYPE_ICON: Record<string, typeof Mail> = {
  email: Mail,
  sns: Share2,
  proposal: FileText,
  content_calendar: FileText,
  document: FileText,
  meeting_notes: FileText,
  schedule: Calendar,
  receipt_summary: FileText,
  expense_report: FileText,
  invoice_check: FileText,
  market_analysis: BarChart3,
  data_visualization: BarChart3,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MiniResultPreview({ data }: { data: any }) {
  const taskType = data?.taskType;
  const Icon = TYPE_ICON[taskType] ?? FileText;

  switch (taskType) {
    case 'email':
      return (
        <div className="flex items-center gap-2 text-[11px] text-[#8A8A8A]">
          <Mail size={11} className="text-[#8b85ff] flex-shrink-0" />
          <span className="truncate">{data.subject ?? data.to ?? 'メール'}</span>
        </div>
      );
    case 'sns':
      return (
        <div className="flex items-center gap-2 text-[11px] text-[#8A8A8A]">
          <Share2 size={11} className="text-[#9a95ff] flex-shrink-0" />
          <span className="truncate">{(data.content ?? '').slice(0, 80)}</span>
        </div>
      );
    case 'schedule':
      return (
        <div className="flex items-center gap-2 text-[11px] text-[#8A8A8A]">
          <Calendar size={11} className="text-[#b0acff] flex-shrink-0" />
          <span className="truncate">{data.title ?? data.preferredDates?.[0] ?? 'スケジュール'}</span>
        </div>
      );
    case 'market_analysis':
    case 'data_visualization':
      return (
        <div className="flex items-center gap-2 text-[11px] text-[#8A8A8A]">
          <BarChart3 size={11} className="text-[#8d9dff] flex-shrink-0" />
          <span className="truncate">{data.title ?? data.summary ?? '分析結果'}</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 text-[11px] text-[#8A8A8A]">
          <Icon size={11} className="flex-shrink-0" />
          <span className="truncate">{data.title ?? data.summary ?? '成果物'}</span>
        </div>
      );
  }
}

export function TaskProgressItem({ task }: TaskProgressItemProps) {
  const [expanded, setExpanded] = useState(false);
  const accent = DEPT_ACCENT[task.department] ?? '#8A8A8A';
  const currentStep = Math.min(task.logs.length, STEP_LABELS.length - 1);
  const parsedOutput = useMemo(() => parseOutputJson(task.output), [task.output]);

  return (
    <div className="bg-white border border-[#eae8e3] rounded-2xl overflow-hidden shadow-sm">
      {/* Collapsed header */}
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#faf9f7] transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Department color dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accent }}
        />

        {/* Title */}
        <span className="flex-1 text-xs font-medium text-[#2D2D2D] truncate">
          {task.title}
        </span>

        {/* Status icon */}
        {task.status === 'executing' && <Loader2 size={12} className="text-[#8b85ff] animate-spin flex-shrink-0" />}
        {task.status === 'done' && <Check size={12} className="text-green-500 flex-shrink-0" />}
        {task.status === 'failed' && <AlertCircle size={12} className="text-red-400 flex-shrink-0" />}
        {task.status === 'rejected' && <AlertCircle size={12} className="text-red-400 flex-shrink-0" />}
        {task.status === 'pending' && <Clock size={12} className="text-[#BCBCBC] flex-shrink-0" />}
        {task.status === 'approved' && <Clock size={12} className="text-[#8b85ff] flex-shrink-0" />}

        {/* Timestamp */}
        {task.createdAt && (
          <span className="text-[10px] text-[#BCBCBC] flex-shrink-0">
            {new Date(task.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {expanded ? <ChevronUp size={12} className="text-[#BCBCBC] flex-shrink-0" /> : <ChevronDown size={12} className="text-[#BCBCBC] flex-shrink-0" />}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Department badge */}
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${accent}15`, color: accent }}
              >
                {DEPT_LABEL[task.department] ?? task.department}
              </span>

              {/* Progress bar for executing */}
              {task.status === 'executing' && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8b85ff] font-medium">
                    <Loader2 size={10} className="animate-spin" />
                    {STEP_LABELS[currentStep]}
                  </div>
                  <div className="w-full h-1 bg-[#f5f5f0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: accent }}
                      initial={{ width: '5%' }}
                      animate={{ width: `${Math.max(10, Math.min(90, (task.logs.length / 5) * 100))}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}

              {/* Logs (last 5) */}
              {task.logs.length > 0 && (
                <div className="max-h-24 overflow-y-auto space-y-0.5">
                  {task.logs.slice(-5).map((log, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px]">
                      <span className={`w-1 h-1 rounded-full mt-1 flex-shrink-0 ${
                        log.level === 'ERROR' ? 'bg-red-400' : log.level === 'WARN' ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                      <span className="text-[#8A8A8A]">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Done: mini result preview */}
              {task.status === 'done' && parsedOutput && (
                <div className="pt-1 border-t border-[#f5f5f0]">
                  <MiniResultPreview data={parsedOutput} />
                </div>
              )}

              {/* Done: raw output fallback */}
              {task.status === 'done' && !parsedOutput && task.output && (
                <div className="p-2 bg-[#f5f5f0] rounded-xl text-[10px] text-[#8A8A8A] whitespace-pre-wrap max-h-20 overflow-y-auto">
                  {task.output.slice(0, 200)}{task.output.length > 200 ? '...' : ''}
                </div>
              )}

              {/* Failed */}
              {task.status === 'failed' && (
                <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-medium">
                  <AlertCircle size={10} /> タスク失敗
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
