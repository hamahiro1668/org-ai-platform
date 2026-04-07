import { motion } from 'framer-motion';

interface CharacterAvatarProps {
  image: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  color: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  hero: 'w-64 h-64',
};

export function CharacterAvatar({ image, name, size = 'md', color, className = '' }: CharacterAvatarProps) {
  return (
    <motion.div
      className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}
      whileHover={{ scale: 1.05, rotate: 2 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ backgroundColor: color }}
      />
      <img
        src={image}
        alt={name}
        className="relative w-full h-full object-contain drop-shadow-lg"
        draggable={false}
      />
    </motion.div>
  );
}
