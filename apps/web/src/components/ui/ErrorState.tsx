import { AlertTriangle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'エラーが発生しました',
  description = '通信に失敗しました。しばらくしてから再度お試しください。',
  onRetry,
  retryLabel = '再試行',
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center py-12 ${className}`}
    >
      <GlassCard
        variant="thin"
        padding="lg"
        radius="2xl"
        className="max-w-md w-full text-center ring-1 ring-inset ring-danger/30"
      >
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center bg-danger/15 text-danger">
          <AlertTriangle size={22} />
        </div>
        <h3 className="text-body font-semibold text-primary mb-1.5">{title}</h3>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
        {onRetry && (
          <div className="mt-5 flex justify-center">
            <GlassButton variant="secondary" size="sm" onClick={onRetry} icon={<RotateCcw size={14} />}>
              {retryLabel}
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
