import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Shield, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import type { AILog, RiskEvent } from '@org-ai/shared-types';

const SEVERITY_STYLE: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-[#8b85ff]/10 text-[#8b85ff]',
  CRITICAL: 'bg-red-50 text-red-700',
};

const DEPARTMENTS = ['ALL', 'SALES', 'MARKETING', 'ACCOUNTING', 'ANALYTICS', 'GENERAL'] as const;
type DeptFilter = typeof DEPARTMENTS[number];

interface LogsPayload {
  success: boolean;
  data: AILog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function GovernancePage() {
  const [tab, setTab] = useState<'logs' | 'risks'>('logs');
  const [deptFilter, setDeptFilter] = useState<DeptFilter>('ALL');
  const [page, setPage] = useState(1);
  const [riskFilter, setRiskFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const LIMIT = 20;
  const qc = useQueryClient();

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['ai-logs', page, deptFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (deptFilter !== 'ALL') params.set('department', deptFilter);
      const res = await api.get<LogsPayload>(`/governance/logs?${params.toString()}`);
      return res.data;
    },
    enabled: tab === 'logs',
  });
  const logs = logsData?.data;
  const pagination = logsData?.pagination;

  const { data: risks, isLoading: risksLoading } = useQuery({
    queryKey: ['risks', riskFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (riskFilter === 'unresolved') params.set('resolved', 'false');
      if (riskFilter === 'resolved') params.set('resolved', 'true');
      const qs = params.toString();
      const res = await api.get<{ success: boolean; data: RiskEvent[] }>(
        `/governance/risks${qs ? `?${qs}` : ''}`,
      );
      return res.data.data;
    },
    enabled: tab === 'risks',
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/governance/risks/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['risks'] }),
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#8b85ff]/10 rounded-2xl flex items-center justify-center">
            <Shield size={18} className="text-[#8b85ff]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">AIガバナンス</h2>
            <p className="text-sm text-[#8A8A8A]">AIの使用状況とリスクを監視</p>
          </div>
        </div>
      </div>

      <div className="mb-5 p-4 rounded-2xl bg-[#f5f5f0] border border-[#eae8e3] text-sm text-[#5C5C5C] leading-relaxed">
        <p className="font-medium text-[#2D2D2D] mb-1">この画面について</p>
        <p>
          ここでは「いつ・どの部署の AI が・どれくらいトークンを使ったか」と、個人情報がマスクされたかなどの記録を閲覧できます。監査や社内ルールの確認用で、日々のチャット内容そのものが一覧されるわけではありません（詳細は組織の設定によります）。
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#f5f5f0] p-1 rounded-2xl w-fit">
        {([
          { key: 'logs' as const, label: 'AIログ', icon: Activity },
          { key: 'risks' as const, label: 'リスクイベント', icon: AlertCircle },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              tab === key
                ? 'bg-white text-[#2D2D2D] shadow-sm'
                : 'text-[#8A8A8A] hover:text-[#2D2D2D]'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === 'logs' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8A8A8A]">部署:</span>
          {DEPARTMENTS.map((d) => (
            <button
              key={d}
              onClick={() => { setDeptFilter(d); setPage(1); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                deptFilter === d
                  ? 'bg-[#8b85ff]/10 text-[#8b85ff]'
                  : 'bg-[#f5f5f0] text-[#8A8A8A] hover:text-[#2D2D2D]'
              }`}
            >
              {d === 'ALL' ? 'すべて' : d}
            </button>
          ))}
        </div>
      )}

      {tab === 'risks' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8A8A8A]">状態:</span>
          {([
            { key: 'all' as const, label: 'すべて' },
            { key: 'unresolved' as const, label: '未解決のみ' },
            { key: 'resolved' as const, label: '解決済みのみ' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRiskFilter(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                riskFilter === key
                  ? 'bg-[#8b85ff]/10 text-[#8b85ff]'
                  : 'bg-[#f5f5f0] text-[#8A8A8A] hover:text-[#2D2D2D]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {tab === 'logs' && (
          <motion.div
            key="logs"
            className="bg-white rounded-3xl border border-[#eae8e3] shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#eae8e3] bg-[#faf9f7]">
                  <tr>
                    {['日時', '部署', 'モデル', 'トークン', 'レイテンシ', '入力プレビュー'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f0]">
                  {logsLoading ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#BCBCBC]">読み込み中...</td></tr>
                  ) : (logs ?? []).length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#BCBCBC]">
                      {deptFilter === 'ALL' ? 'ログがありません' : `${deptFilter} のログはありません`}
                    </td></tr>
                  ) : (logs ?? []).map((log) => (
                    <tr key={log.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="px-5 py-3.5 text-xs text-[#8A8A8A]">{new Date(log.createdAt).toLocaleString('ja-JP')}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-[#2D2D2D] bg-[#f5f5f0] px-2.5 py-1 rounded-full">{log.department}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#8A8A8A] font-mono">{log.model}</td>
                      <td className="px-5 py-3.5 text-xs text-[#2D2D2D] font-semibold">{log.tokens ?? '-'}</td>
                      <td className="px-5 py-3.5 text-xs text-[#2D2D2D]">{log.latencyMs ? `${log.latencyMs}ms` : '-'}</td>
                      <td className="px-5 py-3.5 text-xs text-[#8A8A8A] max-w-xs truncate">{log.inputText.slice(0, 60)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#eae8e3] bg-[#faf9f7]">
                <span className="text-xs text-[#8A8A8A]">
                  {pagination.total} 件中 {(pagination.page - 1) * pagination.limit + 1} -{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} 件を表示
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 text-xs font-semibold text-[#5C5C5C] px-3 py-1.5 rounded-full bg-white border border-[#eae8e3] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f5f0]"
                  >
                    <ChevronLeft size={12} /> 前へ
                  </button>
                  <span className="text-xs text-[#2D2D2D] font-semibold px-3">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="flex items-center gap-1 text-xs font-semibold text-[#5C5C5C] px-3 py-1.5 rounded-full bg-white border border-[#eae8e3] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f5f5f0]"
                  >
                    次へ <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'risks' && (
          <motion.div
            key="risks"
            className="bg-white rounded-3xl border border-[#eae8e3] shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#eae8e3] bg-[#faf9f7]">
                  <tr>
                    {['日時', 'タイプ', '深刻度', '説明', 'ステータス', '操作'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#8A8A8A] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f0]">
                  {risksLoading ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#BCBCBC]">読み込み中...</td></tr>
                  ) : (risks ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-emerald-500" />
                          </div>
                          <p className="text-sm text-[#8A8A8A] font-medium">リスクイベントはありません</p>
                        </div>
                      </td>
                    </tr>
                  ) : (risks ?? []).map((risk) => (
                    <tr key={risk.id} className="hover:bg-[#faf9f7] transition-colors">
                      <td className="px-5 py-3.5 text-xs text-[#8A8A8A]">{new Date(risk.createdAt).toLocaleString('ja-JP')}</td>
                      <td className="px-5 py-3.5 text-xs font-mono text-[#2D2D2D]">{risk.type}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${SEVERITY_STYLE[risk.severity] ?? 'bg-[#f5f5f0] text-[#8A8A8A]'}`}>
                          {risk.severity}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#8A8A8A] max-w-xs truncate">{risk.description}</td>
                      <td className="px-5 py-3.5">
                        {risk.resolved ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <CheckCircle size={13} /> 解決済み
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-[#8b85ff] font-medium">
                            <AlertCircle size={13} /> 未解決
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {!risk.resolved && (
                          <motion.button
                            onClick={() => resolveMutation.mutate(risk.id)}
                            className="text-xs text-[#8b85ff] hover:text-[#7c76f2] font-semibold hover:underline"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            解決済みにする
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
