import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Share2, FileText, Calendar, BarChart3, ChevronDown, ChevronUp, Package,
} from 'lucide-react';
import { DEPT_ACCENT, DEPT_LABEL } from '../../constants/departments';
import { parseOutputJson } from '../../utils/parseTaskOutput';

interface BackendTask {
  id: string;
  title: string;
  status: string;
  department: string;
  output: string | null;
  createdAt: string;
}

interface PastDeliverablesSectionProps {
  tasks: BackendTask[];
}

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

const TYPE_LABEL: Record<string, string> = {
  email: 'メール',
  sns: 'SNS投稿',
  proposal: '提案書',
  content_calendar: 'コンテンツ',
  document: '資料',
  meeting_notes: '議事録',
  schedule: 'スケジュール',
  receipt_summary: '経費まとめ',
  expense_report: '経費レポート',
  invoice_check: '請求確認',
  market_analysis: '市場分析',
  data_visualization: 'データ可視化',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DeliverablePreview({ data }: { data: any }) {
  const taskType = data?.taskType;
  switch (taskType) {
    case 'email':
      return (
        <div className="text-[11px] text-[#8A8A8A] space-y-0.5">
          <p><span className="text-[#BCBCBC]">To:</span> {data.to}</p>
          <p><span className="text-[#BCBCBC]">件名:</span> {data.subject}</p>
          <p className="line-clamp-2">{data.body?.slice(0, 100)}</p>
        </div>
      );
    case 'sns':
      return (
        <div className="text-[11px] text-[#8A8A8A]">
          <p className="line-clamp-3">{data.content?.slice(0, 150)}</p>
          {data.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.hashtags.slice(0, 5).map((tag: string) => (
                <span key={tag} className="text-[10px] text-[#8b85ff]">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      );
    case 'schedule':
      return (
        <div className="text-[11px] text-[#8A8A8A]">
          <p className="font-medium text-[#2D2D2D]">{data.title}</p>
          {data.preferredDates?.slice(0, 2).map((d: string, i: number) => (
            <p key={i}>{d}</p>
          ))}
        </div>
      );
    case 'market_analysis':
    case 'data_visualization':
      return (
        <div className="text-[11px] text-[#8A8A8A]">
          {data.summary && <p className="line-clamp-2">{data.summary}</p>}
          {data.conclusion && <p className="text-[#8d9dff] line-clamp-1 mt-0.5">{data.conclusion}</p>}
        </div>
      );
    default:
      return (
        <div className="text-[11px] text-[#8A8A8A]">
          {data.title && <p className="font-medium text-[#2D2D2D]">{data.title}</p>}
          {data.summary && <p className="line-clamp-2">{data.summary}</p>}
          {data.content && typeof data.content === 'string' && (
            <p className="line-clamp-2">{data.content.slice(0, 120)}</p>
          )}
        </div>
      );
  }
}

export default function PastDeliverablesSection({ tasks }: PastDeliverablesSectionProps) {
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const deliverables = useMemo(() => {
    return tasks
      .filter((t) => t.output)
      .filter((t) => !deptFilter || t.department === deptFilter)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((t) => ({
        ...t,
        parsed: parseOutputJson(t.output ?? undefined),
      }));
  }, [tasks, deptFilter]);

  if (tasks.filter((t) => t.output).length === 0) return null;

  const departments = [...new Set(tasks.map((t) => t.department))];

  return (
    <div className="px-6 py-3 border-b border-[#eae8e3] bg-white/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2"
        >
          <Package size={14} className="text-[#8b85ff]" />
          <h3 className="text-sm font-bold text-[#2D2D2D]">成果物一覧 ({deliverables.length})</h3>
          {expanded ? <ChevronUp size={12} className="text-[#BCBCBC]" /> : <ChevronDown size={12} className="text-[#BCBCBC]" />}
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => setDeptFilter(null)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
              !deptFilter ? 'bg-[#8b85ff] text-white' : 'bg-white text-[#8A8A8A] hover:bg-gray-100'
            }`}
          >
            全部署
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDeptFilter(dept)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                deptFilter === dept ? 'bg-[#8b85ff] text-white' : 'bg-white text-[#8A8A8A] hover:bg-gray-100'
              }`}
            >
              {DEPT_LABEL[dept] ?? dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pb-1">
              {deliverables.map((item) => {
                const taskType = item.parsed?.taskType;
                const Icon = TYPE_ICON[taskType] ?? FileText;
                const accent = DEPT_ACCENT[item.department] ?? '#8A8A8A';

                return (
                  <motion.div
                    key={item.id}
                    className="bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Card header */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${accent}15` }}
                      >
                        <Icon size={14} style={{ color: accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#2D2D2D] truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${accent}15`, color: accent }}
                          >
                            {DEPT_LABEL[item.department] ?? item.department}
                          </span>
                          {taskType && (
                            <span className="text-[9px] text-[#BCBCBC]">
                              {TYPE_LABEL[taskType] ?? taskType}
                            </span>
                          )}
                          <span className="text-[9px] text-[#BCBCBC]">
                            {new Date(item.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    {item.parsed ? (
                      <DeliverablePreview data={item.parsed} />
                    ) : item.output ? (
                      <p className="text-[11px] text-[#8A8A8A] line-clamp-3">
                        {item.output.slice(0, 150)}
                      </p>
                    ) : null}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
