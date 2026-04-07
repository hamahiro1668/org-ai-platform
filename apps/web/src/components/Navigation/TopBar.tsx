import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Menu, Search } from 'lucide-react';

interface TopBarProps {
  showBack?: boolean;
  onBack?: () => void;
}

export function TopBar({ showBack, onBack }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        {showBack ? (
          <motion.button
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5 text-[#2D2D2D]" />
          </motion.button>
        ) : (
          <motion.button
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-5 h-5 text-[#8A8A8A]" />
          </motion.button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5 text-[#8A8A8A]" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full" />
        </motion.button>
        <motion.button
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="w-5 h-5 text-[#8A8A8A]" />
        </motion.button>
      </div>
    </div>
  );
}
