import type { ReactNode } from 'react';
import { DEPT_ACCENT, DEPT_LABEL } from '../../constants/departments';

type Variant = 'solid' | 'glass' | 'outline' | 'soft';
type Size = 'xs' | 'sm' | 'md';

interface GlassBadgeProps {
  variant?: Variant;
  size?: Size;
  tone?: keyof typeof DEPT_ACCENT | string;
  color?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

const sizeClass: Record<Size, string> = {
  xs: 'text-micro px-1.5 py-0.5 gap-1 rounded-xs',
  sm: 'text-xs px-2.5 py-1 gap-1 rounded-full',
  md: 'text-xs px-3 py-1.5 gap-1.5 rounded-full',
};

/**
 * GlassBadge — labels, tags, status pills.
 * See DESIGN.md §10.4. Pass `tone` with department key for auto-coloring.
 */
export function GlassBadge({
  variant = 'soft',
  size = 'sm',
  tone,
  color,
  icon,
  children,
  className = '',
  onClick,
}: GlassBadgeProps) {
  const toneColor =
    color ??
    (tone && tone in DEPT_ACCENT ? DEPT_ACCENT[tone as keyof typeof DEPT_ACCENT] : '#8A8A8A');

  const variantStyle = (() => {
    switch (variant) {
      case 'solid':
        return { background: toneColor, color: '#FFFDF9' };
      case 'soft':
        return { background: `${toneColor}1A`, color: toneColor };
      case 'outline':
        return {
          background: 'transparent',
          color: toneColor,
          border: `1px solid ${toneColor}55`,
        };
      case 'glass':
        return undefined;
    }
  })();

  const variantClass = variant === 'glass' ? 'glass-thin text-primary' : '';
  const interactive = onClick
    ? 'cursor-pointer transition-all duration-fast hover:scale-105 active:scale-95'
    : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-medium ${sizeClass[size]} ${variantClass} ${interactive} ${className}`}
      style={variantStyle}
    >
      {icon}
      {children}
    </span>
  );
}

/** Convenience: render a department badge with the department's label and color. */
export function DeptBadge({
  dept,
  size = 'sm',
  variant = 'soft',
}: {
  dept: string;
  size?: Size;
  variant?: Variant;
}) {
  return (
    <GlassBadge tone={dept} size={size} variant={variant}>
      {DEPT_LABEL[dept] ?? dept}
    </GlassBadge>
  );
}
