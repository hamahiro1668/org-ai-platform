import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../types/agent';
import { agents } from '../../data/agents';
import { useChatStore } from '../../store/chatStore';
import { useAgentStats } from '../../hooks/useAgentStats';
import { TopBar } from '../Navigation/TopBar';
import { BottomNav } from '../Navigation/BottomNav';
import { WelcomeHero } from './WelcomeHero';
import { AgentHeroCard } from './AgentHeroCard';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AgentCarousel } from './AgentCarousel';

export function DashboardLayout() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const navigate = useNavigate();
  const { setSelectedAgent: setChatAgent, setPendingDepartment } = useChatStore();
  const { enrichAgents, enrichAgent } = useAgentStats();

  const enrichedAgents = useMemo(() => enrichAgents(agents), [enrichAgents]);

  const handleSelect = useCallback((agent: Agent) => {
    setSelectedAgent((prev) => (prev?.id === agent.id ? null : enrichAgent(agent)));
  }, [enrichAgent]);

  const handleClose = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  const handleReport = useCallback((agent: Agent) => {
    setChatAgent(agent.id);
    setPendingDepartment(agent.id.toUpperCase());
    navigate('/chat');
  }, [navigate, setChatAgent, setPendingDepartment]);

  const handleTask = useCallback((agent: Agent) => {
    setChatAgent(agent.id);
    setPendingDepartment(agent.id.toUpperCase());
    navigate('/chat');
  }, [navigate, setChatAgent, setPendingDepartment]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #f5f5f0 0%, #eae8e3 100%)',
      }}
    >
      <TopBar showBack={!!selectedAgent} onBack={handleClose} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden px-2 sm:px-4 gap-2 sm:gap-4">
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <>
              {/* Left: Hero card */}
              <div className="flex-1 flex items-center justify-center min-w-0 overflow-y-auto">
                <AgentHeroCard
                  agent={selectedAgent}
                  onClose={handleClose}
                  onReport={handleReport}
                  onTask={handleTask}
                />
              </div>
              {/* Right: Detail panel */}
              <div className="w-[340px] flex-shrink-0 hidden lg:flex">
                <AgentDetailPanel agent={selectedAgent} />
              </div>
            </>
          ) : (
            <WelcomeHero />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom carousel */}
      <AgentCarousel
        agents={enrichedAgents}
        selectedId={selectedAgent?.id ?? null}
        onSelect={handleSelect}
      />

      <BottomNav />
    </div>
  );
}
