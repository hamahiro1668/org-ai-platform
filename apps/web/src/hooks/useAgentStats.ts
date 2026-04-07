import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Agent } from '../types/agent';

interface DeptStats {
  taskCount: number;
  status: 'active' | 'processing' | 'idle';
  latestReport: string | null;
  completedCount: number;
  runningCount: number;
}

const RANK_LABELS = [
  '稼働率トップ',
  'エンゲージメント最優秀',
  '精度No.1',
  'インサイト発見王',
  '信頼度No.1',
  'マルチタスク王',
];

export function useAgentStats() {
  const { data } = useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Record<string, DeptStats> }>('/agents/stats');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  const enrichAgent = (agent: Agent): Agent => {
    if (!data) return agent;
    const dept = agent.id.toUpperCase();
    const stats = data[dept];
    if (!stats) return agent;
    return {
      ...agent,
      taskCount: stats.taskCount,
      status: stats.status,
      latestReport: stats.latestReport ?? agent.latestReport,
    };
  };

  const enrichAgents = (agentList: Agent[]): Agent[] => {
    const enriched = agentList.map((a) => enrichAgent(a));
    // taskCountでソートしてrankを動的割り当て
    const sorted = [...enriched].sort((a, b) => b.taskCount - a.taskCount);
    return enriched.map((a) => {
      const rankIndex = sorted.findIndex((s) => s.id === a.id);
      return {
        ...a,
        rank: rankIndex + 1,
        rankLabel: RANK_LABELS[rankIndex] ?? `#${rankIndex + 1}`,
      };
    });
  };

  return { enrichAgent, enrichAgents, stats: data };
}
