import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, CheckCheck, AlertTriangle } from 'lucide-react';
import type { CodingResult } from '../../types/index';

function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="flex items-center gap-1 text-xs text-[#8A8A8A] hover:text-[#E8863A] transition-colors px-2 py-1 rounded-lg hover:bg-[#E8863A]/5">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'コピー済み' : label}
    </button>
  );
}

interface CodingPanelProps {
  coding: CodingResult;
  onApprove: () => void;
}

export default function CodingPanel({ coding, onApprove }: CodingPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const activeFile = coding.files[activeTab];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eae8e3] pb-3">
          <div className="w-8 h-8 bg-[#10B981]/10 rounded-xl flex items-center justify-center"><span className="text-sm">💻</span></div>
          <h3 className="font-bold text-[#2D2D2D] text-sm">コーディング成果物</h3>
        </div>

        <p className="text-sm text-[#8A8A8A] leading-relaxed">{coding.description}</p>

        {coding.files.length > 1 && (
          <div className="flex gap-1 flex-wrap">
            {coding.files.map((file, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`text-xs px-3 py-1.5 rounded-xl font-mono transition-all ${
                  activeTab === i ? 'bg-[#E8863A] text-white' : 'bg-[#f5f5f0] text-[#8A8A8A] hover:bg-[#eae8e3]'
                }`}
              >
                {file.filename}
              </button>
            ))}
          </div>
        )}

        {activeFile && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#2D2D2D]">{activeFile.filename}</span>
                <span className="text-[10px] bg-[#f5f5f0] text-[#8A8A8A] px-2 py-0.5 rounded-full">{activeFile.language}</span>
              </div>
              <CopyButton text={activeFile.content} label="コードをコピー" />
            </div>
            <pre className="bg-[#1e1e1e] text-green-400 rounded-2xl p-4 text-xs overflow-x-auto overflow-y-auto max-h-72 whitespace-pre leading-relaxed">
              {activeFile.content}
            </pre>
          </div>
        )}

        {coding.setupInstructions && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8A8A8A]">実行方法</p>
            <pre className="bg-[#2D2D2D] text-amber-300 rounded-2xl p-3 text-xs font-mono whitespace-pre-wrap">{coding.setupInstructions}</pre>
          </div>
        )}

        {coding.risks && coding.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-[#8A8A8A]">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {coding.risks.map((risk, i) => (
                <li key={i} className="text-xs text-[#8A8A8A] flex gap-2"><span className="text-amber-400 flex-shrink-0">-</span>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          className="bg-[#E8863A] hover:bg-[#d6762f] text-white rounded-xl py-2 px-5 text-sm font-semibold w-full flex items-center justify-center gap-1.5 shadow-sm shadow-orange-200/50 transition-all"
          onClick={onApprove}
        >
          <CheckCheck size={14} /> 承認・完了
        </button>
      </div>
    </motion.div>
  );
}
