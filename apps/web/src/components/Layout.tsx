import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from './Navigation/TopBar';
import { BottomNav } from './Navigation/BottomNav';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f5f5f0 0%, #eae8e3 100%)' }}
    >
      <TopBar showBack onBack={() => navigate(-1)} />
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="h-full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
