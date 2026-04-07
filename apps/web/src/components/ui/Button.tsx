import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  className?: string;
}

export function Button({ children, variant = 'primary', onClick, className = '' }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all';
  const variants = {
    primary: 'bg-[#E8863A] text-white shadow-md hover:shadow-lg',
    secondary: 'border-2 border-[#E8863A] text-[#E8863A] hover:bg-[#FDF0E6]',
    ghost: 'text-[#8A8A8A] hover:text-[#2D2D2D] hover:bg-gray-100',
  };

  return (
    <motion.button
      className={`${base} ${variants[variant]} ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
