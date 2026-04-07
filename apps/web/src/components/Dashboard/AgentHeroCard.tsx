import { motion, AnimatePresence } from 'framer-motion';
import { Star, Play, ClipboardList } from 'lucide-react';
import { Agent } from '../../types/agent';
import { CharacterAvatar } from '../Characters/CharacterAvatar';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';

interface AgentHeroCardProps {
  agent: Agent | null;
  onClose: () => void;
  onReport: (agent: Agent) => void;
  onTask: (agent: Agent) => void;
}

const heroVariants = {
  hidden: {
    x: '80vw',
    y: '-30vh',
    scale: 0.3,
    opacity: 0,
    rotate: 15,
  },
  visible: {
    x: '0vw',
    y: '0vh',
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 60,
      damping: 18,
      mass: 1.2,
      x: { type: 'spring', stiffness: 50, damping: 20 },
      y: { type: 'spring', stiffness: 80, damping: 15 },
      opacity: { duration: 0.3 },
      scale: { type: 'spring', stiffness: 70, damping: 14 },
    },
  },
  exit: {
    x: '-30vw',
    y: '10vh',
    scale: 0.5,
    opacity: 0,
    transition: { duration: 0.4, ease: 'easeIn' },
  },
};

export function AgentHeroCard({ agent, onClose, onReport, onTask }: AgentHeroCardProps) {
  return (
    <AnimatePresence mode="wait">
      {agent && (
        <motion.div
          key={agent.id}
          className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-full w-full sm:w-auto max-h-[calc(100vh-220px)] overflow-y-auto"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="relative p-4 sm:p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#8A8A8A] hover:bg-gray-200 transition-colors z-10"
            >
              ✕
            </button>

            {/* Rank label */}
            <span className="text-xs font-medium text-[#BCBCBC] tracking-wide">
              #{agent.rank} {agent.rankLabel}
            </span>

            {/* Department */}
            <p className="text-lg sm:text-xl text-[#8A8A8A] mt-1">
              {agent.department}
            </p>

            {/* Character name */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2D2D2D] mt-1 mb-2 sm:mb-4">
              {agent.name}
            </h2>

            {/* Character image */}
            <div className="flex justify-center my-2 sm:my-4">
              <CharacterAvatar
                image={agent.image}
                name={agent.name}
                size="lg"
                color={agent.color}
                className="md:!w-64 md:!h-64"
              />
            </div>

            {/* Rating & Status */}
            <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-[#2D2D2D]">{agent.rating}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={agent.status} size="md" />
                <span className="text-xs sm:text-sm text-[#8A8A8A]">
                  {agent.status === 'active' ? '稼働中' : agent.status === 'processing' ? '処理中' : '待機中'}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[#8A8A8A]">💬 {agent.taskCount}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
              <Button variant="primary" onClick={() => onReport(agent)}>
                <Play className="w-4 h-4" />
                AIチャット
              </Button>
              <Button variant="secondary" onClick={() => onTask(agent)}>
                <ClipboardList className="w-4 h-4" />
                タスク指示
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
