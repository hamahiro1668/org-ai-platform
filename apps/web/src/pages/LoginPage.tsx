import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { User } from '@org-ai/shared-types';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ success: boolean; data: { token: string; user: User } }>('/auth/login', { email, password });
      login(res.data.data.token, res.data.data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="w-14 h-14 bg-[#E8863A] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 mb-4"
            whileHover={{ rotate: 12, scale: 1.05 }}
          >
            <Sparkles size={24} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-[#2D2D2D] tracking-tight">Product B</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">AI組織エージェントプラットフォーム</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-bold text-[#2D2D2D] mb-1">おかえりなさい</h2>
          <p className="text-sm text-[#8A8A8A] mb-6">アカウントにサインインする</p>

          {error && (
            <motion.div
              className="text-sm text-red-600 mb-5 p-3 bg-red-50 rounded-xl"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#8A8A8A] mb-2 uppercase tracking-wider">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f5f5f0] border-0 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8A8A8A] mb-2 uppercase tracking-wider">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f5f5f0] border-0 rounded-xl px-4 py-3 text-sm text-[#2D2D2D] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8863A] hover:bg-[#d6762f] disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading ? 'ログイン中...' : (<>ログイン <ArrowRight size={16} /></>)}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-[#BCBCBC]">
              アカウントをお持ちでない方は{' '}
              <Link to="/register" className="text-[#E8863A] font-semibold hover:underline">新規登録</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#BCBCBC] mt-5">
          デモ: admin@demo.com / demo1234
        </p>
      </motion.div>
    </div>
  );
}
