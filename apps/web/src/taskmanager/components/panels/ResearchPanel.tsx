import { useState } from 'react';
import { Copy, Check, CheckCheck, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ResearchResult } from '../../types/index';

function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} className="text-xs text-[#8A8A8A] hover:text-[#E8863A] flex items-center gap-1 transition-colors">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'コピー済み' : label}
    </button>
  );
}

interface ResearchPanelProps {
  research: ResearchResult;
  onApprove: () => void;
}

export default function ResearchPanel({ research, onApprove }: ResearchPanelProps) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const fullText = `# ${research.title}\n\n## サマリー\n${research.summary}\n\n${research.sections.map((s) => `## ${s.heading}\n${s.content}`).join('\n\n')}\n\n## 結論\n${research.conclusion}`;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eae8e3] pb-3">
          <div className="w-8 h-8 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center"><span className="text-sm">🔍</span></div>
          <h3 className="font-bold text-[#2D2D2D] text-sm">リサーチレポート</h3>
          <div className="ml-auto"><CopyButton text={fullText} label="全文コピー" /></div>
        </div>

        <h4 className="font-bold text-[#2D2D2D] text-base leading-snug">{research.title}</h4>

        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#8A8A8A]">エグゼクティブサマリー</p>
          <p className="text-xs text-[#2D2D2D] leading-relaxed bg-[#E8863A]/5 rounded-2xl p-3 border border-[#E8863A]/10">{research.summary}</p>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
          {research.sections.map((section, i) => (
            <div key={i} className="border border-[#eae8e3] rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[#f5f5f0] hover:bg-[#eae8e3] transition-colors text-left"
                onClick={() => setExpandedSection(expandedSection === i ? null : i)}
              >
                <span className="text-xs font-semibold text-[#2D2D2D]">{section.heading}</span>
                {expandedSection === i ? <ChevronUp size={13} className="text-[#8A8A8A]" /> : <ChevronDown size={13} className="text-[#8A8A8A]" />}
              </button>
              {expandedSection === i && (
                <div className="px-3 py-2.5 bg-white border-t border-[#eae8e3]">
                  <p className="text-xs text-[#2D2D2D] leading-relaxed whitespace-pre-wrap">{section.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {research.conclusion && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8A8A8A]">結論・提言</p>
            <p className="text-xs text-[#2D2D2D] leading-relaxed bg-emerald-50 rounded-2xl p-3 border border-emerald-100">{research.conclusion}</p>
          </div>
        )}

        {research.risks && research.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-[#8A8A8A]">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {research.risks.map((risk, i) => (
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
