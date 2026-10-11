/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MeasureMode,
  MeasureUnit,
  Point2D,
  CalibrationData,
  MeasurementRecord,
  AIAnalysisResult,
} from './types/measurement';
import {
  pixelDistance,
  pixelsToCm,
  formatMeasurement,
  calculatePolygonAreaCm2,
  formatArea,
  calculateAngleDegrees,
  calculateCircle,
} from './utils/math';
import { sound } from './utils/audio';
import { useCamera } from './hooks/useCamera';
import { useSensors } from './hooks/useSensors';
import { DEMO_SCENES, DemoScene } from './data/mockScenes';

import { HeaderHUD } from './components/HeaderHUD';
import { ControlDeck } from './components/ControlDeck';
import { ARReticle } from './components/ARReticle';
import { ARTapeCanvas } from './components/ARTapeCanvas';
import { ScreenRulerCaliper } from './components/ScreenRulerCaliper';
import { AIMeasurementOverlay } from './components/AIMeasurementOverlay';
import { CalibrationModal } from './components/CalibrationModal';
import { SavedMeasurementsDrawer } from './components/SavedMeasurementsDrawer';
import { SceneSelectorModal } from './components/SceneSelectorModal';

export default function App() {
  // Viewport dimensions
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1280, height: 720 });

  // Camera & Device Orientation
  const camera = useCamera();
  const sensors = useSensors();

  // Mode and Units
  const [mode, setMode] = useState<MeasureMode>('TAPE');
  const [unit, setUnit] = useState<MeasureUnit>('cm');
  const [useFractions, setUseFractions] = useState<boolean>(true);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Active Scene (Camera vs Mock Scene vs Uploaded)
  const [selectedDemoScene, setSelectedDemoScene] = useState<DemoScene | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Optical Scale Calibration (pixels per cm)
  const [pixelsPerCm, setPixelsPerCm] = useState<number>(10.0);
  const [cameraDistanceMeters, setCameraDistanceMeters] = useState<number>(1.2);

  // Pinned Points
  const [points, setPoints] = useState<Point2D[]>([]);

  // Reticle Position (default viewport center, or touch/mouse dragged)
  const [reticlePos, setReticlePos] = useState({ x: 640, y: 360 });
  const [isReticleManual, setIsReticleManual] = useState<boolean>(false);

  // AI Vision Measurement State
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Saved History Records
  const [records, setRecords] = useState<MeasurementRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ar_ruler_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isSceneSelectorOpen, setIsSceneSelectorOpen] = useState(false);

  // Handle window resizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
        if (!isReticleManual) {
          setReticlePos({ x: clientWidth / 2, y: clientHeight / 2 });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isReticleManual]);

  // When switching demo scenes, update initial scale
  useEffect(() => {
    if (selectedDemoScene) {
      setPixelsPerCm(selectedDemoScene.defaultScalePxPerCm);
    }
  }, [selectedDemoScene]);

  // Sync sound mute state
  useEffect(() => {
    sound.setMuted(isSoundMuted);
  }, [isSoundMuted]);

  // Save records to local storage
  useEffect(() => {
    try {
      localStorage.setItem('ar_ruler_records', JSON.stringify(records));
    } catch {}
  }, [records]);

  // Move Reticle with pointer on camera container
  const handleContainerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0 || e.pointerType === 'touch') {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setReticlePos({ x, y });
      setIsReticleManual(true);
      sound.playTapeRatchet(0.5);
    }
  };

  // Add / Pin current reticle position
  const handleAddPoint = useCallback(() => {
    sound.playPinLock();

    const newPoint: Point2D = {
      x: reticlePos.x,
      y: reticlePos.y,
      id: `pt-${Date.now()}`,
      label: String.fromCharCode(65 + (points.length % 26)), // A, B, C...
      timestamp: Date.now(),
    };

    // Mode-specific point capping
    if (mode === 'HEIGHT' && points.length >= 2) {
      setPoints([newPoint]);
      return;
    }
    if (mode === 'ANGLE' && points.length >= 3) {
      setPoints([newPoint]);
      return;
    }
    if (mode === 'CIRCLE' && points.length >= 2) {
      setPoints([newPoint]);
      return;
    }

    setPoints((prev) => [...prev, newPoint]);
  }, [reticlePos, points.length, mode]);

  // Undo last point
  const handleUndoPoint = () => {
    sound.playPinLock();
    setPoints((prev) => prev.slice(0, -1));
  };

  // Clear all points
  const handleClearPoints = () => {
    sound.playPinLock();
    setPoints([]);
  };

  // Move existing pin
  const handleMovePoint = (index: number, updated: Point2D) => {
    setPoints((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
    sound.playTapeRatchet(0.4);
  };

  // Switch camera/demo scene
  const handleSelectCamera = () => {
    setSelectedDemoScene(null);
    setUploadedImageUrl(null);
    camera.startCamera('environment');
  };

  const handleSelectDemoScene = (scene: DemoScene) => {
    camera.stopStream();
    setSelectedDemoScene(scene);
    setUploadedImageUrl(null);
    setPoints([]);
  };

  const handleUploadCustomImage = (dataUrl: string) => {
    camera.stopStream();
    setSelectedDemoScene(null);
    setUploadedImageUrl(dataUrl);
    setPoints([]);
  };

  // Current distance from last pinned point to active reticle
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const activeDistancePx = lastPoint ? pixelDistance(lastPoint, { ...reticlePos, id: 'temp' }) : 0;
  const activeDistanceCm = pixelsToCm(activeDistancePx, pixelsPerCm);
  const currentRealtimeDistance = lastPoint ? formatMeasurement(activeDistanceCm, unit, useFractions) : '';

  // Mode-specific calculations & primary readouts
  let primaryFormatted = '0.0 ' + unit;
  let primaryNumeric = 0;
  let subMetricFormatted = '';
  let hintText = '';

  if (mode === 'TAPE') {
    if (points.length === 0) {
      hintText = 'Aim crosshair at starting point and tap PIN';
      primaryFormatted = '0.0 ' + unit;
    } else {
      let totalCm = 0;
      for (let i = 0; i < points.length - 1; i++) {
        totalCm += pixelsToCm(pixelDistance(points[i], points[i + 1]), pixelsPerCm);
      }
      totalCm += activeDistanceCm;
      primaryNumeric = totalCm;
      primaryFormatted = formatMeasurement(totalCm, unit, useFractions);
      subMetricFormatted = `${(totalCm / 2.54).toFixed(1)}" · ${points.length} pts`;
      hintText = points.length === 1 ? 'Move crosshair to end point and tap PIN' : 'Add more points for perimeter or save';
    }
  } else if (mode === 'AREA') {
    if (points.length < 3) {
      hintText = `Pin ${3 - points.length} more corner${3 - points.length === 1 ? '' : 's'} to compute area`;
      primaryFormatted = `${points.length}/3 corners`;
    } else {
      const areaCm2 = calculatePolygonAreaCm2(points, pixelsPerCm);
      primaryNumeric = areaCm2;
      primaryFormatted = formatArea(areaCm2, unit);

      // Perimeter
      let perimCm = 0;
      for (let i = 0; i < points.length; i++) {
        perimCm += pixelsToCm(pixelDistance(points[i], points[(i + 1) % points.length]), pixelsPerCm);
      }
      subMetricFormatted = `Perimeter: ${formatMeasurement(perimCm, unit, useFractions)}`;
      hintText = `Closed polygon (${points.length} corners) surface calculated`;
    }
  } else if (mode === 'HEIGHT') {
    if (points.length === 0) {
      hintText = 'Pin base / floor contact point';
      primaryFormatted = '0.0 ' + unit;
    } else if (points.length === 1) {
      hintText = 'Aim at top height mark and tap PIN';
      primaryNumeric = activeDistanceCm;
      primaryFormatted = formatMeasurement(activeDistanceCm, unit, useFractions);
      subMetricFormatted = 'Vertical Height';
    } else {
      const hPx = Math.abs(points[1].y - points[0].y);
      const hCm = pixelsToCm(hPx, pixelsPerCm);
      primaryNumeric = hCm;
      primaryFormatted = formatMeasurement(hCm, unit, useFractions);
      subMetricFormatted = `${(hCm / 2.54).toFixed(1)}" Vertical`;
      hintText = 'Height captured. Tap PIN to start new';
    }
  } else if (mode === 'ANGLE') {
    if (points.length < 3) {
      hintText = `Pin ${3 - points.length} more point${3 - points.length === 1 ? '' : 's'} (Arm 1 -> Vertex -> Arm 2)`;
      primaryFormatted = `${points.length}/3 points`;
    } else {
      const deg = calculateAngleDegrees(points[0], points[1], points[2]);
      primaryNumeric = deg;
      primaryFormatted = `${deg.toFixed(1)}°`;
      subMetricFormatted = `Vertex at point B`;
      hintText = 'Angle measured. Tap PIN to reset';
    }
  } else if (mode === 'CIRCLE') {
    if (points.length === 0) {
      hintText = 'Pin center point of circle/cylinder';
      primaryFormatted = '0.0 ' + unit;
    } else if (points.length === 1) {
      hintText = 'Aim at outer circle rim and tap PIN';
      const c = calculateCircle(points[0], { ...reticlePos, id: 'temp' }, pixelsPerCm);
      primaryNumeric = c.diameterCm;
      primaryFormatted = `Ø ${formatMeasurement(c.diameterCm, unit, useFractions)}`;
      subMetricFormatted = `Circum: ${c.perimeterCm.toFixed(1)} cm`;
    } else {
      const c = calculateCircle(points[0], points[1], pixelsPerCm);
      primaryNumeric = c.diameterCm;
      primaryFormatted = `Ø ${formatMeasurement(c.diameterCm, unit, useFractions)}`;
      subMetricFormatted = `Area: ${formatArea(c.areaCm2, unit)}`;
      hintText = 'Circle measured. Tap PIN to reset';
    }
  } else if (mode === 'AI_VISION') {
    hintText = 'Tap AI Sparkle button to scan and measure scene objects with Gemini';
    primaryFormatted = 'AI Metrology';
  }

  // Trigger Gemini Vision AI measurement
  const triggerAIMeasurement = async () => {
    sound.playShutter();
    setAiLoading(true);
    setAiError(null);

    try {
      let imageBase64: string | null = null;

      if (camera.state.isStreaming) {
        imageBase64 = camera.captureFrame();
      } else if (selectedDemoScene) {
        // Render demo scene SVG onto temporary canvas to get clean base64
        imageBase64 = await convertSvgDataUrlToJpeg(selectedDemoScene.imageUrl);
      } else if (uploadedImageUrl) {
        imageBase64 = uploadedImageUrl;
      }

      if (!imageBase64) {
        throw new Error('No video frame available. Enable camera or select a demo scene.');
      }

      const res = await fetch('/api/measure-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          unit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI analysis failed');
      }

      setAiResult(data.data);
      sound.playLevelChime();
    } catch (err: any) {
      setAiError(err?.message || 'Failed to analyze measurement image.');
    } finally {
      setAiLoading(false);
    }
  };

  // Convert SVG Data URI to base64 JPEG for AI
  const convertSvgDataUrlToJpeg = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 1280;
        c.height = 720;
        const ctx = c.getContext('2d');
        if (!ctx) return reject(new Error('Canvas error'));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.drawImage(img, 0, 0, 1280, 720);
        resolve(c.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('Failed to load demo scene image'));
      img.src = svgDataUrl;
    });
  };

  // Apply AI detected ruler points to tape
  const handleApplyAIRulerPoints = (aiPoints: Point2D[], title: string) => {
    setPoints(aiPoints);
    setMode('TAPE');
    // Auto save to records
    const distPx = pixelDistance(aiPoints[0], aiPoints[1]);
    const distCm = pixelsToCm(distPx, pixelsPerCm);
    const newRecord: MeasurementRecord = {
      id: `ai-rec-${Date.now()}`,
      title,
      mode: 'TAPE',
      timestamp: Date.now(),
      unit,
      values: {
        primaryValue: distCm,
        primaryFormatted: formatMeasurement(distCm, unit, useFractions),
        secondaryFormatted: `${(distCm / 2.54).toFixed(1)}" (AI Measured)`,
      },
      notes: 'Automatically measured by Gemini Vision Metrology',
    };
    setRecords((prev) => [newRecord, ...prev]);
  };

  // Snapshot & Save Current Measurement to Notebook
  const handleSaveSnapshot = () => {
    sound.playShutter();

    let thumbnail: string | undefined = undefined;
    if (camera.state.isStreaming) {
      thumbnail = camera.captureFrame() || undefined;
    } else if (selectedDemoScene) {
      thumbnail = selectedDemoScene.imageUrl;
    } else if (uploadedImageUrl) {
      thumbnail = uploadedImageUrl;
    }

    const newRecord: MeasurementRecord = {
      id: `rec-${Date.now()}`,
      title: `${mode.charAt(0) + mode.slice(1).toLowerCase()} Measurement`,
      mode,
      timestamp: Date.now(),
      unit,
      values: {
        primaryValue: primaryNumeric,
        primaryFormatted,
        secondaryFormatted: subMetricFormatted,
      },
      thumbnail,
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsNotebookOpen(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-neutral-950 select-none flex flex-col justify-between"
      onPointerMove={handleContainerPointerMove}
    >
      {/* 1. BACKGROUND CAMERA FEED OR MOCK SCENE */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Real Live Device Camera Feed */}
        <video
          ref={camera.videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            camera.state.isStreaming ? 'opacity-100' : 'opacity-0 hidden'
          }`}
        />

        {/* Mock Scene Image if Camera is Not Active */}
        {!camera.state.isStreaming && selectedDemoScene && (
          <img
            src={selectedDemoScene.imageUrl}
            alt={selectedDemoScene.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Custom Uploaded Image */}
        {!camera.state.isStreaming && uploadedImageUrl && (
          <img
            src={uploadedImageUrl}
            alt="Uploaded scene"
            className="w-full h-full object-cover"
          />
        )}

        {/* Fallback default if nothing loaded */}
        {!camera.state.isStreaming && !selectedDemoScene && !uploadedImageUrl && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900 text-neutral-400">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <span className="text-2xl">📷</span>
            </div>
            <h2 className="text-base font-bold text-neutral-100">Camera Initializing or Disabled</h2>
            <p className="text-xs text-neutral-400 max-w-sm mt-1 mb-4">
              {camera.state.error || 'Enable camera permissions or select a high-res demo room scene.'}
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => camera.startCamera('environment')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs transition-colors"
              >
                Retry Camera
              </button>
              <button
                onClick={() => handleSelectDemoScene(DEMO_SCENES[0])}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs transition-colors"
              >
                Load Demo Room
              </button>
            </div>
          </div>
        )}

        {/* Subtle camera lens vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      {/* 2. AR TAPE MEASURE CANVAS (YELLOW TAPE & PINS) */}
      {mode !== 'CALIPER' && (
        <ARTapeCanvas
          points={points}
          activeReticlePoint={{
            ...reticlePos,
            id: 'reticle-active',
            label: String.fromCharCode(65 + (points.length % 26)),
          }}
          mode={mode}
          unit={unit}
          pixelsPerCm={pixelsPerCm}
          useFractions={useFractions}
          onMovePoint={handleMovePoint}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* 3. TACTICAL 3D CROSSHAIR RETICLE */}
      {mode !== 'CALIPER' && (
        <ARReticle
          x={reticlePos.x}
          y={reticlePos.y}
          isLocked={points.length > 0}
          activeLabel={currentRealtimeDistance || undefined}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
        />
      )}

      {/* 4. PHYSICAL 1:1 ON-SCREEN CALIPER MODE */}
      {mode === 'CALIPER' && (
        <ScreenRulerCaliper
          unit={unit}
          onClose={() => setMode('TAPE')}
        />
      )}

      {/* 5. TOP HUD STATUS BAR & MODE BAR */}
      <HeaderHUD
        mode={mode}
        onSelectMode={(m) => {
          sound.playPinLock();
          setMode(m);
        }}
        unit={unit}
        onSelectUnit={(u) => {
          sound.playPinLock();
          setUnit(u);
        }}
        isTorchOn={camera.state.isTorchOn}
        hasTorch={camera.state.hasTorch}
        onToggleTorch={camera.toggleTorch}
        onSwitchCamera={camera.switchCamera}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        onOpenNotebook={() => setIsNotebookOpen(true)}
        isSoundMuted={isSoundMuted}
        onToggleSound={() => setIsSoundMuted((prev) => !prev)}
        recordsCount={records.length}
        pitch={sensors.pitch}
        roll={sensors.roll}
        isLevel={sensors.isLevel}
        isCameraActive={camera.state.isStreaming}
        onToggleSceneSelector={() => setIsSceneSelectorOpen(true)}
        activeSceneName={selectedDemoScene?.name}
      />

      {/* 6. AI VISION METROLOGY OVERLAY (GEMINI 3.8 FLASH) */}
      <AIMeasurementOverlay
        isLoading={aiLoading}
        result={aiResult}
        error={aiError}
        unit={unit}
        containerWidth={dimensions.width}
        containerHeight={dimensions.height}
        onApplyRulerPoints={handleApplyAIRulerPoints}
        onClose={() => {
          setAiResult(null);
          setAiError(null);
        }}
        onRetry={triggerAIMeasurement}
      />

      {/* 7. BOTTOM CONTROL DECK (SHUTTER / PIN / UNDO / CLEAR) */}
      {mode !== 'CALIPER' && (
        <ControlDeck
          mode={mode}
          unit={unit}
          pointsCount={points.length}
          currentRealtimeDistance={currentRealtimeDistance}
          totalMeasuredFormatted={primaryFormatted}
          subMetricFormatted={subMetricFormatted}
          hintText={hintText}
          onAddPoint={handleAddPoint}
          onUndoPoint={handleUndoPoint}
          onClearPoints={handleClearPoints}
          onSaveSnapshot={handleSaveSnapshot}
          onTriggerAIMeasure={triggerAIMeasurement}
          canSave={points.length >= (mode === 'TAPE' ? 2 : mode === 'AREA' ? 3 : 1)}
        />
      )}

      {/* 8. CALIBRATION MODAL */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        currentPixelsPerCm={pixelsPerCm}
        onClose={() => setIsCalibrationOpen(false)}
        onSaveCalibration={(data: CalibrationData) => {
          setPixelsPerCm(data.pixelsPerCm);
          setCameraDistanceMeters(data.cameraDistanceMeters);
        }}
      />

      {/* 9. SAVED MEASUREMENTS NOTEBOOK DRAWER */}
      <SavedMeasurementsDrawer
        isOpen={isNotebookOpen}
        records={records}
        onClose={() => setIsNotebookOpen(false)}
        onDeleteRecord={(id) => setRecords((prev) => prev.filter((r) => r.id !== id))}
        onClearAll={() => setRecords([])}
      />

      {/* 10. SCENE SELECTOR MODAL (CAMERA VS MOCK ROOMS VS UPLOAD) */}
      <SceneSelectorModal
        isOpen={isSceneSelectorOpen}
        isCameraActive={camera.state.isStreaming}
        selectedDemoSceneId={selectedDemoScene?.id || null}
        onSelectCamera={handleSelectCamera}
        onSelectDemoScene={handleSelectDemoScene}
        onUploadCustomImage={handleUploadCustomImage}
        onClose={() => setIsSceneSelectorOpen(false)}
      />
    </div>
  );
}
