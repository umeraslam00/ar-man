import React from 'react';
import {
  MeasureMode,
  MeasureUnit,
} from '../types/measurement';
import {
  Sparkles,
  Zap,
  ZapOff,
  SwitchCamera,
  Target,
  FolderOpen,
  Volume2,
  VolumeX,
  Compass,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface HeaderHUDProps {
  mode: MeasureMode;
  onSelectMode: (mode: MeasureMode) => void;
  unit: MeasureUnit;
  onSelectUnit: (unit: MeasureUnit) => void;
  isTorchOn: boolean;
  hasTorch: boolean;
  onToggleTorch: () => void;
  onSwitchCamera: () => void;
  onOpenCalibration: () => void;
  onOpenNotebook: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  recordsCount: number;
  pitch: number;
  roll: number;
  isLevel: boolean;
  isCameraActive: boolean;
  onToggleSceneSelector: () => void;
  activeSceneName?: string;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  mode,
  onSelectMode,
  unit,
  onSelectUnit,
  isTorchOn,
  hasTorch,
  onToggleTorch,
  onSwitchCamera,
  onOpenCalibration,
  onOpenNotebook,
  isSoundMuted,
  onToggleSound,
  recordsCount,
  pitch,
  roll,
  isLevel,
  isCameraActive,
  onToggleSceneSelector,
  activeSceneName,
}) => {
  const modes: { id: MeasureMode; label: string; icon: string }[] = [
    { id: 'TAPE', label: 'Tape Line', icon: '📏' },
    { id: 'AREA', label: '2D Area', icon: '📐' },
    { id: 'HEIGHT', label: 'Height', icon: '↕️' },
    { id: 'ANGLE', label: 'Angle', icon: '∡' },
    { id: 'CIRCLE', label: 'Circle', icon: '⭕' },
    { id: 'CALIPER', label: 'Screen Ruler', icon: '🎛️' },
    { id: 'AI_VISION', label: 'AI Vision', icon: '✨' },
  ];

  return (
    <div className="absolute top-0 inset-x-0 z-30 pointer-events-none flex flex-col p-3 md:p-4 gap-2.5">
      {/* Top Glass Status Bar */}
      <div className="pointer-events-auto flex items-center justify-between bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-3.5 py-2.5 shadow-2xl">
        {/* Brand & Active Scene Tag */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-tight text-neutral-100">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400">AR</span>
            <span className="text-neutral-200">RULER</span>
          </div>

          {/* Camera / Mock Scene Pill */}
          <button
            onClick={onToggleSceneSelector}
            className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span className="truncate max-w-[120px]">
              {isCameraActive ? 'Live Camera' : activeSceneName || 'Mock Room'}
            </span>
          </button>
        </div>

        {/* Center: Digital Spirit Level & Pitch */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-num font-semibold transition-all ${
              isLevel
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${isLevel ? 'text-emerald-400' : 'text-neutral-500'}`} />
            <span>{pitch >= 0 ? `+${pitch.toFixed(1)}°` : `${pitch.toFixed(1)}°`}</span>
            {isLevel && <span className="text-[9px] uppercase font-bold text-emerald-400">LEVEL</span>}
          </div>

          {/* Unit Toggle Segmented Control */}
          <div className="flex items-center p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono-num">
            {(['cm', 'in', 'm', 'ft'] as MeasureUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => onSelectUnit(u)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  unit === u
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools Controls */}
        <div className="flex items-center gap-1">
          {/* Torch toggle if supported */}
          {hasTorch && (
            <button
              onClick={onToggleTorch}
              className={`p-2 rounded-xl transition-all ${
                isTorchOn
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
              }`}
              title="Toggle Flashlight Torch"
            >
              {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          {/* Flip camera */}
          <button
            onClick={onSwitchCamera}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl transition-all"
            title="Flip Camera (Front/Back)"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl transition-all"
            title={isSoundMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Calibration modal trigger */}
          <button
            onClick={onOpenCalibration}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 text-amber-400 border border-neutral-800 rounded-xl transition-all"
            title="Optical Calibration"
          >
            <Target className="w-4 h-4" />
          </button>

          {/* Notebook drawer */}
          <button
            onClick={onOpenNotebook}
            className="relative p-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 rounded-xl transition-all"
            title="Saved Measurements"
          >
            <FolderOpen className="w-4 h-4" />
            {recordsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-neutral-950 font-bold rounded-full text-[10px] flex items-center justify-center font-mono-num shadow-sm">
                {recordsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mode Selector Pill Strip */}
      <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
        {modes.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-md ${
                isActive
                  ? 'bg-amber-400 text-neutral-950 shadow-amber-400/20 font-bold ring-2 ring-amber-300/60 scale-105'
                  : 'bg-neutral-950/80 hover:bg-neutral-900 text-neutral-300 border border-neutral-800/80 backdrop-blur-sm'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
              {m.id === 'AI_VISION' && (
                <Sparkles className={`w-3 h-3 ${isActive ? 'text-neutral-950' : 'text-amber-400'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
