"use client";

import React from "react";
import { useWorshipState } from "@/hooks/useWorshipState";

import { Header } from "@/components/Header";
import { Toast } from "@/components/Toast";
import { BibleExplorer } from "@/components/BibleExplorer";
import { SongLibrary } from "@/components/SongLibrary";
import { ScheduleManager } from "@/components/ScheduleManager";
import { LiveScreenMonitor } from "@/components/LiveScreenMonitor";
import { TickerStudioModal } from "@/components/TickerStudioModal";
import { AddItemModal } from "@/components/AddItemModal";
import { SongModal } from "@/components/SongModal";
import { BackgroundStudioModal } from "@/components/BackgroundStudioModal";
import { EditScheduleItemModal } from "@/components/EditScheduleItemModal";
import { ServicePlansModal } from "@/components/ServicePlansModal";
import { ConfirmModal } from "@/components/ConfirmModal";

export default function Home() {
  const state = useWorshipState();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Header
        appMode={state.appMode}
        switchAppMode={state.switchAppMode}
        songsCount={state.allSongs.length}
        tickerConfig={state.tickerConfig}
        onOpenTickerModal={() => state.setIsTickerModalOpen(true)}
        onOpenBgStudioModal={() => state.setIsBgStudioModalOpen(true)}
        isTextHidden={state.isTextHidden}
        onToggleHideText={state.toggleHideText}
        isDisplayConnected={state.isDisplayConnected}
        onOpenProjector={state.handleOpenProjector}
      />

      {/* Main Workspace Layout */}
      <main className="max-w-[1700px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 w-full items-start">
        
        {/* Left Column: Context Explorer & Schedule Manager (5 Columns) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {state.appMode === 'schedule' && (
            <ScheduleManager
              scheduleItems={state.scheduleItems}
              selectedItemId={state.selectedItemId}
              selectedScheduleIds={state.selectedScheduleIds}
              selectedSlideIndex={state.selectedSlideIndex}
              activeScheduleItem={state.activeScheduleItem}
              activeSlides={state.activeSlides}
              draggedSlideIdx={state.draggedSlideIdx}
              globalBgConfig={state.globalBgConfig}
              onOpenBgStudioModal={() => state.setIsBgStudioModalOpen(true)}
              onOpenServicePlansModal={() => state.setIsServicePlansModalOpen(true)}
              onReorderSchedule={(items) => state.updateScheduleAndPersist(items)}
              onSelectScheduleItem={(id) => {
                state.setSelectedItemId(id);
                state.selectSlideIndex(0);
                try { localStorage.setItem('worship_selected_item_id', id); } catch (e) {}
              }}
              onToggleSelectScheduleItem={state.toggleSelectScheduleItem}
              onDeleteSingleScheduleItem={state.handleDeleteSingleScheduleItem}
              onToggleSelectAll={state.toggleSelectAllSchedule}
              onBulkDelete={state.handleBulkDeleteSchedule}
              onClearAll={state.handleClearAllSchedule}
              onOpenAddItemModal={() => state.setIsAddItemModalOpen(true)}
              onOpenNewSongModal={state.handleOpenNewSongModal}
              onSelectSlideIndex={state.selectSlideIndex}
              onSlideDragStart={state.handleSlideDragStart}
              onSlideDragOver={state.handleSlideDragOver}
              onSlideDragEnd={state.handleSlideDragEnd}
              onResetSlidesOrder={state.handleResetSlidesOrder}
              onRemoveSlide={state.handleRemoveSlide}
              bgFileName={state.bgFileName}
              onBackgroundUpload={state.handleBackgroundUpload}
              onClearBackground={state.handleClearBackground}
              onEditScheduleItem={state.handleOpenEditScheduleItemModal}
            />
          )}

          {state.appMode === 'bible' && (
            <BibleExplorer
              selectedBook={state.selectedBook}
              selectedChapter={state.selectedChapter}
              selectedVerse={state.selectedVerse}
              bibleTranslation={state.bibleTranslation}
              selectedTranslations={state.selectedTranslations}
              verses={state.verses}
              loading={state.loading}
              totalChapters={state.totalChapters}
              onSelectBook={(id) => {
                state.setSelectedBook(id);
                state.setSelectedChapter(1);
                state.setSelectedVerse(1);
              }}
              onSelectChapter={(c) => {
                state.setSelectedChapter(c);
                state.setSelectedVerse(1);
              }}
              onSelectVerse={(v) => state.setSelectedVerse(v)}
              onSelectTranslation={state.setBibleTranslation}
              onToggleTranslation={state.toggleBibleTranslation}
              onAddToSchedule={state.handleAddScriptureToSchedule}
            />
          )}

          {state.appMode === 'lyrics' && (
            <SongLibrary
              filteredSongs={state.filteredSongs}
              songSearchQuery={state.songSearchQuery}
              setSongSearchQuery={state.setSongSearchQuery}
              selectedLetter={state.selectedLetter}
              setSelectedLetter={state.setSelectedLetter}
              activeLibrarySongId={state.activeLibrarySongId}
              onSelectSong={(id) => {
                state.setActiveLibrarySongId(id);
                state.selectSlideIndex(0);
              }}
              onAddSongToSchedule={state.handleAddSongToSchedule}
              onOpenNewSongModal={state.handleOpenNewSongModal}
              onEditSong={state.handleOpenEditSongModal}
              onDeleteSong={state.handleDeleteSong}
              activeLibrarySong={state.activeLibrarySong}
              activeSlides={state.activeSlides}
              selectedSlideIndex={state.selectedSlideIndex}
              onSelectSlideIndex={state.selectSlideIndex}
            />
          )}
        </div>

        {/* Right Column: Live Presentation Screen Monitor (7 Columns) */}
        <LiveScreenMonitor
          isTextHidden={state.isTextHidden}
          globalBgConfig={state.globalBgConfig}
          textAnimConfig={state.textAnimConfig}
          onUpdateTextAnimConfig={state.handleUpdateTextAnimConfig}
          localBgUrl={state.localBgUrl}
          localBgType={state.localBgType}
          loading={state.loading}
          appMode={state.appMode}
          isScheduleMedia={state.isScheduleMedia}
          currentActiveMediaUrl={state.currentActiveMediaUrl}
          currentActiveMediaType={state.currentActiveMediaType}
          currentActiveMediaTitle={state.currentActiveMediaTitle}
          selectedSlideIndex={state.selectedSlideIndex}
          activeScheduleItem={state.activeScheduleItem}
          isCountdownRunning={state.isCountdownRunning}
          countdownLeft={state.countdownLeft}
          onStartTimer={() => state.setIsCountdownRunning(true)}
          onPauseTimer={() => state.setIsCountdownRunning(false)}
          onResetTimer={(secs) => {
            state.setIsCountdownRunning(false);
            state.setCountdownLeft(secs);
          }}
          onAdjustLiveTime={(delta) => state.setCountdownLeft(prev => Math.max(0, prev + delta))}
          currentPreviewText={state.currentPreviewText}
          currentPreviewReference={state.currentPreviewReference}
          onPrev={state.handlePrev}
          onNext={state.handleNext}
          previewContainerRef={state.previewContainerRef}
          isVideoPlaying={state.isVideoPlaying}
          isVideoMuted={state.isVideoMuted}
          isDisplayConnected={state.isDisplayConnected}
          onToggleMediaPlayPause={state.toggleMediaPlayPause}
          onToggleMediaMute={state.toggleMediaMute}
        />
      </main>

      {/* Interactive Modals & Toast */}
      <BackgroundStudioModal
        isOpen={state.isBgStudioModalOpen}
        onClose={() => state.setIsBgStudioModalOpen(false)}
        config={state.globalBgConfig}
        onUpdateConfig={state.updateGlobalBgConfig}
        onAddSlideshowImages={state.handleAddSlideshowImages}
        onRemoveSlideshowImage={state.handleRemoveSlideshowImage}
        onClearSlideshowImages={state.handleClearSlideshowImages}
        onUploadVideoBackground={state.handleUploadVideoBackground}
        onClearBackground={state.handleClearBackground}
      />

      <AddItemModal
        isOpen={state.isAddItemModalOpen}
        onClose={() => state.setIsAddItemModalOpen(false)}
        addItemType={state.addItemType}
        setAddItemType={state.setAddItemType}
        newItemData={state.newItemData}
        setNewItemData={state.setNewItemData}
        modalSongSearch={state.modalSongSearch}
        setModalSongSearch={state.setModalSongSearch}
        modalFilteredSongs={state.modalFilteredSongs}
        modalVerses={state.modalVerses}
        loadingModalVerses={state.loadingModalVerses}
        chapterInput={state.chapterInput}
        setChapterInput={state.setChapterInput}
        verseInput={state.verseInput}
        setVerseInput={state.setVerseInput}
        timerMinInput={state.timerMinInput}
        setTimerMinInput={state.setTimerMinInput}
        timerSecInput={state.timerSecInput}
        setTimerSecInput={state.setTimerSecInput}
        updateCountdownTime={state.updateCountdownTime}
        onAddItemToSchedule={state.handleAddItemToSchedule}
        onOpenNewSongModal={state.handleOpenNewSongModal}
      />

      <SongModal
        isOpen={state.isSongModalOpen}
        onClose={() => state.setIsSongModalOpen(false)}
        editingSongId={state.editingSongId}
        songFormData={state.songFormData}
        setSongFormData={state.setSongFormData}
        onSaveSong={state.handleSaveSong}
      />

      <EditScheduleItemModal
        isOpen={state.isEditScheduleItemModalOpen}
        onClose={() => state.setIsEditScheduleItemModalOpen(false)}
        item={state.editingScheduleItem}
        allSongs={state.allSongs}
        onSave={state.handleSaveScheduleItem}
      />

      <ServicePlansModal
        isOpen={state.isServicePlansModalOpen}
        onClose={state.handleCloseServicePlansModal}
        savedPlans={state.savedPlans}
        currentScheduleItems={state.scheduleItems}
        onSaveCurrentPlan={state.handleSaveCurrentServicePlan}
        onLoadPlan={state.handleLoadServicePlan}
        onDuplicatePlan={state.handleDuplicateServicePlan}
        onDeletePlan={state.handleDeleteServicePlan}
        onExportPlan={state.handleExportServicePlan}
        onImportPlan={state.handleImportServicePlan}
      />

      <TickerStudioModal
        isOpen={state.isTickerModalOpen}
        onClose={() => state.setIsTickerModalOpen(false)}
        tickerConfig={state.tickerConfig}
        onUpdateTickerText={state.handleUpdateTickerText}
        onUpdateTickerBadge={state.handleUpdateTickerBadge}
        onToggleTickerBadge={state.handleToggleTickerBadge}
        onUpdateTickerTheme={state.handleUpdateTickerTheme}
        onUpdateTickerPosition={state.handleUpdateTickerPosition}
        onUpdateTickerSpeed={state.handleUpdateTickerSpeed}
        onUpdateTickerFontSize={state.handleUpdateTickerFontSize}
        onApplyTickerPreset={state.handleApplyTickerPreset}
        onToggleTicker={state.handleToggleTicker}
      />

      <ConfirmModal
        config={state.confirmModalConfig}
        onClose={state.closeConfirmModal}
      />

      <Toast message={state.toastMessage} />
    </div>
  );
}
