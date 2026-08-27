"use client";

import React from "react";
import { motion, Reorder } from "framer-motion";
import { 
  Calendar, Music, Plus, CheckSquare, Square, 
  Trash2, Layers, GripVertical, Image as ImageIcon, Upload, Sparkles, Edit3, FolderKanban
} from "lucide-react";
import type { ScheduleItem, SongSlide, GlobalBackgroundConfig } from "@/lib/lyrics";
import { ScheduleItemCard } from "./ScheduleItemCard";

interface ScheduleManagerProps {
  scheduleItems: ScheduleItem[];
  selectedItemId: string;
  selectedScheduleIds: string[];
  selectedSlideIndex: number;
  activeScheduleItem: ScheduleItem | null;
  activeSlides: SongSlide[];
  draggedSlideIdx: number | null;
  globalBgConfig?: GlobalBackgroundConfig;
  onOpenBgStudioModal?: () => void;
  onOpenServicePlansModal?: () => void;
  onReorderSchedule: (items: ScheduleItem[]) => void;
  onSelectScheduleItem: (id: string) => void;
  onToggleSelectScheduleItem: (id: string, e: React.MouseEvent) => void;
  onDeleteSingleScheduleItem: (id: string, e: React.MouseEvent) => void;
  onToggleSelectAll: () => void;
  onBulkDelete: () => void;
  onClearAll: () => void;
  onOpenAddItemModal: () => void;
  onOpenNewSongModal: () => void;
  onSelectSlideIndex: (idx: number) => void;
  onSlideDragStart: (e: React.DragEvent, idx: number) => void;
  onSlideDragOver: (e: React.DragEvent, idx: number) => void;
  onSlideDragEnd: () => void;
  onResetSlidesOrder: () => void;
  onRemoveSlide: (idx: number, e?: React.MouseEvent) => void;
  bgFileName: string | null;
  onBackgroundUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBackground: () => void;
  onEditScheduleItem?: (item: ScheduleItem, e?: React.MouseEvent) => void;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  scheduleItems,
  selectedItemId,
  selectedScheduleIds,
  selectedSlideIndex,
  activeScheduleItem,
  activeSlides,
  draggedSlideIdx,
  globalBgConfig,
  onOpenBgStudioModal,
  onOpenServicePlansModal,
  onReorderSchedule,
  onSelectScheduleItem,
  onToggleSelectScheduleItem,
  onDeleteSingleScheduleItem,
  onToggleSelectAll,
  onBulkDelete,
  onClearAll,
  onOpenAddItemModal,
  onOpenNewSongModal,
  onSelectSlideIndex,
  onSlideDragStart,
  onSlideDragOver,
  onSlideDragEnd,
  onResetSlidesOrder,
  onRemoveSlide,
  bgFileName,
  onBackgroundUpload,
  onClearBackground,
  onEditScheduleItem
}) => {
  return (
    <div className="space-y-6 flex-1 flex flex-col">
      {/* Schedule Items List Card */}
      <div className="bg-[#0e0e0e] p-6 rounded-3xl border border-neutral-800 shadow-xl space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-indigo-400" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Order of Service (Schedule)</h2>
              <p className="text-[11px] text-neutral-400">Drag to reorder • Add songs, scripture & media</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenServicePlansModal}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 shadow-sm active:scale-95 transition-all"
              title="Save, load, and manage service plans and schedule templates"
            >
              <FolderKanban size={14} className="text-indigo-400" />
              <span>Plans / Templates</span>
            </button>
            <button
              onClick={onOpenNewSongModal}
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-neutral-700 shadow-sm active:scale-95 transition-all"
              title="Write and create a new song"
            >
              <Music size={14} className="text-indigo-400" />
              New Song
            </button>
            <button
              onClick={onOpenAddItemModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Plus size={15} />
              Add Item
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {scheduleItems.length > 0 && (
          <div className="flex items-center justify-between bg-neutral-900/90 px-3.5 py-2 rounded-xl border border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleSelectAll}
                className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 font-semibold"
              >
                {selectedScheduleIds.length === scheduleItems.length ? (
                  <CheckSquare size={15} className="text-indigo-400" />
                ) : (
                  <Square size={15} />
                )}
                <span>Select All ({selectedScheduleIds.length}/{scheduleItems.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedScheduleIds.length > 0 && (
                <button
                  onClick={onBulkDelete}
                  className="flex items-center gap-1 bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all"
                >
                  <Trash2 size={13} />
                  Delete Selected ({selectedScheduleIds.length})
                </button>
              )}
              <button
                onClick={onClearAll}
                className="text-neutral-500 hover:text-neutral-300 text-[11px] font-medium transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Drag-and-Drop Reorderable Schedule List */}
        <div className="space-y-2 flex-1 max-h-[380px] overflow-y-auto pr-1">
          <Reorder.Group 
            axis="y" 
            values={scheduleItems} 
            onReorder={onReorderSchedule}
            className="space-y-2.5"
          >
            {scheduleItems.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                isCurrent={item.id === selectedItemId}
                isSelected={selectedScheduleIds.includes(item.id)}
                onSelect={() => onSelectScheduleItem(item.id)}
                onToggleCheck={(e) => onToggleSelectScheduleItem(item.id, e)}
                onDelete={(e) => onDeleteSingleScheduleItem(item.id, e)}
                onEdit={(e) => onEditScheduleItem?.(item, e)}
              />
            ))}
          </Reorder.Group>

          {scheduleItems.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-500 gap-2 border-2 border-dashed border-neutral-800 rounded-2xl">
              <Calendar size={32} className="opacity-40" />
              <p className="text-xs font-semibold">Service Schedule is currently empty.</p>
              <button
                onClick={onOpenAddItemModal}
                className="text-xs text-indigo-400 font-bold hover:underline"
              >
                + Add your first item
              </button>
            </div>
          )}
        </div>

        {/* Active Schedule Item's Slide Deck - Drag-and-Drop Reorderable */}
        {activeScheduleItem && activeSlides.length > 0 && (
          <div className="pt-4 border-t border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Layers size={14} />
                  {activeScheduleItem.title} — Slides
                </h3>
                {onEditScheduleItem && (
                  <button
                    type="button"
                    onClick={(e) => onEditScheduleItem(activeScheduleItem, e)}
                    className="p-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300 rounded-lg border border-neutral-800 transition-colors"
                    title="Edit item details, scripture or lyrics"
                  >
                    <Edit3 size={12} />
                  </button>
                )}
                {activeScheduleItem.customSlides && activeScheduleItem.customSlides.length > 0 && (
                  <button
                    type="button"
                    onClick={onResetSlidesOrder}
                    className="text-[10px] text-neutral-400 hover:text-indigo-300 underline font-medium"
                    title="Reset to original slide order"
                  >
                    (Reset Order)
                  </button>
                )}
              </div>
              <span className="text-[11px] text-neutral-400 font-semibold">
                Slide {selectedSlideIndex + 1} of {activeSlides.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {activeSlides.map((slide, sIdx) => {
                const isActive = sIdx === selectedSlideIndex;
                const isDragging = draggedSlideIdx === sIdx;

                return (
                  <motion.div
                    key={`slide-${activeScheduleItem.id}-${sIdx}`}
                    draggable
                    onDragStart={(e: any) => onSlideDragStart(e, sIdx)}
                    onDragOver={(e: any) => onSlideDragOver(e, sIdx)}
                    onDragEnd={onSlideDragEnd}
                    onClick={() => onSelectSlideIndex(sIdx)}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    className={`group p-3 rounded-xl border cursor-grab active:cursor-grabbing flex flex-col justify-between text-left relative transition-all select-none ${
                      isDragging
                        ? 'border-indigo-400 ring-2 ring-indigo-400/80 shadow-2xl z-20 scale-[1.02] bg-indigo-950/80'
                        : isActive
                          ? 'bg-indigo-900/60 border-indigo-500 text-white ring-2 ring-indigo-500/40 shadow-md'
                          : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block w-fit ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {slide.section}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-mono text-neutral-500">#{sIdx + 1}</span>
                        {activeSlides.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => onRemoveSlide(sIdx, e)}
                            className="text-neutral-400 hover:text-red-400 p-0.5 rounded"
                            title="Remove slide"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                        <GripVertical size={13} className="text-neutral-400 hover:text-white" />
                      </div>
                    </div>
                    {slide.mediaUrl ? (
                      <div className="w-full h-24 rounded-lg overflow-hidden bg-black/80 relative border border-neutral-700/60 flex items-center justify-center">
                        {slide.mediaType === 'video' ? (
                          <video src={slide.mediaUrl} className="w-full h-full object-cover pointer-events-none" />
                        ) : (
                          <img src={slide.mediaUrl} alt={slide.lines[0] || "Media Slide"} className="w-full h-full object-cover pointer-events-none" />
                        )}
                        <div className="absolute bottom-1 left-1 right-1 bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-white truncate">
                          {slide.lines[0] || `Image ${sIdx + 1}`}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs line-clamp-2 leading-relaxed opacity-90 font-medium whitespace-pre-line">
                        {slide.text}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Background Media Management Card */}
      <div className="bg-[#0e0e0e] p-5 rounded-3xl border border-neutral-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-indigo-400">
            <ImageIcon size={16} />
            Global Projector Background
          </h2>
          {onOpenBgStudioModal && (
            <button
              type="button"
              onClick={onOpenBgStudioModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Sparkles size={13} />
              <span>Studio Controls</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-neutral-800 rounded-2xl cursor-pointer bg-neutral-900/40 hover:bg-neutral-900 hover:border-indigo-500 transition-colors">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-neutral-400" />
              <p className="text-xs text-neutral-300 font-semibold">Upload Photo(s) or Video</p>
            </div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Multiple photos for slideshow, or MP4 video</p>
            <input type="file" multiple className="hidden" accept="image/*,video/*" onChange={onBackgroundUpload} />
          </label>

          {bgFileName && (
            <div className="flex items-center justify-between bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800">
              <span className="text-xs text-neutral-300 truncate max-w-[280px] font-medium">{bgFileName}</span>
              <button onClick={onClearBackground} className="text-red-400 hover:text-red-300 p-1" title="Remove Background">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
