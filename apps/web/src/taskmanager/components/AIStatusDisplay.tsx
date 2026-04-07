import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, AlertCircle, Loader } from 'lucide-react';
import type { AgentStep } from '../types/index';

const STEP_LABELS: Record<string, string> = {
  orchestrator: '部長AI',
  manager: '課長AI',
  executor: '社員AI',
};

function StepIcon({ status }: { status: AgentStep['status'] }) {
  if (status === 'done') return <CheckCircle size={16} className="text-emerald-500" />;
  if (status === 'error') return <AlertCircle size={16} className="text-red-500" />;
  if (status === 'running') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <Loader size={16} className="text-[#E8863A]" />
      </motion.div>
    );
  }
  return <Circle size={16} className="text-[#BCBCBC]" />;
}

interface AIStatusDisplayProps {
  steps: AgentStep[];
  error?: string | null;
}

export default function AIStatusDisplay({ steps, error }: AIStatusDisplayProps) {
  return (
    <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[#E8863A]/10 rounded-xl flex items-center justify-center">
          <span className="text-sm">🏢</span>
        </div>
        <span className="font-semibold text-[#2D2D2D] text-sm">組織が動いています...</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {steps.map((step, i) => (
            <motion.div
              key={step.role}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 text-sm transition-all ${
                step.status === 'pending' ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <StepIcon status={step.status} />
              <div className="flex-1 min-w-0">
                <span className={`font-medium ${
                  step.status === 'running' ? 'text-[#E8863A]' :
                  step.status === 'done' ? 'text-[#2D2D2D]' :
                  step.status === 'error' ? 'text-red-500' :
                  'text-[#BCBCBC]'
                }`}>
                  {STEP_LABELS[step.role]}
                </span>
                <span className="text-[#8A8A8A] ml-1">：{step.label.split('：')[1] ?? step.label}</span>
              </div>
              {step.status === 'running' && (
                <motion.div
                  className="flex gap-0.5"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  {[0, 1, 2].map((d) => (
                    <motion.div
                      key={d}
                      className="w-1 h-1 rounded-full bg-[#E8863A]"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ delay: d * 0.15, duration: 0.6, repeat: Infinity }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
