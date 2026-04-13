import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Agent } from '../../types/agent';
import { agents } from '../../data/agents';
import { useChatStore } from '../../store/chatStore';
import { useAgentStats } from '../../hooks/useAgentStats';
import { BottomNav } from '../Navigation/BottomNav';
import { AmbientBackground } from '../ui/AmbientBackground';
import { WelcomeHero } from './WelcomeHero';
import { AgentHeroCard } from './AgentHeroCard';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AgentCarousel } from './AgentCarousel';

// Map frontend agent ID -> backend department enum
const AGENT_TO_DEPT: Record<string, string> = {
  sales: 'SALES',
  marketing: 'MARKETING',
  accounting: 'ACCOUNTING',
  analytics: 'ANALYTICS',
  general: 'GENERAL',
  assistant: 'GENERAL',
};

export function DashboardLayout() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const navigate = useNavigate();
  const {
    setSelectedAgent: setChatAgent,
    setPendingDepartment,
    setAutoCreateSession,
  } = useChatStore();
  const { enrichAgents, enrichAgent } = useAgentStats();

  const enrichedAgents = useMemo(() => enrichAgents(agents), [enrichAgents]);

  const handleSelect = useCallback((agent: Agent) => {
    setSelectedAgent((prev) => (prev?.id === agent.id ? null : enrichAgent(agent)));
  }, [enrichAgent]);

  const handleClose = useCallback(() => {
    setSelectedAgent(null);
  }, []);

  const goToAgentChat = useCallback(
    (agent: Agent) => {
      setChatAgent(agent.id);
      setPendingDepartment(AGENT_TO_DEPT[agent.id] ?? 'GENERAL');
      setAutoCreateSession(true);
      navigate('/chat');
    },
    [navigate, setChatAgent, setPendingDepartment, setAutoCreateSession],
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <AmbientBackground />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden px-2 sm:px-4 gap-2 sm:gap-4 relative z-0">
        <AnimatePresence mode="wait">
          {selectedAgent ? (
            <>
              {/* Left: Hero card */}
              <div className="flex-1 flex items-center justify-center min-w-0 overflow-y-auto">
                <AgentHeroCard
                  agent={selectedAgent}
                  onClose={handleClose}
                  onReport={goToAgentChat}
                  onTask={goToAgentChat}
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

      <BottomNav showBack={!!selectedAgent} onBack={handleClose} />
    </div>
  );
}
