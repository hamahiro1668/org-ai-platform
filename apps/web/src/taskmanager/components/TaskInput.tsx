import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader, ChevronLeft, Zap } from 'lucide-react';
import type { Task, SubTask } from '../types/index';
import { analyzeTask, isComplexResult } from '../ai/executor';
import type { DecomposedTaskSpec } from '../ai/executor';
import { useStore } from '../store/index';
import { humanizeTaskManagerError } from '../../utils/humanizeLlmError';

const EXAMPLE_PROMPTS = [
  '来週の顧客打ち合わせ用に提案書の骨子とメール案を作りたい',
  'Instagram用に新商品の短い投稿文案を3パターン',
  '今月の経費をカテゴリ別に整理した表形式のメモが欲しい',
];

interface TaskInputProps {
  onAdd: (task: Task) => void;
  onClose: () => void;
}

type Phase = 'input' | 'preview';

function genId() {
  return crypto.randomUUID();
}

const TYPE_LABELS: Record<string, string> = {
  email: 'メール', coding: 'コーディング', research: 'リサーチ',
  document: '文書', schedule: 'スケジュール', analytics: '分析', sns: 'SNS投稿',
};

const TYPE_ACCENT: Record<string, string> = {
  email: '#0EA5E9', coding: '#10B981', research: '#9a95ff',
  document: '#8b85ff', schedule: '#b0acff', analytics: '#6366F1', sns: '#EC4899',
};

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-red-50', text: 'text-red-600' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600' },
  low: { bg: 'bg-[#f5f5f0]', text: 'text-[#8A8A8A]' },
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高優先', medium: '中優先', low: '低優先',
};

export default function TaskInput({ onAdd, onClose }: TaskInputProps) {
  const { addTask, startQueue } = useStore();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('input');
  const [decomposedTasks, setDecomposedTasks] = useState<DecomposedTaskSpec[]>([]);
  const [projectName, setProjectName] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeTask(text.trim());
      if (isComplexResult(result)) {
        const sorted = [...result.decomposedTasks].sort((a, b) => a.order - b.order);
        setDecomposedTasks(sorted);
        setProjectName(result.projectName);
        setPhase('preview');
      } else {
        const subTasks: SubTask[] = (result.subTasks ?? []).map((t) => ({
          id: genId(), title: t, done: false,
        }));
        const task: Task = {
          id: genId(), title: text.trim().slice(0, 60), rawInput: text.trim(),
          type: result.taskType, status: 'ready', priority: result.priority,
          deadline: result.deadline ?? undefined, projectId: result.projectName || undefined,
          subTasks, createdAt: new Date().toISOString(),
        };
        onAdd(task);
        onClose();
      }
    } catch (e) {
      setError(humanizeTaskManagerError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const taskIds: string[] = [];
      for (const spec of decomposedTasks) {
        const task: Task = {
          id: genId(), title: spec.title, rawInput: spec.rawInput,
          type: spec.type, status: 'ready', priority: spec.priority,
          deadline: spec.deadline, projectId: projectName || undefined,
          subTasks: [], createdAt: new Date().toISOString(),
        };
        await addTask(task);
        taskIds.push(task.id);
      }
      startQueue(taskIds);
      onClose();
    } catch (e) {
      setError(humanizeTaskManagerError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAnalyze();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg z-10"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <div className="bg-white border border-[#eae8e3] rounded-3xl shadow-xl p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {phase === 'preview' && (
                  <button
                    onClick={() => setPhase('input')}
                    className="text-[#BCBCBC] hover:text-[#8A8A8A] transition-colors mr-1"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div className="w-8 h-8 bg-[#8b85ff]/10 rounded-xl flex items-center justify-center">
                  <Sparkles size={14} className="text-[#8b85ff]" />
                </div>
                <h2 className="font-bold text-[#2D2D2D]">
                  {phase === 'input' ? '新規タスク' : 'タスク分解プレビュー'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-[#BCBCBC] hover:text-[#8A8A8A] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Phase: input */}
            {phase === 'input' && (
              <>
                <div>
                  <p className="text-xs text-[#8A8A8A] mb-2">
                    自然言語で入力してください。AIが種別・優先度・期限を解析し、複合タスクは自動分解します。
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {EXAMPLE_PROMPTS.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        disabled={loading}
                        onClick={() => { setText(ex); setError(null); }}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-white border border-[#eae8e3] text-[#8A8A8A] hover:border-[#8b85ff]/40 hover:text-[#2D2D2D] transition-colors text-left max-w-full line-clamp-2"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                  <textarea
                    autoFocus
                    className="w-full text-sm bg-[#f5f5f0] border border-[#eae8e3] rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8b85ff]/30 text-[#2D2D2D] resize-none min-h-[120px] placeholder-[#BCBCBC]"
                    placeholder={'例：来月ウェビナーを開催したい。告知メール・スケジュール・資料の3点を準備して\n例：Aさんに提案書を来週月曜までに送る'}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  <p className="text-[10px] text-[#BCBCBC] mt-1 text-right">Cmd+Enter で送信</p>
                </div>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-[#8b85ff]"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader size={14} />
                    </motion.div>
                    部長AIがタスクを解析しています...
                  </motion.div>
                )}

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    className="text-sm text-[#8A8A8A] hover:text-[#2D2D2D] px-4 py-2 rounded-full transition-colors"
                    onClick={onClose}
                    disabled={loading}
                  >
                    キャンセル
                  </button>
                  <motion.button
                    className="bg-[#8b85ff] hover:bg-[#7c76f2] text-white rounded-2xl px-5 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-glow-primary transition-all"
                    onClick={handleAnalyze}
                    disabled={loading || !text.trim()}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Sparkles size={13} />
                    {loading ? '解析中...' : 'AIで解析・登録'}
                  </motion.button>
                </div>
              </>
            )}

            {/* Phase: preview */}
            {phase === 'preview' && (
              <>
                {projectName && (
                  <div className="bg-[#8b85ff]/5 border border-[#8b85ff]/20 rounded-2xl px-4 py-2.5">
                    <p className="text-[10px] text-[#8A8A8A]">プロジェクト</p>
                    <p className="text-sm font-bold text-[#8b85ff]">{projectName}</p>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                  {decomposedTasks.map((spec, i) => {
                    const accent = TYPE_ACCENT[spec.type] ?? '#8A8A8A';
                    const pStyle = PRIORITY_STYLE[spec.priority] ?? PRIORITY_STYLE.low;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 bg-[#f5f5f0] border border-[#eae8e3] rounded-2xl p-3"
                      >
                        <div
                          className="flex-shrink-0 w-6 h-6 rounded-lg text-white text-xs font-bold flex items-center justify-center mt-0.5"
                          style={{ backgroundColor: accent }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-sm font-semibold text-[#2D2D2D] leading-snug">{spec.title}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: `${accent}15`, color: accent }}
                            >
                              {TYPE_LABELS[spec.type] ?? spec.type}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pStyle.bg} ${pStyle.text}`}>
                              {PRIORITY_LABELS[spec.priority] ?? spec.priority}
                            </span>
                            {spec.deadline && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#f5f5f0] text-[#8A8A8A]">
                                {spec.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    className="text-sm text-[#8A8A8A] hover:text-[#2D2D2D] px-4 py-2 rounded-full transition-colors"
                    onClick={() => setPhase('input')}
                    disabled={loading}
                  >
                    戻る
                  </button>
                  <motion.button
                    className="bg-[#8b85ff] hover:bg-[#7c76f2] text-white rounded-2xl px-5 py-2 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-glow-primary transition-all"
                    onClick={handleAutoRun}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader size={13} />
                        </motion.div>
                        登録中...
                      </>
                    ) : (
                      <>
                        <Zap size={13} />
                        全自動実行 ({decomposedTasks.length}件)
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
