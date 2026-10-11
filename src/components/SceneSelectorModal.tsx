import React, { useRef } from 'react';
import { DEMO_SCENES, DemoScene } from '../data/mockScenes';
import { Camera, Image as ImageIcon, Upload, X, Check, Laptop, Home, DoorOpen } from 'lucide-react';
import { sound } from '../utils/audio';

interface SceneSelectorModalProps {
  isOpen: boolean;
  isCameraActive: boolean;
  selectedDemoSceneId: string | null;
  onSelectCamera: () => void;
  onSelectDemoScene: (scene: DemoScene) => void;
  onUploadCustomImage: (dataUrl: string) => void;
  onClose: () => void;
}

export const SceneSelectorModal: React.FC<SceneSelectorModalProps> = ({
  isOpen,
  isCameraActive,
  selectedDemoSceneId,
  onSelectCamera,
  onSelectDemoScene,
  onUploadCustomImage,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        sound.playPinLock();
        onUploadCustomImage(reader.result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="font-bold text-base text-neutral-100">Camera & Scene Source</h3>
            <p className="text-xs text-neutral-400">
              Select live environment camera or choose a room scene to measure
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Camera Option */}
        <div className="mt-4">
          <button
            onClick={() => {
              sound.playPinLock();
              onSelectCamera();
              onClose();
            }}
            className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              isCameraActive
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neutral-800 rounded-lg text-amber-400">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Live Device Camera</div>
                <div className="text-xs text-neutral-400">Rear Environment WebRTC stream</div>
              </div>
            </div>
            {isCameraActive && <Check className="w-5 h-5 text-amber-400" />}
          </button>
        </div>

        {/* Built-in AR Test Environments */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
            Demo AR Scenes (With Known Object Dimensions)
          </label>
          <div className="space-y-2">
            {DEMO_SCENES.map((scene) => {
              const isSelected = !isCameraActive && selectedDemoSceneId === scene.id;
              return (
                <button
                  key={scene.id}
                  onClick={() => {
                    sound.playPinLock();
                    onSelectDemoScene(scene);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 border border-neutral-700 flex-shrink-0">
                      <img src={scene.imageUrl} alt={scene.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs leading-snug">{scene.name}</div>
                      <div className="text-[10px] text-neutral-400">{scene.description}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upload Custom Room Photo */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-amber-400" />
            <span>Upload Photo from Phone / Computer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
