import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Users } from 'lucide-react';
import { useAgentStats } from '../../hooks/useAgentStats';

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}</>;
}

export function WelcomeHero() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'お疲れ様です';
  const { stats } = useAgentStats();

  const totalTasks = stats
    ? Object.values(stats).reduce((sum, s) => sum + s.taskCount, 0)
    : 0;
  const activeDepts = stats
    ? Object.values(stats).filter((s) => s.status === 'active').length
    : 0;
  const completedTasks = stats
    ? Object.values(stats).reduce((sum, s) => sum + s.completedCount, 0)
    : 0;

  return (
    <motion.div
      className="flex flex-col items-center justify-center flex-1 text-center px-4 sm:px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-4xl sm:text-6xl mb-4 sm:mb-6"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        👋
      </motion.div>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] mb-2 sm:mb-3">
        {greeting}、社長。
      </h1>
      <p className="text-[#8A8A8A] text-base sm:text-lg">
        今日の指示をどうぞ。
      </p>

      {/* Live stats bar */}
      {stats && (
        <motion.div
          className="flex gap-4 sm:gap-6 mt-6 sm:mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="flex flex-col items-center gap-1 bg-white/60 rounded-2xl px-4 py-3 min-w-[80px]">
            <Activity size={16} className="text-[#E8863A]" />
            <span className="text-lg font-bold text-[#2D2D2D]">
              <AnimatedCounter target={totalTasks} />
            </span>
            <span className="text-[10px] text-[#8A8A8A]">総タスク</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-white/60 rounded-2xl px-4 py-3 min-w-[80px]">
            <Users size={16} className="text-green-500" />
            <span className="text-lg font-bold text-[#2D2D2D]">
              <AnimatedCounter target={activeDepts} />
            </span>
            <span className="text-[10px] text-[#8A8A8A]">稼働中</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-white/60 rounded-2xl px-4 py-3 min-w-[80px]">
            <CheckCircle size={16} className="text-blue-500" />
            <span className="text-lg font-bold text-[#2D2D2D]">
              <AnimatedCounter target={completedTasks} />
            </span>
            <span className="text-[10px] text-[#8A8A8A]">完了</span>
          </div>
        </motion.div>
      )}

      <p className="text-[#BCBCBC] text-xs sm:text-sm mt-3 sm:mt-4">
        下のエージェントカードをタップして、詳細を確認できます
      </p>
    </motion.div>
  );
}
