import { motion } from 'framer-motion';
import { Home, BarChart3, MessageCircle, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: Home, label: 'ホーム', path: '/' },
  { icon: BarChart3, label: '分析', path: '/governance' },
  { icon: Sparkles, label: 'AI', path: '/chat', isCenter: true },
  { icon: MessageCircle, label: 'チャット', path: '/chat' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="relative flex items-end justify-around px-6 pb-6 pt-3 bg-white/80 backdrop-blur-lg border-t border-gray-100">
      {navItems.map((item) => {
        const isActive = item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);

        if (item.isCenter) {
          return (
            <motion.button
              key="center-ai"
              className="relative -top-4 w-14 h-14 rounded-full bg-[#E8863A] flex items-center justify-center shadow-lg shadow-orange-200"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate('/chat')}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={item.label}
            className="flex flex-col items-center gap-1 min-w-[48px]"
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
          >
            <item.icon
              className={`w-6 h-6 ${isActive ? 'text-[#E8863A]' : 'text-[#BCBCBC]'}`}
            />
            <span
              className={`text-[10px] font-medium ${
                isActive ? 'text-[#E8863A]' : 'text-[#BCBCBC]'
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                className="w-1 h-1 rounded-full bg-[#E8863A]"
                layoutId="bottomNavIndicator"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
