import React, { useState } from 'react';
import { MeasurementRecord } from '../types/measurement';
import {
  X,
  Trash2,
  Copy,
  Download,
  Share2,
  Clock,
  FolderOpen,
  Check,
  Tag,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface SavedMeasurementsDrawerProps {
  isOpen: boolean;
  records: MeasurementRecord[];
  onClose: () => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const SavedMeasurementsDrawer: React.FC<SavedMeasurementsDrawerProps> = ({
  isOpen,
  records,
  onClose,
  onDeleteRecord,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (r: MeasurementRecord) => {
    sound.playPinLock();
    const text = `${r.title}: ${r.values.primaryFormatted} (${r.mode} mode) - Recorded on ${new Date(
      r.timestamp
    ).toLocaleString()}${r.notes ? `\nNotes: ${r.notes}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    sound.playPinLock();
    const rows = [
      ['ID', 'Title', 'Mode', 'Primary Value', 'Formatted', 'Date', 'Notes'],
      ...records.map((r) => [
        r.id,
        `"${r.title}"`,
        r.mode,
        r.values.primaryValue,
        `"${r.values.primaryFormatted}"`,
        `"${new Date(r.timestamp).toISOString()}"`,
        `"${r.notes || ''}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AR_Ruler_Measurements_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-neutral-900 border-l border-neutral-800 h-full flex flex-col text-neutral-100 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-100">Measurement Notebook</h3>
              <p className="text-[11px] text-neutral-400">
                {records.length} saved project measurement{records.length === 1 ? '' : 's'}
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

        {/* Action bar */}
        {records.length > 0 && (
          <div className="px-4 py-2 bg-neutral-950/40 border-b border-neutral-800 flex items-center justify-between text-xs">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-neutral-300 hover:text-amber-400 font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Clear all recorded measurements?')) {
                  onClearAll();
                }
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* List of records */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {records.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
                <FolderOpen className="w-6 h-6" />
              </div>
              <p className="font-semibold text-neutral-300 text-sm">No saved measurements yet</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                Take measurements using the camera or AI Vision tool, then tap "Save" to archive them here.
              </p>
            </div>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="p-3.5 bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 rounded-xl transition-all shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                      <span>{r.title}</span>
                      <span className="text-[10px] font-mono-num px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 font-medium">
                        {r.mode}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(r)}
                      title="Copy to clipboard"
                      className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-amber-400"
                    >
                      {copiedId === r.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      title="Delete record"
                      className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Metric Badge */}
                <div className="mt-3 flex items-baseline justify-between bg-neutral-900/90 border border-amber-500/20 px-3 py-2 rounded-lg">
                  <span className="text-xl font-bold font-mono-num text-amber-300">
                    {r.values.primaryFormatted}
                  </span>
                  {r.values.secondaryFormatted && (
                    <span className="text-xs font-mono-num text-neutral-400">
                      {r.values.secondaryFormatted}
                    </span>
                  )}
                </div>

                {/* Subvalues (e.g. Area, perimeter, width, height) */}
                {r.values.subValues && r.values.subValues.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-mono-num">
                    {r.values.subValues.map((sv, idx) => (
                      <div key={idx} className="bg-neutral-900/50 px-2 py-1 rounded text-neutral-400 flex justify-between">
                        <span>{sv.label}:</span>
                        <span className="text-neutral-200 font-semibold">{sv.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Thumbnail Preview if captured */}
                {r.thumbnail && (
                  <div className="mt-2.5 rounded-lg overflow-hidden border border-neutral-800 max-h-28">
                    <img src={r.thumbnail} alt={r.title} className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
