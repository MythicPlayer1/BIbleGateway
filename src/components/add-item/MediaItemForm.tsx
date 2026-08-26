"use client";

import React from "react";
import { Upload, Plus, Trash2 } from "lucide-react";
import type { NewItemDataState } from "../AddItemModal";

interface MediaItemFormProps {
  newItemData: NewItemDataState;
  setNewItemData: React.Dispatch<React.SetStateAction<NewItemDataState>>;
}

export const MediaItemForm: React.FC<MediaItemFormProps> = ({
  newItemData,
  setNewItemData
}) => {
  const mediaPreviews = React.useMemo(() => {
    if (!newItemData.mediaFiles) return [];
    return newItemData.mediaFiles.map((file, idx) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video'),
      key: `${file.name}-${file.size}-${idx}`
    }));
  }, [newItemData.mediaFiles]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
          Media Deck / Album Title
        </label>
        <input
          type="text"
          placeholder="e.g. Christmas Photos / Announcements Album / Video"
          value={newItemData.title}
          onChange={(e) => setNewItemData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-neutral-400 uppercase">
            Upload Images or Videos (Multiple Supported)
          </label>
          {newItemData.mediaFiles && newItemData.mediaFiles.length > 0 && (
            <button
              type="button"
              onClick={() => setNewItemData(prev => ({ ...prev, mediaFiles: [], mediaFile: null }))}
              className="text-[11px] text-red-400 hover:text-red-300 font-bold"
            >
              Clear All ({newItemData.mediaFiles.length})
            </button>
          )}
        </div>

        {newItemData.mediaFiles && newItemData.mediaFiles.length > 0 ? (
          <div className="space-y-3">
            {/* Thumbnail Gallery Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-2.5 bg-neutral-950/90 rounded-2xl border border-neutral-800">
              {mediaPreviews.map((item, idx) => {
                return (
                  <div 
                    key={item.key} 
                    className="group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 flex items-center justify-center shadow-md"
                  >
                    {item.isVideo ? (
                      <video src={item.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.url} alt={item.file.name} className="w-full h-full object-cover" />
                    )}
                    
                    {/* Slide Number Badge */}
                    <span className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-white/20">
                      #{idx + 1}
                    </span>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setNewItemData(prev => {
                          const next = prev.mediaFiles.filter((_, i) => i !== idx);
                          return {
                            ...prev,
                            mediaFiles: next,
                            mediaFile: next[0] || null
                          };
                        });
                      }}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>

                    {/* File Name Footer */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs p-1 text-[9px] text-neutral-300 font-mono truncate text-center">
                      {item.file.name}
                    </div>
                  </div>
                );
              })}

              {/* Add More Images Tile */}
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-xl cursor-pointer bg-neutral-900/50 hover:bg-neutral-900 transition-colors group">
                <Plus size={20} className="text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[10px] font-bold text-neutral-400 group-hover:text-indigo-300 mt-1">Add More</span>
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      setNewItemData(prev => ({
                        ...prev,
                        mediaFiles: [...(prev.mediaFiles || []), ...files],
                        mediaFile: prev.mediaFile || files[0]
                      }));
                    }
                  }} 
                />
              </label>
            </div>
            <p className="text-[11px] text-indigo-400 font-medium">
              ✨ {newItemData.mediaFiles.length} item(s) selected. Each image will be created as a slide in this schedule item.
            </p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-neutral-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-neutral-900/50 hover:bg-neutral-900 transition-all group">
            <div className="flex flex-col items-center gap-2 text-center p-4">
              <div className="p-3 bg-neutral-800 group-hover:bg-indigo-950 text-neutral-400 group-hover:text-indigo-400 rounded-2xl transition-colors">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-xs text-neutral-200 font-bold">
                  Click or Drag & Drop Multiple Photos or Videos
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  JPG, PNG, WebP, MP4 (Select multiple files at once to create a slide deck)
                </p>
              </div>
            </div>
            <input 
              type="file" 
              accept="image/*,video/*" 
              multiple
              className="hidden" 
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  setNewItemData(prev => ({ 
                    ...prev, 
                    mediaFiles: files, 
                    mediaFile: files[0], 
                    title: prev.title || (files.length > 1 ? `Photo Gallery (${files.length} Images)` : files[0].name)
                  }));
                }
              }} 
            />
          </label>
        )}
      </div>
    </div>
  );
};
