import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, RotateCcw, CheckCheck, ChevronRight } from 'lucide-react';
import type { EmailResult } from '../../types/index';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-[#8A8A8A] hover:text-[#E8863A] transition-colors px-2 py-1 rounded-lg hover:bg-[#E8863A]/5"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

interface EmailPanelProps {
  email: EmailResult;
  onRefinement: (request: string) => void;
  onApprove: () => void;
  isRefining: boolean;
}

export default function EmailPanel({ email, onRefinement, onApprove, isRefining }: EmailPanelProps) {
  const [to, setTo] = useState(email.to);
  const [cc, setCc] = useState(email.cc ?? '');
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementText, setRefinementText] = useState('');

  const fullText = `To: ${to}\nCc: ${cc}\n件名: ${subject}\n\n${body}`;

  const handleRefinement = () => {
    if (!refinementText.trim()) return;
    onRefinement(refinementText.trim());
    setRefinementText('');
    setShowRefinement(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 space-y-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[#eae8e3] pb-3">
          <div className="w-8 h-8 bg-[#0EA5E9]/10 rounded-xl flex items-center justify-center">
            <span className="text-sm">📧</span>
          </div>
          <h3 className="font-bold text-[#2D2D2D] text-sm">メール実行パネル</h3>
          <div className="ml-auto">
            <CopyButton text={fullText} />
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#8A8A8A] w-10 flex-shrink-0">To</label>
            <input
              className="flex-1 text-sm bg-[#f5f5f0] border border-[#eae8e3] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 text-[#2D2D2D]"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#8A8A8A] w-10 flex-shrink-0">Cc</label>
            <input
              className="flex-1 text-sm bg-[#f5f5f0] border border-[#eae8e3] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 text-[#2D2D2D]"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="（任意）"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[#8A8A8A] w-10 flex-shrink-0">件名</label>
            <input
              className="flex-1 text-sm bg-[#f5f5f0] border border-[#eae8e3] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 text-[#2D2D2D]"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#8A8A8A] mb-1 block">本文</label>
            <textarea
              className="w-full text-sm bg-[#f5f5f0] border border-[#eae8e3] rounded-2xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 text-[#2D2D2D] min-h-[180px] resize-y leading-relaxed"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>

        {/* Refinement */}
        {showRefinement && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <textarea
              className="w-full text-sm bg-[#f5f5f0] border border-[#E8863A]/30 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 text-[#2D2D2D] min-h-[72px] resize-none"
              placeholder="修正内容を入力（例：もっとカジュアルなトーンで）"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                className="text-xs text-[#8A8A8A] hover:text-[#2D2D2D] px-3 py-1.5 rounded-lg transition-colors"
                onClick={() => setShowRefinement(false)}
              >
                キャンセル
              </button>
              <button
                className="bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs rounded-xl px-4 py-1.5 flex items-center gap-1 font-semibold transition-all disabled:opacity-50"
                onClick={handleRefinement}
                disabled={isRefining || !refinementText.trim()}
              >
                <ChevronRight size={12} />
                {isRefining ? '修正中...' : '再生成'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            className="flex items-center gap-1.5 text-sm text-[#8A8A8A] hover:text-[#2D2D2D] border border-[#eae8e3] rounded-xl px-4 py-2 hover:bg-[#f5f5f0] transition-all"
            onClick={() => setShowRefinement(!showRefinement)}
          >
            <RotateCcw size={13} />
            修正依頼
          </button>
          <button
            className="bg-[#E8863A] hover:bg-[#d6762f] text-white rounded-xl px-5 py-2 text-sm font-semibold flex-1 flex items-center justify-center gap-1.5 shadow-sm shadow-orange-200/50 transition-all"
            onClick={onApprove}
          >
            <CheckCheck size={14} />
            承認・完了
          </button>
        </div>
      </div>
    </motion.div>
  );
}
