import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, ThumbsUp, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Agent } from '../../types/agent';
import { TabSwitch } from '../ui/TabSwitch';
import { StatusDot } from '../ui/StatusDot';
import { api } from '../../services/api';

interface AgentDetailPanelProps {
  agent: Agent | null;
}

const AGENT_DEPT_MAP: Record<string, string> = {
  sales: 'SALES',
  marketing: 'MARKETING',
  accounting: 'ACCOUNTING',
  analytics: 'ANALYTICS',
  general: 'GENERAL',
  assistant: 'ASSISTANT',
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-600',
  QUEUED: 'bg-blue-100 text-blue-600',
  RUNNING: 'bg-[#E8863A]/10 text-[#E8863A]',
  DONE: 'bg-green-100 text-green-600',
  FAILED: 'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: '承認待ち',
  QUEUED: '実行待ち',
  RUNNING: '実行中',
  DONE: '完了',
  FAILED: '失敗',
};

const panelVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.3, duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, x: 40, transition: { duration: 0.3 } },
};

export function AgentDetailPanel({ agent }: AgentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('Overview');

  const dept = agent ? AGENT_DEPT_MAP[agent.id] ?? 'GENERAL' : 'GENERAL';

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['agent-tasks', dept],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: { id: string; title: string; status: string; createdAt: string }[] }>(`/tasks?department=${dept}`);
      return res.data.data
        .filter((t) => t.status !== undefined)
        .slice(0, 5);
    },
    enabled: !!agent && activeTab === 'Tasks',
  });

  return (
    <AnimatePresence mode="wait">
      {agent && (
        <motion.div
          key={agent.id}
          className="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-4 h-full"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <TabSwitch
            tabs={['Overview', 'Tasks']}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === 'Overview' ? (
            <div className="flex flex-col gap-4 flex-1">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold text-[#2D2D2D]">{agent.rating}</span>
                <span className="text-sm text-[#8A8A8A]">評価</span>
              </div>

              {/* Agent info */}
              <div>
                <h3 className="text-xl font-bold text-[#2D2D2D]">{agent.name}</h3>
                <p className="text-sm text-[#8A8A8A] mt-0.5">{agent.description}</p>
              </div>

              {/* Latest report */}
              <div className="bg-[#f5f5f0] rounded-2xl p-4 flex-1">
                <p className="text-xs font-medium text-[#BCBCBC] mb-2">最新レポート</p>
                <p className="text-[15px] text-[#2D2D2D] leading-relaxed">
                  「{agent.latestReport}」
                </p>
              </div>

              {/* Status bar */}
              <div className="flex items-center gap-4 pt-2 border-t border-[#eae8e3]">
                <div className="flex items-center gap-1.5">
                  <StatusDot status={agent.status} size="md" />
                  <ThumbsUp className="w-4 h-4 text-[#8A8A8A]" />
                  <span className="text-sm text-[#8A8A8A]">
                    {agent.status === 'active' ? '稼働中' : agent.status === 'processing' ? '処理中' : '待機中'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#8A8A8A]" />
                  <span className="text-sm text-[#8A8A8A]">{agent.taskCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              <p className="text-xs font-medium text-[#BCBCBC]">直近のタスク</p>
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader className="w-5 h-5 text-[#BCBCBC] animate-spin" />
                </div>
              ) : !tasks || tasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-[#BCBCBC]">タスクがありません</p>
                </div>
              ) : (
                tasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    className="bg-[#f5f5f0] rounded-xl p-3 flex items-center justify-between"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#2D2D2D] truncate">{task.title}</p>
                      <p className="text-xs text-[#BCBCBC]">
                        {new Date(task.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
                        STATUS_STYLE[task.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {STATUS_LABEL[task.status] ?? task.status}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
