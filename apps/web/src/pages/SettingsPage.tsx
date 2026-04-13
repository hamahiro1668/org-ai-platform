import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LogOut, Settings as SettingsIcon, User as UserIcon, Building2, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User, UploadedFile } from '@org-ai/shared-types';

const PLAN_LABEL: Record<string, { label: string; tone: string }> = {
  STARTER: { label: 'Starter', tone: 'bg-[#f5f5f0] text-[#5C5C5C]' },
  PRO: { label: 'Pro', tone: 'bg-[#8b85ff]/10 text-[#8b85ff]' },
  MAX: { label: 'Max', tone: 'bg-amber-50 text-amber-700' },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const storedUser = useAuthStore((s) => s.user);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ fileName: string; content: string } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User }>('/auth/me');
      return res.data.data;
    },
  });

  const { data: files } = useQuery({
    queryKey: ['uploaded-files'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: UploadedFile[] }>('/files');
      return res.data.data;
    },
  });

  const handleLogout = () => {
    logout();
    qc.clear();
    navigate('/login', { replace: true });
  };

  const handleAnalyze = async (file: UploadedFile) => {
    setAnalyzingId(file.id);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const res = await api.post<{
        success: boolean;
        data?: { analysis: { content: string } };
        error?: { message: string };
      }>(`/files/${file.id}/analyze`, {
        question: 'このファイルの内容を300字程度で要約してください。',
      });
      if (res.data.success && res.data.data) {
        setAnalysisResult({ fileName: file.originalName, content: res.data.data.analysis.content });
      } else {
        setAnalysisError(res.data.error?.message ?? '分析に失敗しました');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setAnalysisError(err.response?.data?.error?.message ?? '分析に失敗しました');
    } finally {
      setAnalyzingId(null);
    }
  };

  const user = me ?? storedUser;
  const planDef = PLAN_LABEL.STARTER;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#8b85ff]/10 rounded-2xl flex items-center justify-center">
            <SettingsIcon size={18} className="text-[#8b85ff]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#2D2D2D]">設定</h2>
            <p className="text-sm text-[#8A8A8A]">プロフィール・組織情報・ファイル管理</p>
          </div>
        </div>
      </div>

      <section className="mb-5 bg-white rounded-3xl border border-[#eae8e3] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon size={16} className="text-[#8b85ff]" />
          <h3 className="text-sm font-semibold text-[#2D2D2D]">プロフィール</h3>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="名前" value={user?.name ?? '—'} />
          <Field label="メールアドレス" value={user?.email ?? '—'} />
          <Field label="ロール" value={user?.role ?? '—'} />
          <Field label="ユーザーID" value={user?.id ?? '—'} mono />
        </dl>
      </section>

      <section className="mb-5 bg-white rounded-3xl border border-[#eae8e3] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="text-[#8b85ff]" />
          <h3 className="text-sm font-semibold text-[#2D2D2D]">組織</h3>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="組織ID" value={user?.orgId ?? '—'} mono />
          <div>
            <dt className="text-xs text-[#8A8A8A] mb-1">プラン</dt>
            <dd>
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${planDef.tone}`}>
                {planDef.label}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-5 bg-white rounded-3xl border border-[#eae8e3] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-[#8b85ff]" />
          <h3 className="text-sm font-semibold text-[#2D2D2D]">アップロード済みファイル</h3>
          <span className="ml-auto text-xs text-[#8A8A8A]">{files?.length ?? 0} 件</span>
        </div>
        {(files ?? []).length === 0 ? (
          <p className="text-xs text-[#BCBCBC] py-6 text-center">ファイルはまだアップロードされていません</p>
        ) : (
          <ul className="divide-y divide-[#f5f5f0]">
            {(files ?? []).map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#2D2D2D] truncate">{f.originalName}</p>
                  <p className="text-xs text-[#8A8A8A]">
                    {f.mimeType} · {(f.sizeBytes / 1024).toFixed(1)} KB ·{' '}
                    {new Date(f.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <motion.button
                  onClick={() => handleAnalyze(f)}
                  disabled={analyzingId === f.id}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#8b85ff] hover:text-[#7c76f2] px-3 py-1.5 rounded-full bg-[#8b85ff]/10 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles size={12} />
                  {analyzingId === f.id ? '分析中...' : 'AIで分析'}
                </motion.button>
              </li>
            ))}
          </ul>
        )}

        {analysisError && (
          <div className="mt-4 p-3 rounded-2xl bg-red-50 text-xs text-red-700">{analysisError}</div>
        )}
        {analysisResult && (
          <div className="mt-4 p-4 rounded-2xl bg-[#f5f5f0] border border-[#eae8e3]">
            <p className="text-xs font-semibold text-[#2D2D2D] mb-2">{analysisResult.fileName} の要約</p>
            <p className="text-xs text-[#5C5C5C] whitespace-pre-wrap leading-relaxed">{analysisResult.content}</p>
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl border border-[#eae8e3] shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#2D2D2D]">ログアウト</h3>
            <p className="text-xs text-[#8A8A8A]">このブラウザからサインアウトします</p>
          </div>
          <motion.button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 px-4 py-2 rounded-full bg-red-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={13} />
            ログアウト
          </motion.button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-[#8A8A8A] mb-1">{label}</dt>
      <dd className={`text-sm text-[#2D2D2D] ${mono ? 'font-mono text-xs' : ''} break-all`}>{value}</dd>
    </div>
  );
}
