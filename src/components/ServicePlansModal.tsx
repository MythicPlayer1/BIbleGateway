"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  FolderKanban,
  Save,
  Plus,
  Search,
  Calendar,
  Layers,
  Copy,
  Trash2,
  Upload,
  X,
  ChevronRight,
  Music,
  BookOpen,
  Presentation,
  Type,
  Film,
  Globe,
  FileDown
} from "lucide-react";
import type { ServicePlan, ScheduleItem } from "@/lib/lyrics";

interface ServicePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: ServicePlan[];
  currentScheduleItems: ScheduleItem[];
  onSaveCurrentPlan: (name: string, description?: string, serviceDate?: string) => void;
  onLoadPlan: (plan: ServicePlan, mode: "replace" | "append") => void;
  onDuplicatePlan: (plan: ServicePlan) => void;
  onDeletePlan: (planId: string) => void;
  onExportPlan: (plan: ServicePlan) => void;
  onImportPlan: (file: File) => void;
}

export const ServicePlansModal: React.FC<ServicePlansModalProps> = ({
  isOpen,
  onClose,
  savedPlans,
  currentScheduleItems,
  onSaveCurrentPlan,
  onLoadPlan,
  onDuplicatePlan,
  onDeletePlan,
  onExportPlan,
  onImportPlan
}) => {
  const [activeTab, setActiveTab] = useState<"library" | "save">("library");
  const [searchQuery, setSearchQuery] = useState("");

  // Save Form State
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [serviceDate, setServiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredPlans = savedPlans.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.serviceDate && p.serviceDate.includes(q))
    );
  });

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    onSaveCurrentPlan(planName.trim(), planDescription.trim(), serviceDate);
    setPlanName("");
    setPlanDescription("");
    setActiveTab("library");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportPlan(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case "song":
        return <Music size={13} className="text-indigo-400" />;
      case "scripture":
        return <BookOpen size={13} className="text-emerald-400" />;
      case "presentation":
        return <Presentation size={13} className="text-amber-400" />;
      case "web_embed":
        return <Globe size={13} className="text-cyan-400" />;
      case "media":
        return <Film size={13} className="text-violet-400" />;
      default:
        return <Type size={13} className="text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderKanban size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Service Plans & Schedule Templates</h3>
              <p className="text-xs text-neutral-400">Save, reuse, and customize service orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition-all"
              title="Import service plan from JSON file"
            >
              <Upload size={13} className="text-indigo-400" />
              <span>Import Plan</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 ml-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-neutral-800/80 bg-neutral-950">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("library")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "library"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <Layers size={14} />
              Saved Plans ({savedPlans.length})
            </button>
            <button
              onClick={() => setActiveTab("save")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "save"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <Save size={14} />
              Save Current Schedule ({currentScheduleItems.length} items)
            </button>
          </div>

          {activeTab === "library" && (
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plans by name/date..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "save" ? (
            /* Save Current Schedule Form */
            <form onSubmit={handleSaveSubmit} className="space-y-4 max-w-xl mx-auto">
              <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                    <Save size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Save Current Order of Service</h4>
                    <p className="text-xs text-indigo-300/80">
                      Stores {currentScheduleItems.length} schedule items as a reusable template
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5">
                  Plan / Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Sunday Morning Worship, Youth Fellowship, Easter Service"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5 flex items-center gap-1">
                    <Calendar size={13} />
                    Service Date
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase mb-1.5">
                    Notes / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={planDescription}
                    onChange={(e) => setPlanDescription(e.target.value)}
                    placeholder="e.g. Communion service with guest speaker"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-neutral-900/70 p-4 rounded-2xl border border-neutral-800 space-y-2">
                <p className="text-xs font-bold text-neutral-400 uppercase">Items Included in this Plan:</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {currentScheduleItems.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-2">
                      Current schedule is empty. Add songs/scriptures first or save an empty template.
                    </p>
                  ) : (
                    currentScheduleItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-1.5 bg-neutral-950 rounded-xl text-xs border border-neutral-800"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-[10px] text-neutral-500">{idx + 1}.</span>
                          {getItemTypeIcon(item.type)}
                          <span className="text-white font-medium truncate">{item.title}</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-neutral-400 shrink-0">
                          {item.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("library")}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!planName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Save size={14} />
                  Save Plan to Library
                </button>
              </div>
            </form>
          ) : (
            /* Saved Plans Library */
            <div className="space-y-4">
              {filteredPlans.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-neutral-800 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                    <FolderKanban size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Saved Plans Found</h4>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      Save your current service schedule to reuse it as a template anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("save")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
                  >
                    <Plus size={14} />
                    Save Current Schedule as Plan
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredPlans.map((plan) => {
                    const songCount = plan.items.filter((i) => i.type === "song").length;
                    const scriptureCount = plan.items.filter((i) => i.type === "scripture").length;
                    const slideCount = plan.items.filter((i) => i.type !== "song" && i.type !== "scripture").length;

                    return (
                      <div
                        key={plan.id}
                        className="bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-white">{plan.name}</h4>
                              {plan.description && (
                                <p className="text-xs text-neutral-400 line-clamp-1">{plan.description}</p>
                              )}
                            </div>
                            {plan.serviceDate && (
                              <span className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-lg text-[10px] font-mono flex items-center gap-1 shrink-0">
                                <Calendar size={11} className="text-indigo-400" />
                                {plan.serviceDate}
                              </span>
                            )}
                          </div>

                          {/* Item Breakdown Badges */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-0.5 bg-neutral-950 text-neutral-300 border border-neutral-800 rounded-md text-[10px] font-semibold">
                              {plan.items.length} Total Items
                            </span>
                            {songCount > 0 && (
                              <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-500/30 rounded-md text-[10px] font-semibold flex items-center gap-1">
                                <Music size={10} /> {songCount} Songs
                              </span>
                            )}
                            {scriptureCount > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded-md text-[10px] font-semibold flex items-center gap-1">
                                <BookOpen size={10} /> {scriptureCount} Scripture
                              </span>
                            )}
                            {slideCount > 0 && (
                              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-semibold flex items-center gap-1">
                                <Layers size={10} /> {slideCount} Media/Slides
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onDuplicatePlan(plan)}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs transition-all"
                              title="Duplicate as new template"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onExportPlan(plan)}
                              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs transition-all"
                              title="Export plan to JSON file"
                            >
                              <FileDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePlan(plan.id)}
                              className="p-1.5 bg-neutral-800 hover:bg-red-600/80 text-neutral-400 hover:text-white rounded-xl text-xs transition-all"
                              title="Delete plan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onLoadPlan(plan, "append")}
                              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-[11px] font-bold transition-all"
                              title="Append items to current schedule"
                            >
                              + Append
                            </button>
                            <button
                              type="button"
                              onClick={() => onLoadPlan(plan, "replace")}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1"
                              title="Load and replace current schedule"
                            >
                              <span>Load Plan</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
