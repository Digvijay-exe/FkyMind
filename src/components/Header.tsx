import React, { useState } from 'react';
import { ModelType } from '../types';
import { Play, Pause, RotateCcw, StepForward, Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedModel: ModelType;
  setSelectedModel: (m: ModelType) => void;
  isRunning: boolean;
  toggleRunning: () => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  fps: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  setSelectedModel,
  isRunning,
  toggleRunning,
  stepSimulation,
  resetSimulation,
}) => {
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());

  const navTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'minecraft', label: 'World Monitor' },
    { id: 'brain', label: 'Connectome Brain' },
    { id: 'curves', label: 'Learning Curves' },
    { id: 'comparison', label: 'Model Arena' },
    { id: 'lab', label: 'Experiment Lab' },
    { id: 'notes', label: 'Research Codex' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1b1917] border-b-4 border-[#0c0b0a] shadow-xl">
      {/* Top 2px Minecraft highlight */}
      <div className="h-1 w-full bg-[#3c3935]" />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Zone 1: Single text element wordmark in Minecraft Pixel Font */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Glowing Redstone Block Icon */}
            <div className="h-4 w-4 bg-[#ff2222] border border-[#ff8888] shadow-[0_0_8px_#ff0000] rotate-45 transform" />
            <span className="font-pixel text-sm sm:text-base font-bold text-[#ffff55] mc-shadow-gold tracking-wider">
              FLYMIND
            </span>
          </div>
          <span className="hidden text-xs text-[#555555] sm:inline font-pixel" aria-hidden="true">·</span>
          <span className="hidden font-pixel text-[10px] text-[#55ffff] mc-shadow-aqua lg:inline">
            v783 SNN
          </span>
        </div>

        {/* Zone 2: Navigation Links styled with Minecraft Button feel */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1.5 text-xs font-pixel transition-all whitespace-nowrap border-2 ${
                  isActive
                    ? 'bg-[#3b3834] text-[#ffff55] border-[#55ffff] shadow-[inset_0_0_4px_#55ffff] mc-shadow-gold'
                    : 'bg-[#2a2825] text-[#b0a99f] border-[#3f3c38] hover:bg-[#34312d] hover:text-[#ffffff] hover:border-[#605a54] mc-shadow'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions and Model Selector */}
        <div className="flex items-center gap-2">
          {/* Model Selector styled as hotbar selection */}
          <div className="flex items-center bg-[#151413] border-2 border-[#33302c] p-0.5">
            {(['flymind', 'generic_snn', 'ann', 'random'] as ModelType[]).map(m => {
              const isSelected = selectedModel === m;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={`px-2 py-1 text-[10px] font-pixel transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#55ff55]/20 text-[#55ff55] border-2 border-[#55ff55] mc-shadow-green font-bold'
                      : 'text-[#888888] hover:text-[#cccccc] border-2 border-transparent'
                  }`}
                  title={`Switch active agent to ${m.toUpperCase()}`}
                >
                  {m === 'flymind' ? 'FLY' : m === 'generic_snn' ? 'SNN' : m === 'ann' ? 'ANN' : 'RND'}
                </button>
              );
            })}
          </div>

          {/* Play/Pause Button - Minecraft Emerald or Redstone button */}
          <button
            onClick={toggleRunning}
            className={`mc-button flex items-center gap-1.5 px-3 py-1.5 text-xs font-pixel whitespace-nowrap ${
              isRunning ? 'mc-button-red' : 'mc-button-green'
            }`}
            title={isRunning ? 'Pause simulation tick loop' : 'Start real-time simulation tick loop'}
          >
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isRunning ? 'PAUSE' : 'PLAY'}</span>
          </button>

          {/* Step Tick Button */}
          <button
            onClick={stepSimulation}
            disabled={isRunning}
            className="mc-button hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-pixel text-[#cccccc] disabled:opacity-40"
            title="Step single simulation tick (1/20th second)"
          >
            <StepForward className="h-3.5 w-3.5" />
            <span>TICK</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={() => {
              const next = !soundActive;
              setSoundActive(next);
              setSoundEnabled(next);
            }}
            className={`mc-button p-1.5 ${soundActive ? 'text-[#55ff55]' : 'text-[#888888]'}`}
            title={soundActive ? 'Minecraft Button Click Audio ON (Click to Mute)' : 'Audio Muted (Click to Enable)'}
          >
            {soundActive ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Reset Map Button */}
          <button
            onClick={resetSimulation}
            className="mc-button p-1.5 text-[#aaaaaa] hover:text-white"
            title="Generate new world arena seed"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden overflow-x-auto border-t-2 border-[#121110] bg-[#151413] px-2 py-1.5 gap-1 scrollbar-none">
        {navTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2 py-1 text-[9px] font-pixel whitespace-nowrap border ${
              activeTab === tab.id
                ? 'bg-[#3b3834] text-[#ffff55] border-[#55ffff]'
                : 'bg-[#22201e] text-[#888888] border-[#33302c]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
