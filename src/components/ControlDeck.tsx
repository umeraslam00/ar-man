import React from 'react';
import {
  RotateCcw,
  Trash2,
  Camera,
  Sparkles,
  Plus,
  Save,
  Check,
} from 'lucide-react';
import { MeasureMode, MeasureUnit } from '../types/measurement';

interface ControlDeckProps {
  mode: MeasureMode;
  unit: MeasureUnit;
  pointsCount: number;
  currentRealtimeDistance: string;
  totalMeasuredFormatted: string;
  subMetricFormatted?: string;
  hintText: string;
  onAddPoint: () => void;
  onUndoPoint: () => void;
  onClearPoints: () => void;
  onSaveSnapshot: () => void;
  onTriggerAIMeasure: () => void;
  canSave: boolean;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  mode,
  unit,
  pointsCount,
  currentRealtimeDistance,
  totalMeasuredFormatted,
  subMetricFormatted,
  hintText,
  onAddPoint,
  onUndoPoint,
  onClearPoints,
  onSaveSnapshot,
  onTriggerAIMeasure,
  canSave,
}) => {
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none flex flex-col items-center pb-6 px-4 gap-3">
      {/* Real-time Measurement HUD Card Floating above buttons */}
      <div className="pointer-events-auto bg-neutral-950/85 backdrop-blur-md border border-neutral-800/90 rounded-2xl px-5 py-3 shadow-2xl flex flex-col items-center max-w-sm w-full transition-all">
        {/* Dynamic Measurement Readout */}
        <div className="flex items-baseline gap-2 text-center">
          <span className="text-3xl font-extrabold font-mono-num text-amber-400 tracking-tight">
            {totalMeasuredFormatted || '0.0 ' + unit}
          </span>
          {subMetricFormatted && (
            <span className="text-xs font-mono-num text-neutral-400 font-medium">
              ({subMetricFormatted})
            </span>
          )}
        </div>

        {/* Live reticle delta if currently pulling tape */}
        {pointsCount > 0 && currentRealtimeDistance && (
          <div className="text-[11px] font-mono-num text-amber-300/80 mt-0.5">
            Segment: +{currentRealtimeDistance}
          </div>
        )}

        {/* Guide / Instructions Step */}
        <div className="text-[11px] text-neutral-400 mt-1 font-medium text-center">
          {hintText}
        </div>
      </div>

      {/* Main Buttons Deck */}
      <div className="pointer-events-auto flex items-center justify-center gap-4 sm:gap-6 w-full max-w-md">
        {/* Undo Point */}
        <button
          onClick={onUndoPoint}
          disabled={pointsCount === 0}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
            pointsCount > 0
              ? 'bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border-neutral-700 active:scale-95 shadow-lg'
              : 'bg-neutral-950/50 text-neutral-600 border-neutral-900 cursor-not-allowed opacity-50'
          }`}
          title="Undo Last Point"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Clear All Points */}
        <button
          onClick={onClearPoints}
          disabled={pointsCount === 0}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
            pointsCount > 0
              ? 'bg-neutral-900/90 hover:bg-neutral-800 text-red-400 border-neutral-700 active:scale-95 shadow-lg'
              : 'bg-neutral-950/50 text-neutral-600 border-neutral-900 cursor-not-allowed opacity-50'
          }`}
          title="Clear Measurement"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        {/* Giant Central Shutter / Pin Drop Button */}
        <button
          onClick={onAddPoint}
          className="relative group w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all active:scale-90"
        >
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/80 group-hover:border-amber-300 group-hover:scale-105 transition-all" />

          {/* Inner metallic button face */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-neutral-950 flex flex-col items-center justify-center shadow-inner group-hover:from-amber-300 group-hover:to-amber-500">
            <Plus className="w-7 h-7 stroke-[3] transition-transform group-hover:rotate-90 duration-200" />
            <span className="text-[9px] font-extrabold uppercase tracking-tight -mt-0.5">
              PIN
            </span>
          </div>
        </button>

        {/* AI Vision Measure Button */}
        <button
          onClick={onTriggerAIMeasure}
          className="w-12 h-12 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="AI Computer Vision Measure (Gemini)"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* Snapshot & Save Record */}
        <button
          onClick={onSaveSnapshot}
          disabled={!canSave}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${
            canSave
              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 border-amber-400 active:scale-95 shadow-lg shadow-amber-500/20 font-bold'
              : 'bg-neutral-950/50 text-neutral-600 border-neutral-900 cursor-not-allowed opacity-50'
          }`}
          title="Save Measurement to Notebook"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
