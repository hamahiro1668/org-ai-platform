import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Zap, Clock, AlertTriangle, ClipboardList, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

interface Stats {
  totalRequests: number;
  totalTokens: number;
  riskEvents: Record<string, number>;
  topDepartments: { department: string; count: number }[];
  avgLatencyMs: number;
}

const DEPARTMENTS = [
  { key: 'SALES', label: '営業部', desc: '提案書・メール・見積もり作成', icon: '🤝', color: '#E8863A' },
  { key: 'MARKETING', label: 'マーケ部', desc: 'SNS投稿・広告・コピーライティング', icon: '📣', color: '#8B5CF6' },
  { key: 'ACCOUNTING', label: '経理部', desc: '請求書・経費・予算・税務', icon: '📊', color: '#D97706' },
  { key: 'GENERAL', label: '総合AI', desc: '何でも聞ける汎用アシスタント', icon: '✨', color: '#0EA5E9' },
];

const DEPT_LABEL: Record<string, string> = {
  SALES: '営業部', MARKETING: 'マーケ部', ACCOUNTING: '経理部', GENERAL: '総合',
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { setPendingDepartment } = useChatStore();

  const { data, isLoading } = useQuery({
    queryKey: ['governance-stats'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Stats }>('/governance/stats');
      return res.data.data;
    },
    enabled: user?.role === 'OWNER',
  });

  const totalRisks = data ? Object.values(data.riskEvents).reduce((a, b) => a + b, 0) : 0;

  const handleDeptClick = async (deptKey: string) => {
    setPendingDepartment(deptKey);
    try {
      const res = await api.post<{ success: boolean; data: { id: string } }>('/chat/sessions', {});
      navigate(`/chat/${res.data.data.id}`);
    } catch {
      navigate('/chat');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[#2D2D2D]">ダッシュボード</h2>
        <p className="text-sm text-[#8A8A8A] mt-1">おはようございます、{user?.name} さん</p>
      </motion.div>

      {/* Department selector */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold text-[#8A8A8A] mb-3 uppercase tracking-wider">部署を選んでAIチャットを開始</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DEPARTMENTS.map((dept, i) => (
            <motion.button
              key={dept.key}
              onClick={() => handleDeptClick(dept.key)}
              className="text-left p-5 rounded-3xl bg-white border border-[#eae8e3] hover:border-[#E8863A]/30 transition-all group shadow-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-2xl mb-3">{dept.icon}</div>
              <div
                className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2"
                style={{ backgroundColor: `${dept.color}15`, color: dept.color }}
              >
                {dept.label}
              </div>
              <p className="text-xs text-[#8A8A8A] leading-relaxed">{dept.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-[#BCBCBC] group-hover:text-[#E8863A] transition-colors">
                チャット開始 <ArrowRight size={11} />
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {[
          { label: 'AIチャット', desc: 'チャット履歴・新規会話', icon: MessageSquare, path: '/chat' },
          { label: 'タスク管理', desc: 'AIエージェントが自動実行', icon: ClipboardList, path: '/tasks' },
        ].map(({ label, desc, icon: Icon, path }) => (
          <motion.button
            key={path}
            onClick={() => navigate(path)}
            className="flex items-center gap-3 bg-white border border-[#eae8e3] hover:border-[#E8863A]/30 rounded-3xl p-4 transition-all group shadow-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="w-10 h-10 bg-[#E8863A]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-[#E8863A]" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-bold text-[#2D2D2D]">{label}</p>
              <p className="text-xs text-[#8A8A8A] truncate">{desc}</p>
            </div>
            <ArrowRight size={14} className="text-[#BCBCBC] group-hover:text-[#E8863A] ml-auto flex-shrink-0 transition-colors" />
          </motion.button>
        ))}
      </motion.div>

      {/* Stats (OWNER only) */}
      {user?.role === 'OWNER' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-[#eae8e3] animate-pulse h-24" />
              ))}
            </div>
          ) : data ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'AIリクエスト', value: data.totalRequests.toLocaleString(), icon: MessageSquare, color: '#E8863A' },
                  { label: 'トークン消費', value: data.totalTokens.toLocaleString(), icon: Zap, color: '#8B5CF6' },
                  { label: '平均応答', value: `${data.avgLatencyMs}ms`, icon: Clock, color: '#0EA5E9' },
                  { label: 'リスクイベント', value: totalRisks, icon: AlertTriangle, color: '#D97706' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-3xl p-5 border border-[#eae8e3] shadow-sm">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <p className="text-2xl font-bold text-[#2D2D2D]">{value}</p>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {data.topDepartments.length > 0 && (
                  <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-sm">
                    <h3 className="text-sm font-bold text-[#2D2D2D] mb-4">部署別AIリクエスト数</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={data.topDepartments.map((d) => ({ ...d, name: DEPT_LABEL[d.department] ?? d.department }))}>
                        <XAxis dataKey="name" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#fff', border: '1px solid #eae8e3', borderRadius: 16, fontSize: 12, color: '#2D2D2D' }}
                          cursor={{ fill: '#faf9f7' }}
                        />
                        <Bar dataKey="count" fill="#E8863A" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="bg-white rounded-3xl p-6 border border-[#eae8e3] shadow-sm">
                  <h3 className="text-sm font-bold text-[#2D2D2D] mb-4">部署一覧</h3>
                  <div className="space-y-3">
                    {data.topDepartments.map((d) => (
                      <div key={d.department} className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f5f5f0] text-[#2D2D2D]">
                          {DEPT_LABEL[d.department] ?? d.department}
                        </span>
                        <span className="text-sm font-bold text-[#2D2D2D]">{d.count}</span>
                      </div>
                    ))}
                    {data.topDepartments.length === 0 && (
                      <p className="text-xs text-[#BCBCBC]">まだリクエストがありません</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </>
      )}
    </div>
  );
}
