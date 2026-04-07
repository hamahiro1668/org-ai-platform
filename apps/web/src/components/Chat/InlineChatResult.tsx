import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, Check, X, Loader2, AlertCircle, Zap,
  Mail, Send, Copy, FileText, Calendar, BarChart3, Share2,
  Twitter, Instagram, Linkedin,
} from 'lucide-react';

const DEPT_ACCENT: Record<string, string> = {
  SALES: '#E8863A', MARKETING: '#8B5CF6', ACCOUNTING: '#D97706', GENERAL: '#0EA5E9', ANALYTICS: '#7B61FF',
};
const DEPT_LABEL: Record<string, string> = {
  SALES: '営業部', MARKETING: 'マーケ部', ACCOUNTING: '経理部', GENERAL: '総合', ANALYTICS: 'データ分析',
};

interface TaskLog {
  message: string;
  level: string;
  createdAt: string;
}

interface InlineChatResultProps {
  taskId: string;
  taskTitle: string;
  department: string;
  logs: TaskLog[];
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'done' | 'failed';
  output?: string;
  onApprove: () => void;
  onReject: () => void;
  onAction?: (action: string) => void;
}

const STEP_LABELS = [
  'Intent分析中...',
  'エージェント割り当て中...',
  'タスク実行中...',
  'リスク評価中...',
  '結果を整形中...',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOutputJson(output?: string): any | null {
  if (!output) return null;
  try {
    return JSON.parse(output);
  } catch {
    // Try to extract JSON from markdown code block
    const match = output.match(/```json\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1]); } catch { /* skip */ }
    }
    return null;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 text-[10px] text-[#8A8A8A] hover:text-[#E8863A] transition-colors px-1.5 py-0.5 rounded-lg"
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'コピー済' : 'コピー'}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EmailPreview({ data, onAction }: { data: any; onAction?: (action: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Mail size={14} className="text-[#E8863A]" />
        <span className="text-xs font-semibold text-[#2D2D2D]">メール</span>
        <CopyButton text={`To: ${data.to}\n件名: ${data.subject}\n\n${data.body}`} />
      </div>
      <div className="text-[11px] space-y-1">
        <p><span className="text-[#8A8A8A]">To:</span> {data.to}</p>
        {data.cc && <p><span className="text-[#8A8A8A]">CC:</span> {data.cc}</p>}
        <p><span className="text-[#8A8A8A]">件名:</span> {data.subject}</p>
      </div>
      <div className="p-2.5 bg-[#f5f5f0] rounded-xl text-[11px] whitespace-pre-wrap max-h-36 overflow-y-auto text-[#2D2D2D] leading-relaxed">
        {data.body}
      </div>
      {onAction && (
        <motion.button
          onClick={() => onAction('send_email')}
          className="w-full bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5"
          whileTap={{ scale: 0.98 }}
        >
          <Send size={12} /> Gmail で送信
        </motion.button>
      )}
    </div>
  );
}

const PLATFORM_ICON: Record<string, typeof Twitter> = { twitter: Twitter, instagram: Instagram, linkedin: Linkedin };
const PLATFORM_COLOR: Record<string, string> = { twitter: '#1DA1F2', instagram: '#E4405F', linkedin: '#0A66C2' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SNSPreview({ data, onAction }: { data: any; onAction?: (action: string) => void }) {
  const Icon = PLATFORM_ICON[data.platform] ?? Share2;
  const color = PLATFORM_COLOR[data.platform] ?? '#8A8A8A';
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-xs font-semibold text-[#2D2D2D]">{data.platform?.toUpperCase()}</span>
        <CopyButton text={data.content + '\n' + (data.hashtags ?? []).map((t: string) => `#${t}`).join(' ')} />
      </div>
      <div className="p-2.5 bg-[#f5f5f0] rounded-xl text-[11px] whitespace-pre-wrap text-[#2D2D2D]">
        {data.content}
      </div>
      {data.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.hashtags.map((tag: string) => (
            <span key={tag} className="text-[10px] text-[#E8863A] font-medium">#{tag}</span>
          ))}
        </div>
      )}
      {onAction && (
        <motion.button
          onClick={() => onAction('post_sns')}
          className="w-full text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5"
          style={{ backgroundColor: color }}
          whileTap={{ scale: 0.98 }}
        >
          <Send size={12} /> 投稿する
        </motion.button>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DocumentPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-[#8B5CF6]" />
        <span className="text-xs font-semibold text-[#2D2D2D]">{data.title}</span>
        <CopyButton text={data.content ?? data.summary ?? ''} />
      </div>
      {data.summary && <p className="text-[11px] text-[#8A8A8A]">{data.summary}</p>}
      {data.content && (
        <div className="p-2.5 bg-[#f5f5f0] rounded-xl text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto text-[#2D2D2D] leading-relaxed">
          {typeof data.content === 'string' ? data.content.slice(0, 800) : JSON.stringify(data.content, null, 2).slice(0, 800)}
          {(data.content?.length ?? 0) > 800 ? '...' : ''}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SchedulePreview({ data, onAction }: { data: any; onAction?: (action: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-[#D97706]" />
        <span className="text-xs font-semibold text-[#2D2D2D]">{data.title}</span>
      </div>
      {data.preferredDates && (
        <div className="space-y-1">
          {data.preferredDates.map((d: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-[#2D2D2D] bg-[#f5f5f0] rounded-lg px-3 py-1.5">
              <Calendar size={10} className="text-[#D97706]" /> {d}
              {data.duration && <span className="text-[#8A8A8A]">({data.duration}分)</span>}
            </div>
          ))}
        </div>
      )}
      {data.participants?.length > 0 && (
        <p className="text-[11px] text-[#8A8A8A]">参加者: {data.participants.join(', ')}</p>
      )}
      {onAction && (
        <motion.button
          onClick={() => onAction('create_event')}
          className="w-full bg-[#D97706] hover:bg-[#c06806] text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5"
          whileTap={{ scale: 0.98 }}
        >
          <Calendar size={12} /> カレンダーに登録
        </motion.button>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MeetingNotesPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-[#E8863A]" />
        <span className="text-xs font-semibold text-[#2D2D2D]">{data.title}</span>
        {data.date && <span className="text-[10px] text-[#8A8A8A]">{data.date}</span>}
      </div>
      {data.attendees?.length > 0 && (
        <p className="text-[11px] text-[#8A8A8A]">参加者: {data.attendees.join(', ')}</p>
      )}
      {data.decisions?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-[#8A8A8A]">決定事項</p>
          {data.decisions.map((d: string, i: number) => (
            <div key={i} className="flex gap-1.5 text-[11px] text-[#2D2D2D]">
              <Check size={10} className="text-green-500 mt-0.5 flex-shrink-0" /> {d}
            </div>
          ))}
        </div>
      )}
      {data.actionItems?.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-[#8A8A8A]">アクションアイテム</p>
          {data.actionItems.map((a: { assignee: string; task: string; deadline?: string }, i: number) => (
            <div key={i} className="text-[11px] text-[#2D2D2D] bg-[#f5f5f0] rounded-lg px-2.5 py-1.5">
              <span className="font-medium">{a.assignee}</span>: {a.task}
              {a.deadline && <span className="text-[#8A8A8A] ml-1">({a.deadline})</span>}
            </div>
          ))}
        </div>
      )}
      {data.summary && <p className="text-[11px] text-[#8A8A8A] italic">{data.summary}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReceiptSummaryPreview({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText size={14} className="text-[#D97706]" />
        <span className="text-xs font-semibold text-[#2D2D2D]">経費まとめ</span>
      </div>
      {data.receipts?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[#8A8A8A] border-b border-[#eae8e3]">
                <th className="text-left py-1 pr-2">日付</th>
                <th className="text-left py-1 pr-2">取引先</th>
                <th className="text-left py-1 pr-2">分類</th>
                <th className="text-right py-1">金額</th>
              </tr>
            </thead>
            <tbody>
              {data.receipts.map((r: { date: string; vendor: string; category: string; amount: number }, i: number) => (
                <tr key={i} className="border-b border-[#f5f5f0]">
                  <td className="py-1 pr-2 text-[#8A8A8A]">{r.date}</td>
                  <td className="py-1 pr-2 text-[#2D2D2D]">{r.vendor}</td>
                  <td className="py-1 pr-2 text-[#8A8A8A]">{r.category}</td>
                  <td className="py-1 text-right text-[#2D2D2D] font-medium">¥{r.amount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={3} className="py-1.5 text-[#8A8A8A]">合計</td>
                <td className="py-1.5 text-right text-[#2D2D2D]">¥{data.totalAmount?.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {data.summary && <p className="text-[11px] text-[#8A8A8A]">{data.summary}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnalyticsPreview({ data }: { data: any }) {
  const maxVal = Math.max(...(data.data ?? []).map((d: { value: number }) => d.value || 0), 1);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <BarChart3 size={14} className="text-[#7B61FF]" />
        <span className="text-xs font-semibold text-[#2D2D2D]">{data.title}</span>
      </div>
      {data.summary && <p className="text-[11px] text-[#8A8A8A]">{data.summary}</p>}
      {/* Simple bar chart */}
      {data.chartType === 'bar' && data.data?.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {data.data.slice(0, 8).map((d: { label: string; value: number }, i: number) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              <span className="w-16 text-[#8A8A8A] truncate flex-shrink-0">{d.label}</span>
              <div className="flex-1 h-4 bg-[#f5f5f0] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#7B61FF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.value / maxVal) * 100}%` }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                />
              </div>
              <span className="text-[#2D2D2D] font-medium w-12 text-right">{d.value}</span>
            </div>
          ))}
        </div>
      )}
      {/* Sections for market analysis */}
      {data.sections?.length > 0 && (
        <div className="space-y-2 pt-1">
          {data.sections.slice(0, 4).map((s: { heading: string; content: string }, i: number) => (
            <div key={i}>
              <p className="text-[11px] font-semibold text-[#2D2D2D]">{s.heading}</p>
              <p className="text-[11px] text-[#8A8A8A] line-clamp-3">{s.content}</p>
            </div>
          ))}
        </div>
      )}
      {data.conclusion && (
        <div className="p-2 bg-[#7B61FF]/5 rounded-lg">
          <p className="text-[11px] text-[#7B61FF] font-medium">{data.conclusion}</p>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TaskResultPanel({ data, onAction }: { data: any; onAction?: (action: string) => void }) {
  const taskType = data?.taskType;
  if (!taskType) return <pre className="text-[11px] text-[#8A8A8A] whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;

  switch (taskType) {
    case 'email': return <EmailPreview data={data} onAction={onAction} />;
    case 'sns': return <SNSPreview data={data} onAction={onAction} />;
    case 'proposal':
    case 'content_calendar': return <DocumentPreview data={data} />;
    case 'meeting_notes': return <MeetingNotesPreview data={data} />;
    case 'schedule': return <SchedulePreview data={data} onAction={onAction} />;
    case 'receipt_summary':
    case 'expense_report':
    case 'invoice_check': return <ReceiptSummaryPreview data={data} />;
    case 'market_analysis':
    case 'data_visualization': return <AnalyticsPreview data={data} />;
    default: return <DocumentPreview data={data} />;
  }
}

export function InlineChatResult({ taskTitle, department, logs, status, output, onApprove, onReject, onAction }: InlineChatResultProps) {
  const [expanded, setExpanded] = useState(true);
  const accent = DEPT_ACCENT[department] ?? '#8A8A8A';
  const currentStep = Math.min(logs.length, STEP_LABELS.length - 1);

  const parsedOutput = useMemo(() => parseOutputJson(output), [output]);

  return (
    <motion.div
      className="bg-white border border-[#eae8e3] rounded-2xl overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#faf9f7] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Zap size={15} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#2D2D2D] truncate">{taskTitle}</p>
          <p className="text-[10px] text-[#8A8A8A]">
            {DEPT_LABEL[department] ?? department} タスク
          </p>
        </div>
        {status === 'executing' && <Loader2 size={14} className="text-[#E8863A] animate-spin" />}
        {status === 'done' && <Check size={14} className="text-green-500" />}
        {status === 'failed' && <AlertCircle size={14} className="text-red-400" />}
        {status === 'rejected' && <X size={14} className="text-red-400" />}
        {expanded ? <ChevronUp size={14} className="text-[#BCBCBC]" /> : <ChevronDown size={14} className="text-[#BCBCBC]" />}
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Executing */}
              {status === 'executing' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#E8863A] font-medium">
                    <Loader2 size={12} className="animate-spin" />
                    {STEP_LABELS[currentStep]}
                  </div>
                  <div className="w-full h-1.5 bg-[#f5f5f0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: accent }}
                      initial={{ width: '5%' }}
                      animate={{ width: `${Math.max(10, Math.min(90, (logs.length / 5) * 100))}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  {logs.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                      {logs.map((log, i) => (
                        <motion.div key={i} className="flex items-start gap-2 text-[11px]" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                          <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${log.level === 'ERROR' ? 'bg-red-400' : log.level === 'WARN' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                          <span className="text-[#8A8A8A]">{log.message}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Done: タスクタイプ別リッチ表示 */}
              {status === 'done' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <Check size={12} />
                    タスク完了
                  </div>
                  {parsedOutput ? (
                    <TaskResultPanel data={parsedOutput} onAction={onAction} />
                  ) : output ? (
                    <div className="p-2.5 bg-[#f5f5f0] rounded-xl text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto text-[#2D2D2D]">
                      {output}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Failed */}
              {status === 'failed' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                    <AlertCircle size={12} /> タスク失敗
                  </div>
                  {logs.length > 0 && (
                    <div className="max-h-24 overflow-y-auto space-y-1 pt-1">
                      {logs.slice(-3).map((log, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px]">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${log.level === 'ERROR' ? 'bg-red-400' : 'bg-gray-400'}`} />
                          <span className="text-[#8A8A8A]">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rejected */}
              {status === 'rejected' && (
                <div className="flex items-center gap-2 text-xs text-[#8A8A8A] py-1">
                  <X size={12} /> タスクをキャンセルしました
                </div>
              )}

              {/* Pending */}
              {status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <motion.button onClick={onApprove} className="flex-1 bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5" whileTap={{ scale: 0.98 }}>
                    <Check size={13} /> 承認・実行
                  </motion.button>
                  <motion.button onClick={onReject} className="flex-1 bg-[#f5f5f0] hover:bg-gray-200 text-[#8A8A8A] text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5" whileTap={{ scale: 0.98 }}>
                    <X size={13} /> 却下
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
