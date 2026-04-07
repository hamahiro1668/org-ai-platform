import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, CheckCheck, AlertTriangle, RotateCcw, ChevronRight } from 'lucide-react';
import type { DocumentResult } from '../../types/index';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="flex items-center gap-1 text-xs text-[#8A8A8A] hover:text-[#E8863A] transition-colors px-2 py-1 rounded-lg hover:bg-[#E8863A]/5">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'コピー済み' : '全文コピー'}
    </button>
  );
}

interface DocumentPanelProps {
  document: DocumentResult;
  onRefinement: (request: string) => void;
  onApprove: () => void;
  isRefining: boolean;
}

export default function DocumentPanel({ document: doc, onRefinement, onApprove, isRefining }: DocumentPanelProps) {
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementText, setRefinementText] = useState('');

  const handleRefinement = () => {
    if (!refinementText.trim()) return;
    onRefinement(refinementText.trim());
    setRefinementText('');
    setShowRefinement(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eae8e3] pb-3">
          <div className="w-8 h-8 bg-[#E8863A]/10 rounded-xl flex items-center justify-center"><span className="text-sm">📄</span></div>
          <h3 className="font-bold text-[#2D2D2D] text-sm">文書成果物</h3>
          <div className="ml-auto"><CopyButton text={`# ${doc.title}\n\n${doc.content}`} /></div>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-[#2D2D2D] text-base">{doc.title}</h4>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">{doc.summary}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#8A8A8A]">文書本文</p>
          <pre className="bg-[#f5f5f0] rounded-2xl p-4 text-xs text-[#2D2D2D] whitespace-pre-wrap border border-[#eae8e3] max-h-72 overflow-y-auto leading-relaxed font-sans scrollbar-hide">
            {doc.content}
          </pre>
        </div>

        {doc.risks && doc.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-[#8A8A8A]">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {doc.risks.map((risk, i) => (
                <li key={i} className="text-xs text-[#8A8A8A] flex gap-2"><span className="text-amber-400 flex-shrink-0">-</span>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        {showRefinement && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
            <textarea
              className="w-full text-sm bg-[#f5f5f0] border border-[#E8863A]/30 rounded-2xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E8863A]/30 text-[#2D2D2D] min-h-[72px] resize-none"
              placeholder="修正内容を入力（例：もっと具体的なデータを入れて）"
              value={refinementText}
              onChange={(e) => setRefinementText(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button className="text-xs text-[#8A8A8A] hover:text-[#2D2D2D] px-3 py-1.5 rounded-lg transition-colors" onClick={() => setShowRefinement(false)}>キャンセル</button>
              <button
                className="bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs rounded-xl px-4 py-1.5 flex items-center gap-1 font-semibold transition-all disabled:opacity-50"
                onClick={handleRefinement}
                disabled={isRefining || !refinementText.trim()}
              >
                <ChevronRight size={12} /> {isRefining ? '修正中...' : '再生成'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            className="flex items-center gap-1.5 text-sm text-[#8A8A8A] hover:text-[#2D2D2D] border border-[#eae8e3] rounded-xl px-4 py-2 hover:bg-[#f5f5f0] transition-all"
            onClick={() => setShowRefinement(!showRefinement)}
          >
            <RotateCcw size={13} /> 修正依頼
          </button>
          <button
            className="bg-[#E8863A] hover:bg-[#d6762f] text-white rounded-xl px-5 py-2 text-sm font-semibold flex-1 flex items-center justify-center gap-1.5 shadow-sm shadow-orange-200/50 transition-all"
            onClick={onApprove}
          >
            <CheckCheck size={14} /> 承認・完了
          </button>
        </div>
      </div>
    </motion.div>
  );
}
