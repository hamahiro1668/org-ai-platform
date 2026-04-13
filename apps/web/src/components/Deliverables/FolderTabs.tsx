import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Folder as FolderIcon } from 'lucide-react';
import type { Folder } from '../../store/deliverablesStore';

interface FolderTabsProps {
  folders: Folder[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate?: () => void;
}

/**
 * FolderTabs — horizontal scrollable droppable folders.
 * Uses glass-regular pill tabs with dept color accents.
 */
export function FolderTabs({ folders, activeId, onSelect, onCreate }: FolderTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-1">
      {folders.map((folder) => (
        <FolderTab
          key={folder.id}
          folder={folder}
          active={folder.id === activeId}
          onSelect={() => onSelect(folder.id)}
        />
      ))}
      {onCreate && (
        <motion.button
          onClick={onCreate}
          className="flex items-center gap-1 glass-thin rounded-full px-3 py-1.5 text-xs text-secondary hover:text-primary flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={12} /> 新規
        </motion.button>
      )}
    </div>
  );
}

interface FolderTabProps {
  folder: Folder;
  active: boolean;
  onSelect: () => void;
}

function FolderTab({ folder, active, onSelect }: FolderTabProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-drop-${folder.id}` });

  const tone = folder.color ?? '#8b85ff';

  return (
    <motion.button
      ref={setNodeRef}
      onClick={onSelect}
      className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium flex-shrink-0 transition-all duration-base ${
        active ? 'text-inverse shadow-elev-2' : 'glass-thin text-secondary hover:text-primary'
      } ${isOver ? 'ring-2 ring-offset-2 ring-offset-canvas' : ''}`}
      style={{
        background: active
          ? `linear-gradient(135deg, ${tone}E0, ${tone})`
          : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ['--tw-ring-color' as any]: tone,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <FolderIcon size={12} />
      <span>{folder.name}</span>
      {folder.itemIds.length > 0 && (
        <span
          className="text-micro ml-0.5 px-1 rounded-full"
          style={{
            background: active ? 'rgba(255, 255, 255, 0.25)' : `${tone}20`,
            color: active ? '#FFFDF9' : tone,
          }}
        >
          {folder.itemIds.length}
        </span>
      )}
    </motion.button>
  );
}
