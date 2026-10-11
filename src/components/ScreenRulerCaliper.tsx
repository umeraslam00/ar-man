import React, { useState, useRef } from 'react';
import { MeasureUnit } from '../types/measurement';
import { formatMeasurement } from '../utils/math';
import { sound } from '../utils/audio';

interface ScreenRulerCaliperProps {
  unit: MeasureUnit;
  onClose: () => void;
}

export const ScreenRulerCaliper: React.FC<ScreenRulerCaliperProps> = ({
  unit,
  onClose,
}) => {
  // Typical mobile/desktop screen display PPI ~ 96 - 160 px/inch
  const [ppi, setPpi] = useState<number>(110);
  const [sliderPosPx, setSliderPosPx] = useState<number>(240);
  const isDragging = useRef(false);

  // 1 inch = 2.54 cm
  const pxPerCm = ppi / 2.54;
  const currentLengthCm = sliderPosPx / pxPerCm;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const container = document.getElementById('caliper-ruler-track');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const newX = Math.max(10, Math.min(rect.width - 20, e.clientX - rect.left));
    setSliderPosPx(newX);
    sound.playTapeRatchet(0.7);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    sound.playPinLock();
  };

  return (
    <div className="absolute inset-0 z-30 bg-neutral-950/95 backdrop-blur-md flex flex-col p-4 text-neutral-100">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <span>Direct 1:1 Physical Screen Caliper</span>
          </h2>
          <p className="text-xs text-neutral-400">
            Place small physical items (keys, coins, screws) directly on the screen
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
        >
          Close Caliper
        </button>
      </div>

      {/* Large Readout Card */}
      <div className="bg-neutral-900 border border-amber-500/30 rounded-xl p-4 flex flex-col items-center justify-center mb-6 shadow-inner">
        <span className="text-xs uppercase tracking-wider text-neutral-400 font-mono-num mb-1">
          Measured Distance
        </span>
        <div className="text-4xl font-extrabold text-amber-300 font-mono-num tracking-tight">
          {formatMeasurement(currentLengthCm, unit, true)}
        </div>
        <div className="text-xs text-neutral-500 font-mono-num mt-1">
          {(currentLengthCm * 10).toFixed(1)} mm · {(currentLengthCm / 2.54).toFixed(3)} in
        </div>
      </div>

      {/* Physical Caliper Track & Slider */}
      <div
        id="caliper-ruler-track"
        className="relative flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-center select-none"
      >
        {/* Fixed Jaw (Left Origin: 0) */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-amber-500/20 border-r-2 border-amber-400 z-10 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono-num font-bold text-amber-400 -rotate-90">
            0 mm
          </span>
        </div>

        {/* Ruler graduations (cm & inches) across length */}
        <div className="absolute inset-x-8 top-12 h-16 flex items-start overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, cm) => {
            const left = cm * pxPerCm;
            return (
              <React.Fragment key={cm}>
                {/* Major cm tick */}
                <div
                  className="absolute top-0 w-[2px] h-8 bg-neutral-200"
                  style={{ left: `${left}px` }}
                >
                  <span className="absolute top-9 -left-2 text-[10px] font-mono-num font-semibold text-neutral-300">
                    {cm}
                  </span>
                </div>
                {/* Half cm tick */}
                <div
                  className="absolute top-0 w-[1px] h-5 bg-neutral-500"
                  style={{ left: `${left + pxPerCm * 0.5}px` }}
                />
                {/* Millimeter ticks */}
                {Array.from({ length: 9 }).map((__, mm) => {
                  if (mm + 1 === 5) return null;
                  return (
                    <div
                      key={mm}
                      className="absolute top-0 w-[1px] h-3 bg-neutral-700"
                      style={{ left: `${left + (mm + 1) * (pxPerCm / 10)}px` }}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        {/* Object Placement Bed Zone */}
        <div
          className="absolute top-28 bottom-28 bg-amber-500/5 border-y border-dashed border-amber-500/30"
          style={{ left: '32px', width: `${sliderPosPx - 32}px` }}
        >
          <div className="w-full h-full flex items-center justify-center text-xs text-amber-400/50 font-mono-num">
            &lt; Place Object Here &gt;
          </div>
        </div>

        {/* Sliding Vernier Jaw */}
        <div
          className="absolute top-0 bottom-0 w-12 -ml-6 z-20 cursor-ew-resize touch-none flex flex-col items-center justify-center"
          style={{ left: `${sliderPosPx}px` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Vernier Jaw Line */}
          <div className="absolute inset-y-0 w-1 bg-amber-400 shadow-[0_0_10px_#f59e0b]" />

          {/* Touch Handle Handle Pill */}
          <div className="relative z-30 px-3 py-6 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-xl flex flex-col items-center gap-1">
            <span className="text-[10px] tracking-tighter font-mono-num">|||</span>
            <span className="text-[9px] uppercase font-mono-num">DRAG</span>
          </div>
        </div>
      </div>

      {/* Screen PPI Calibration Helper */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <span>Screen Display Scale: {ppi} PPI</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPpi((p) => Math.max(70, p - 5))}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 font-mono-num"
          >
            - Scale
          </button>
          <button
            onClick={() => setPpi((p) => Math.min(220, p + 5))}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300 font-mono-num"
          >
            + Scale
          </button>
          <button
            onClick={() => setPpi(110)}
            className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 text-[10px]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
