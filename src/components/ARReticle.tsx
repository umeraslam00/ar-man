import React from 'react';
import { Crosshair, Lock } from 'lucide-react';

interface ARReticleProps {
  x: number; // Viewport X (e.g. center)
  y: number; // Viewport Y
  isLocked?: boolean;
  activeLabel?: string;
  showGuides?: boolean;
  containerWidth: number;
  containerHeight: number;
}

export const ARReticle: React.FC<ARReticleProps> = ({
  x,
  y,
  isLocked = false,
  activeLabel,
  showGuides = true,
  containerWidth,
  containerHeight,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* Laser Alignment Crossbeams across full viewport */}
      {showGuides && (
        <>
          <div
            className="absolute left-0 right-0 h-[1px] bg-amber-400/30 transition-all duration-75"
            style={{ top: `${y}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          </div>
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-amber-400/30 transition-all duration-75"
            style={{ left: `${x}px` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />
          </div>
        </>
      )}

      {/* Reticle Head */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-75"
        style={{ left: `${x}px`, top: `${y}px` }}
      >
        {/* Outer targeting brackets */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Circular dashed targeting boundary */}
          <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/60 animate-[spin_16s_linear_infinite]" />

          {/* Precision Corner Brackets */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

          {/* Center glowing laser dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] ring-2 ring-amber-200/50" />

          {/* Pin target indicator icon */}
          {isLocked && (
            <div className="absolute -top-6 bg-amber-500 text-neutral-950 p-1 rounded-full shadow-lg">
              <Lock className="w-3 h-3 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Real-time Reticle Floating Pill Tag */}
        {activeLabel && (
          <div className="absolute top-10 whitespace-nowrap bg-neutral-900/90 text-amber-300 backdrop-blur-md px-2.5 py-1 rounded border border-amber-500/40 font-mono-num text-xs font-semibold shadow-lg">
            {activeLabel}
          </div>
        )}
      </div>
    </div>
  );
};
