import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Agent } from '../../types/agent';
import { CharacterAvatar } from '../Characters/CharacterAvatar';
import { StatusDot } from '../ui/StatusDot';

interface AgentCarouselProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (agent: Agent) => void;
}

export function AgentCarousel({ agents, selectedId, onSelect }: AgentCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative px-2 sm:px-4 pb-2 sm:pb-4">
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide py-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {agents.map((agent, index) => {
          const isSelected = selectedId === agent.id;
          return (
            <motion.div
              key={agent.id}
              className={`
                flex-shrink-0 w-[100px] h-[130px] sm:w-[120px] sm:h-[155px] md:w-[140px] md:h-[180px]
                rounded-2xl cursor-pointer snap-start
                flex flex-col items-center justify-center gap-1 sm:gap-2 relative
                transition-shadow
                ${isSelected
                  ? 'bg-white shadow-lg ring-2'
                  : 'bg-white/80 shadow-sm hover:shadow-md'
                }
              `}
              style={isSelected ? { ringColor: agent.color } : undefined}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              whileHover={{ y: -4 }}
              onClick={() => onSelect(agent)}
            >
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                <StatusDot status={agent.status} />
              </div>

              {/* Task count badge */}
              {agent.taskCount > 0 && (
                <div
                  className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[9px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ backgroundColor: agent.color }}
                >
                  {agent.taskCount > 99 ? '99+' : agent.taskCount}
                </div>
              )}

              <CharacterAvatar
                image={agent.image}
                name={agent.name}
                size="sm"
                color={agent.color}
                className="sm:!w-20 sm:!h-20 md:!w-24 md:!h-24"
              />

              <span
                className="text-xs sm:text-sm font-semibold"
                style={{ color: isSelected ? agent.color : '#2D2D2D' }}
              >
                {agent.department}
              </span>
            </motion.div>
          );
        })}

        <div className="flex-shrink-0 w-[40px] sm:w-[60px] flex items-center justify-center">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#BCBCBC]" />
        </div>
      </div>
    </div>
  );
}
