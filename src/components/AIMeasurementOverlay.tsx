import React from 'react';
import { Sparkles, Check, X, RefreshCw, Info } from 'lucide-react';
import { AIAnalysisResult, AIObjectDetection, Point2D, MeasureUnit } from '../types/measurement';
import { sound } from '../utils/audio';

interface AIMeasurementOverlayProps {
  isLoading: boolean;
  result: AIAnalysisResult | null;
  error: string | null;
  unit: MeasureUnit;
  containerWidth: number;
  containerHeight: number;
  onApplyRulerPoints: (points: Point2D[], title: string) => void;
  onClose: () => void;
  onRetry: () => void;
}

export const AIMeasurementOverlay: React.FC<AIMeasurementOverlayProps> = ({
  isLoading,
  result,
  error,
  unit,
  containerWidth,
  containerHeight,
  onApplyRulerPoints,
  onClose,
  onRetry,
}) => {
  if (!isLoading && !result && !error) return null;

  return (
    <div className="absolute inset-0 z-25 pointer-events-none flex flex-col justify-between p-4">
      {/* Scanner Loading State */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm pointer-events-auto flex flex-col items-center justify-center p-6 text-center">
          {/* Laser scanning line animation */}
          <div className="relative w-64 h-64 border-2 border-amber-400/40 rounded-2xl overflow-hidden mb-6 flex items-center justify-center">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_2s_infinite]" />
            <Sparkles className="w-12 h-12 text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
            <span>Gemini Vision Metrology</span>
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs mt-1">
            Analyzing scene depth, identifying optical references, and calculating object geometry...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="absolute top-20 left-4 right-4 bg-red-950/90 border border-red-500/50 backdrop-blur-md rounded-xl p-4 text-red-200 pointer-events-auto shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-bold text-sm text-red-300">AI Measurement Failed</h4>
              <p className="text-xs mt-1 text-red-200/80">{error}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-red-900/50 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={onRetry}
              className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Analysis
            </button>
          </div>
        </div>
      )}

      {/* Results Overlay */}
      {result && !isLoading && (
        <>
          {/* Top Info Bar */}
          <div className="pointer-events-auto bg-neutral-950/90 border border-amber-500/40 backdrop-blur-md rounded-xl p-3 shadow-xl max-w-xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    AI Detected {result.objects?.length || 0} Measurable Objects
                  </h4>
                  {result.detectedReferences && result.detectedReferences.length > 0 && (
                    <p className="text-[10px] text-neutral-400">
                      References used: {result.detectedReferences.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRetry}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200"
                  title="Rescan"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Render Bounding Boxes on Scene */}
          <div className="absolute inset-0 pointer-events-none">
            {result.objects?.map((obj, i) => {
              if (!obj.box2d) return null;
              const [ymin, xmin, ymax, xmax] = obj.box2d;

              // Scale 0-1000 to pixels
              const top = (ymin / 1000) * containerHeight;
              const left = (xmin / 1000) * containerWidth;
              const width = ((xmax - xmin) / 1000) * containerWidth;
              const height = ((ymax - ymin) / 1000) * containerHeight;

              const primaryDim = unit === 'cm' || unit === 'm'
                ? `${obj.dimensions.width_cm || '?'} × ${obj.dimensions.height_cm || '?'} cm`
                : `${obj.dimensions.width_in || '?'} × ${obj.dimensions.height_in || '?'} in`;

              return (
                <div
                  key={i}
                  className="absolute pointer-events-auto border-2 border-amber-400/80 bg-amber-400/10 rounded-lg group transition-all"
                  style={{ top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }}
                >
                  {/* Floating Dimension Tag */}
                  <div className="absolute -top-7 left-0 bg-neutral-900/95 border border-amber-500 text-amber-300 font-mono-num px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                    <span>{obj.label}:</span>
                    <span>{primaryDim}</span>
                  </div>

                  {/* Quick Add Pin Action */}
                  <button
                    onClick={() => {
                      sound.playPinLock();
                      if (obj.keyRulerPoints) {
                        const p1: Point2D = {
                          x: (obj.keyRulerPoints.start.x / 1000) * containerWidth,
                          y: (obj.keyRulerPoints.start.y / 1000) * containerHeight,
                          id: 'ai-p1-' + Date.now(),
                          label: 'A',
                        };
                        const p2: Point2D = {
                          x: (obj.keyRulerPoints.end.x / 1000) * containerWidth,
                          y: (obj.keyRulerPoints.end.y / 1000) * containerHeight,
                          id: 'ai-p2-' + Date.now(),
                          label: 'B',
                        };
                        onApplyRulerPoints([p1, p2], obj.label);
                      } else {
                        // Fallback to top-left & top-right of box
                        const p1: Point2D = { x: left, y: top + height / 2, id: 'ai-1', label: 'A' };
                        const p2: Point2D = { x: left + width, y: top + height / 2, id: 'ai-2', label: 'B' };
                        onApplyRulerPoints([p1, p2], obj.label);
                      }
                      onClose();
                    }}
                    className="absolute bottom-2 right-2 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-[10px] shadow-lg flex items-center gap-1 transition-transform active:scale-95"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Apply Tape</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Object Carousel Drawer */}
          <div className="pointer-events-auto bg-neutral-950/90 border border-neutral-800 backdrop-blur-md rounded-xl p-3 shadow-2xl max-w-xl mx-auto w-full max-h-48 overflow-y-auto">
            <span className="text-[10px] uppercase font-mono-num font-semibold text-neutral-400 mb-2 block">
              Detected Dimensions Breakdown
            </span>
            <div className="space-y-2">
              {result.objects?.map((obj, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-neutral-100">{obj.label}</span>
                    <p className="text-[11px] text-neutral-400 font-mono-num">
                      W: {obj.dimensions.width_cm ?? '-'}cm · H: {obj.dimensions.height_cm ?? '-'}cm
                      {obj.dimensions.depth_cm ? ` · D: ${obj.dimensions.depth_cm}cm` : ''}
                    </p>
                    {obj.details && (
                      <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">
                        {obj.details}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      sound.playPinLock();
                      if (obj.box2d) {
                        const [ymin, xmin, ymax, xmax] = obj.box2d;
                        const p1: Point2D = {
                          x: (xmin / 1000) * containerWidth,
                          y: ((ymin + ymax) / 2000) * containerHeight,
                          id: 'p1',
                          label: 'A',
                        };
                        const p2: Point2D = {
                          x: (xmax / 1000) * containerWidth,
                          y: ((ymin + ymax) / 2000) * containerHeight,
                          id: 'p2',
                          label: 'B',
                        };
                        onApplyRulerPoints([p1, p2], obj.label);
                        onClose();
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded font-semibold text-[11px]"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
