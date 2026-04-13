import { forwardRef, type ReactNode, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { DEPT_ACCENT } from '../../constants/departments';

type GlassVariant = 'thin' | 'regular' | 'thick' | 'chrome';
type DeptTone = keyof typeof DEPT_ACCENT;

type GlassCardBaseProps = {
  variant?: GlassVariant;
  tone?: DeptTone | string;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  reflectionTop?: boolean;
  children?: ReactNode;
  className?: string;
};

const variantClass: Record<GlassVariant, string> = {
  thin: 'glass-thin',
  regular: 'glass-regular',
  thick: 'glass-thick',
  chrome: 'glass-chrome',
};

const paddingClass = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
} as const;

const radiusClass = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const;

/**
 * GlassCard — the foundational surface primitive.
 * See DESIGN.md §10.1. Use instead of raw bg-white divs.
 */
export const GlassCard = forwardRef<
  HTMLDivElement,
  GlassCardBaseProps & Omit<HTMLMotionProps<'div'>, keyof GlassCardBaseProps>
>(function GlassCard(
  {
    variant = 'regular',
    tone,
    interactive = false,
    padding = 'md',
    radius = 'lg',
    reflectionTop = false,
    children,
    className = '',
    style,
    ...rest
  },
  ref,
) {
  const toneColor =
    tone && tone in DEPT_ACCENT ? DEPT_ACCENT[tone as DeptTone] : undefined;

  const toneStyle = toneColor
    ? {
        boxShadow: `inset 0 0 0 1px ${toneColor}18, 0 0 24px ${toneColor}12`,
      }
    : undefined;

  return (
    <motion.div
      ref={ref}
      className={`relative ${variantClass[variant]} ${radiusClass[radius]} ${paddingClass[padding]} ${reflectionTop ? 'glass-reflection-top' : ''} ${className}`}
      style={{ ...toneStyle, ...style }}
      whileHover={interactive ? { y: -2, scale: 1.005 } : undefined}
      whileTap={interactive ? { scale: 0.995 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

/** Static (non-motion) variant for deeply nested usage where animations aren't needed. */
export function GlassSurface({
  variant = 'regular',
  padding = 'md',
  radius = 'lg',
  children,
  className = '',
  ...rest
}: GlassCardBaseProps & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative ${variantClass[variant]} ${radiusClass[radius]} ${paddingClass[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
