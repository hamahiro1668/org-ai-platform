import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User } from '@org-ai/shared-types';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; data: { token: string; user: User } }>('/auth/register', form);
      login(res.data.data.token, res.data.data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #f5f5f0 0%, #eae8e3 100%)' }}
    >
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="w-14 h-14 bg-[#E8863A] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 mb-4"
            whileHover={{ rotate: 12, scale: 1.05 }}
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight">FLOW - みんなのAIオフィス</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">AI組織エージェントプラットフォーム</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#2D2D2D] mb-1">新規登録</h2>
          <p className="text-sm text-[#8A8A8A] mb-6">組織アカウントを作成する</p>

          {error && (
            <motion.div
              className="text-sm text-red-600 mb-5 p-3 bg-red-50 rounded-xl"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name' as const, label: 'お名前', type: 'text', placeholder: '山田 太郎' },
              { key: 'email' as const, label: 'メールアドレス', type: 'email', placeholder: 'you@example.com' },
              { key: 'password' as const, label: 'パスワード (8文字以上)', type: 'password', placeholder: '••••••••' },
              { key: 'orgName' as const, label: '組織名', type: 'text', placeholder: '株式会社サンプル' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-[#8A8A8A] mb-2 uppercase tracking-wider">{label}</label>
                <input
                  type={type}
                  {...field(key)}
                  placeholder={placeholder}
                  className="w-full bg-[#f5f5f0] border-0 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 transition-all"
                  required
                />
              </div>
            ))}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8863A] hover:bg-[#d6762f] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 mt-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? '登録中...' : (<>アカウントを作成 <ArrowRight size={16} /></>)}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-[#BCBCBC]">
              既にアカウントをお持ちの方は{' '}
              <Link to="/login" className="text-[#E8863A] font-semibold hover:underline">ログイン</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
