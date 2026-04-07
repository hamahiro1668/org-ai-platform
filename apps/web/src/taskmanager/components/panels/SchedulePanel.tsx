import { motion } from 'framer-motion';
import { CheckCheck, AlertTriangle, Flag, CalendarPlus } from 'lucide-react';
import type { ScheduleResult } from '../../types/index';
import { downloadICS } from '../../utils/ics';

interface SchedulePanelProps {
  schedule: ScheduleResult;
  onApprove: () => void;
}

export default function SchedulePanel({ schedule, onApprove }: SchedulePanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#eae8e3] pb-3">
          <div className="w-8 h-8 bg-[#D97706]/10 rounded-xl flex items-center justify-center"><span className="text-sm">📅</span></div>
          <h3 className="font-bold text-[#2D2D2D] text-sm">スケジュール成果物</h3>
        </div>

        <h4 className="font-bold text-[#2D2D2D] text-base">{schedule.title}</h4>

        <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-hide">
          {schedule.items.map((item, i) => (
            <div
              key={i}
              className={`flex gap-3 items-start p-2.5 rounded-2xl text-xs transition-colors ${
                item.milestone
                  ? 'bg-[#E8863A]/5 border border-[#E8863A]/20'
                  : 'bg-[#f5f5f0] border border-[#eae8e3]'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {item.milestone ? <Flag size={12} className="text-[#E8863A]" /> : <div className="w-3 h-3 rounded-full border-2 border-[#BCBCBC]" />}
              </div>
              <div className="w-28 flex-shrink-0">
                <span className={`font-mono ${item.milestone ? 'text-[#E8863A] font-bold' : 'text-[#8A8A8A]'}`}>{item.date}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`leading-snug ${item.milestone ? 'font-semibold text-[#2D2D2D]' : 'text-[#2D2D2D]'}`}>{item.task}</p>
                {item.assignee && <p className="text-[#8A8A8A] mt-0.5">担当: {item.assignee}</p>}
              </div>
            </div>
          ))}
        </div>

        {schedule.notes && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#8A8A8A]">補足事項</p>
            <p className="text-xs text-[#8A8A8A] leading-relaxed">{schedule.notes}</p>
          </div>
        )}

        {schedule.risks && schedule.risks.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-500" />
              <p className="text-xs font-semibold text-[#8A8A8A]">リスク・注意点</p>
            </div>
            <ul className="space-y-1">
              {schedule.risks.map((risk, i) => (
                <li key={i} className="text-xs text-[#8A8A8A] flex gap-2"><span className="text-amber-400 flex-shrink-0">-</span>{risk}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 border border-[#E8863A]/30 text-[#E8863A] hover:bg-[#E8863A]/5 rounded-xl py-2 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            onClick={() => downloadICS(schedule, `${schedule.title}.ics`)}
          >
            <CalendarPlus size={14} /> カレンダーに追加
          </button>
          <button
            className="flex-1 bg-[#E8863A] hover:bg-[#d6762f] text-white rounded-xl py-2 px-4 text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-orange-200/50 transition-all"
            onClick={onApprove}
          >
            <CheckCheck size={14} /> 承認・完了
          </button>
        </div>
      </div>
    </motion.div>
  );
}
