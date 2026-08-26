"use client";

import React from "react";
import { Reorder, useDragControls } from "framer-motion";
import { 
  GripVertical, CheckSquare, Square, Trash2, Edit3,
  Music, BookOpen, Film, Image as ImageIcon, Type 
} from "lucide-react";
import type { ScheduleItem } from "@/lib/lyrics";

interface ScheduleItemCardProps {
  item: ScheduleItem;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCheck: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
}

export const ScheduleItemCard: React.FC<ScheduleItemCardProps> = ({
  item,
  isCurrent,
  isSelected,
  onSelect,
  onToggleCheck,
  onDelete,
  onEdit
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        zIndex: 50
      }}
      transition={{ type: "spring", stiffness: 450, damping: 35 }}
      onClick={onSelect}
      className={`group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer relative select-none ${
        isCurrent
          ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/40'
          : 'bg-neutral-900/70 border-neutral-800 text-neutral-300 hover:bg-neutral-900 hover:border-neutral-700'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div 
          onPointerDown={(e) => {
            e.preventDefault();
            dragControls.start(e);
          }}
          className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-neutral-800/80 touch-none"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>

        <button
          type="button"
          onClick={onToggleCheck}
          className="text-neutral-500 hover:text-neutral-300 p-0.5"
        >
          {isSelected ? (
            <CheckSquare size={16} className="text-indigo-400" />
          ) : (
            <Square size={16} />
          )}
        </button>

        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
          item.type === 'song'
            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
            : item.type === 'scripture'
            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
            : item.type === 'media'
            ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
            : 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
        }`}>
          {item.type === 'song' ? <Music size={15} /> :
           item.type === 'scripture' ? <BookOpen size={15} /> :
           item.type === 'media' ? (item.mediaType === 'video' ? <Film size={15} /> : <ImageIcon size={15} />) :
           <Type size={15} />}
        </div>

        <div className="truncate">
          <p className="font-bold text-sm truncate text-white">{item.title}</p>
          <p className="text-[11px] text-neutral-400 truncate">{item.subtitle || item.type}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-indigo-300 transition-colors"
            title="Edit item, lyrics, or scripture"
          >
            <Edit3 size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
          title="Delete item"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Reorder.Item>
  );
};
