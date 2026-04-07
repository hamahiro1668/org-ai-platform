import { motion } from 'framer-motion';

interface TabSwitchProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabSwitch({ tabs, activeTab, onTabChange }: TabSwitchProps) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          onClick={() => onTabChange(tab)}
        >
          {activeTab === tab && (
            <motion.div
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              layoutId="activeTab"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className={`relative z-10 ${activeTab === tab ? 'text-[#2D2D2D]' : 'text-[#8A8A8A]'}`}>
            {tab}
          </span>
        </button>
      ))}
    </div>
  );
}
