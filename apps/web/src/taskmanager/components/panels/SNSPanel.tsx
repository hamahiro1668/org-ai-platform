import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Copy, Check, Twitter, Instagram, Linkedin } from 'lucide-react';
import type { SNSResult } from '../../types';

const PLATFORM_CONFIG: Record<string, { icon: typeof Twitter; label: string; color: string; maxLength: number }> = {
  twitter: { icon: Twitter, label: 'X (Twitter)', color: '#1DA1F2', maxLength: 280 },
  instagram: { icon: Instagram, label: 'Instagram', color: '#E4405F', maxLength: 2200 },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: '#0A66C2', maxLength: 3000 },
};

interface SNSPanelProps {
  result: SNSResult;
  onPost?: (result: SNSResult) => void;
}

export function SNSPanel({ result, onPost }: SNSPanelProps) {
  const [copied, setCopied] = useState(false);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const config = PLATFORM_CONFIG[result.platform] ?? PLATFORM_CONFIG.twitter;
  const Icon = config.icon;
  const charCount = result.content.length + result.hashtags.reduce((acc, tag) => acc + tag.length + 2, 0);

  const handleCopy = () => {
    const text = result.content + '\n\n' + result.hashtags.map((t) => `#${t}`).join(' ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePost = async () => {
    if (!onPost) return;
    setPosting(true);
    try {
      await onPost(result);
      setPosted(true);
    } catch {
      // error handled by parent
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Platform header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon size={18} style={{ color: config.color }} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#2D2D2D]">{config.label}</p>
          <p className="text-[10px] text-[#8A8A8A]">投稿プレビュー</p>
        </div>
      </div>

      {/* Content preview */}
      <div className="bg-[#f5f5f0] rounded-2xl p-4">
        <p className="text-sm text-[#2D2D2D] whitespace-pre-wrap leading-relaxed">
          {result.content}
        </p>
        {result.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {result.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-[#E8863A] font-medium">#{tag}</span>
            ))}
          </div>
        )}
        {result.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden bg-gray-200 h-40 flex items-center justify-center text-xs text-[#8A8A8A]">
            画像プレビュー
          </div>
        )}
      </div>

      {/* Character count */}
      <div className="flex items-center justify-between text-xs">
        <span className={`${charCount > config.maxLength ? 'text-red-500 font-semibold' : 'text-[#8A8A8A]'}`}>
          {charCount} / {config.maxLength} 文字
        </span>
        {result.scheduledAt && (
          <span className="text-[#8A8A8A]">予約: {new Date(result.scheduledAt).toLocaleString('ja-JP')}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          onClick={handlePost}
          disabled={posting || posted || charCount > config.maxLength}
          className="flex-1 text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ backgroundColor: posted ? '#10B981' : config.color }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {posted ? (
            <><Check size={13} /> 投稿完了</>
          ) : posting ? (
            '投稿中...'
          ) : (
            <><Send size={13} /> 投稿する</>
          )}
        </motion.button>
        <button
          onClick={handleCopy}
          className="bg-[#f5f5f0] hover:bg-gray-200 text-[#8A8A8A] text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'コピー済' : 'コピー'}
        </button>
      </div>
    </div>
  );
}
