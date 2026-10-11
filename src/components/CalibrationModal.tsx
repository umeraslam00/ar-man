import React, { useState } from 'react';
import { STANDARD_REFERENCES } from '../utils/math';
import { CalibrationData, CalibrationReference } from '../types/measurement';
import { X, Check, Target, Info, CreditCard, FileText, Banknote, Coins, Ruler } from 'lucide-react';
import { sound } from '../utils/audio';

interface CalibrationModalProps {
  currentPixelsPerCm: number;
  isOpen: boolean;
  onClose: () => void;
  onSaveCalibration: (data: CalibrationData) => void;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  currentPixelsPerCm,
  isOpen,
  onClose,
  onSaveCalibration,
}) => {
  const [selectedRef, setSelectedRef] = useState<CalibrationReference>(STANDARD_REFERENCES[0]);
  const [customLengthCm, setCustomLengthCm] = useState<number>(10.0);
  const [pixelsPerCm, setPixelsPerCm] = useState<number>(currentPixelsPerCm || 10.0);
  const [distanceMeters, setDistanceMeters] = useState<number>(1.2);
  const [deviceHeightMeters, setDeviceHeightMeters] = useState<number>(1.4);

  if (!isOpen) return null;

  const getIcon = (name: string) => {
    switch (name) {
      case 'CreditCard': return <CreditCard className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Banknote': return <Banknote className="w-5 h-5" />;
      case 'Coins': return <Coins className="w-5 h-5" />;
      default: return <Ruler className="w-5 h-5" />;
    }
  };

  const handleSave = () => {
    sound.playPinLock();
    const realSize = selectedRef.id === 'custom' ? customLengthCm : selectedRef.realWidthCm;
    onSaveCalibration({
      referenceId: selectedRef.id,
      realSizeCm: realSize,
      pixelsPerCm,
      cameraDistanceMeters: distanceMeters,
      deviceHeightMeters,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 text-neutral-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-100">Camera & Scale Calibration</h3>
              <p className="text-xs text-neutral-400">
                Calibrate optical scale factor for millimeter measurement precision
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reference Object Selection */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block mb-2">
            1. Select Known Reference Object in Frame
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {STANDARD_REFERENCES.map((ref) => {
              const isSelected = selectedRef.id === ref.id;
              return (
                <button
                  key={ref.id}
                  onClick={() => setSelectedRef(ref)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={isSelected ? 'text-amber-400' : 'text-neutral-400'}>
                      {getIcon(ref.iconName)}
                    </span>
                    <span className="text-[11px] font-mono-num font-bold">
                      {ref.id === 'custom' ? `${customLengthCm} cm` : `${ref.realWidthCm} cm`}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-xs leading-snug">{ref.name}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">
                      {ref.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedRef.id === 'custom' && (
            <div className="mt-3 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
              <label className="text-xs text-neutral-400 block mb-1">Custom Reference Length (cm):</label>
              <input
                type="number"
                min="1"
                max="500"
                step="0.1"
                value={customLengthCm}
                onChange={(e) => setCustomLengthCm(Number(e.target.value) || 10)}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm font-mono-num text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Optical Ratio Adjustment Slider */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              2. Optical Scale Multiplier
            </label>
            <span className="font-mono-num text-xs text-amber-400 font-bold">
              {pixelsPerCm.toFixed(1)} px / cm
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="35"
            step="0.1"
            value={pixelsPerCm}
            onChange={(e) => setPixelsPerCm(Number(e.target.value))}
            className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
          />

          <div className="flex justify-between text-[10px] text-neutral-500 font-mono-num mt-1">
            <span>Far Distance (Low Px)</span>
            <span>Close Up (High Px)</span>
          </div>
        </div>

        {/* Distance from target */}
        <div className="mt-5 p-3.5 bg-neutral-950/60 border border-neutral-800/80 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-300 font-medium">Estimated Target Distance</span>
            <span className="text-xs font-mono-num text-amber-400 font-bold">
              {distanceMeters.toFixed(1)} m ({((distanceMeters * 3.28084)).toFixed(1)} ft)
            </span>
          </div>
          <input
            type="range"
            min="0.3"
            max="6"
            step="0.1"
            value={distanceMeters}
            onChange={(e) => setDistanceMeters(Number(e.target.value))}
            className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer h-2"
          />
          <div className="flex items-start gap-2 mt-3 text-[11px] text-neutral-400">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Tip: Aiming straight at a surface at ~1 meter distance yields the highest precision.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            Save & Apply Scale
          </button>
        </div>
      </div>
    </div>
  );
};
