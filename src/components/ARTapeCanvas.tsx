import React, { useRef, useEffect } from 'react';
import {
  Point2D,
  MeasureMode,
  MeasureUnit,
} from '../types/measurement';
import {
  pixelDistance,
  pixelsToCm,
  formatMeasurement,
  calculateAngleDegrees,
  calculatePolygonAreaCm2,
  formatArea,
  calculateCircle,
} from '../utils/math';

interface ARTapeCanvasProps {
  points: Point2D[];
  activeReticlePoint: Point2D | null;
  mode: MeasureMode;
  unit: MeasureUnit;
  pixelsPerCm: number;
  useFractions?: boolean;
  onSelectPoint?: (index: number) => void;
  onMovePoint?: (index: number, newPoint: Point2D) => void;
  width: number;
  height: number;
}

export const ARTapeCanvas: React.FC<ARTapeCanvasProps> = ({
  points,
  activeReticlePoint,
  mode,
  unit,
  pixelsPerCm,
  useFractions = false,
  onSelectPoint,
  onMovePoint,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingPointIdx = useRef<number | null>(null);

  // Render AR elements onto HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // List of completed points + tentative active point
    const renderPoints = [...points];
    if (activeReticlePoint && shouldShowActiveLine(mode, points.length)) {
      renderPoints.push(activeReticlePoint);
    }

    // DRAW BASED ON MODE
    if (mode === 'TAPE') {
      renderTapeLine(ctx, renderPoints, pixelsPerCm, unit, useFractions);
    } else if (mode === 'AREA') {
      renderAreaPolygon(ctx, renderPoints, pixelsPerCm, unit);
    } else if (mode === 'HEIGHT') {
      renderHeightStadiameter(ctx, renderPoints, pixelsPerCm, unit, useFractions);
    } else if (mode === 'ANGLE') {
      renderAngleProtractor(ctx, renderPoints);
    } else if (mode === 'CIRCLE') {
      renderCircleMeasure(ctx, renderPoints, pixelsPerCm, unit, useFractions);
    }

    // Render Pin Markers on anchored points
    points.forEach((p, index) => {
      drawAnchorPin(ctx, p, index, points.length);
    });

  }, [points, activeReticlePoint, mode, unit, pixelsPerCm, useFractions, width, height]);

  // Touch & Mouse handlers for dragging anchor pins directly
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    // Hit test pins (radius 24px)
    for (let i = points.length - 1; i >= 0; i--) {
      const p = points[i];
      if (Math.hypot(p.x - touchX, p.y - touchY) <= 28) {
        draggingPointIdx.current = i;
        if (onSelectPoint) onSelectPoint(i);
        e.currentTarget.setPointerCapture(e.pointerId);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingPointIdx.current === null || !onMovePoint) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = Math.max(0, Math.min(width, e.clientX - rect.left));
    const newY = Math.max(0, Math.min(height, e.clientY - rect.top));

    onMovePoint(draggingPointIdx.current, {
      ...points[draggingPointIdx.current],
      x: newX,
      y: newY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingPointIdx.current !== null) {
      draggingPointIdx.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 z-10 touch-none pointer-events-auto cursor-crosshair"
    />
  );
};

// Helper: Should tentatively connect current reticle to last point?
function shouldShowActiveLine(mode: MeasureMode, pointsCount: number): boolean {
  if (pointsCount === 0) return false;
  if (mode === 'TAPE' || mode === 'AREA' || mode === 'HEIGHT') return true;
  if (mode === 'ANGLE' && pointsCount < 3) return true;
  if (mode === 'CIRCLE' && pointsCount < 2) return true;
  return false;
}

// 1. RENDER REALISTIC YELLOW TAPE MEASURE LINE
function renderTapeLine(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  pxPerCm: number,
  unit: MeasureUnit,
  useFractions: boolean
) {
  if (pts.length < 2) return;

  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthPx = Math.hypot(dx, dy);
    if (lengthPx < 1) continue;

    const angle = Math.atan2(dy, dx);
    const lengthCm = pixelsToCm(lengthPx, pxPerCm);

    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle);

    // Tape Ribbon Body (Width 16px)
    const tapeThickness = 14;
    const halfThick = tapeThickness / 2;

    // Glowing drop shadow under tape
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Yellow Tape Gradient
    const tapeGrad = ctx.createLinearGradient(0, -halfThick, 0, halfThick);
    tapeGrad.addColorStop(0, '#fef08a'); // Highlight edge
    tapeGrad.addColorStop(0.2, '#facc15'); // Classic Stanley yellow
    tapeGrad.addColorStop(0.85, '#eab308');
    tapeGrad.addColorStop(1, '#ca8a04'); // Shadow edge

    ctx.fillStyle = tapeGrad;
    ctx.fillRect(0, -halfThick, lengthPx, tapeThickness);

    // Black Tape Top/Bottom Border Lines
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, -halfThick, lengthPx, tapeThickness);

    // Graduation Ticks along tape body
    // Draw tick marks every few pixels calibrated to physical spacing
    const tickIntervalPx = Math.max(4, pxPerCm * 0.5); // every 5mm
    const totalTicks = Math.floor(lengthPx / tickIntervalPx);

    for (let t = 0; t <= totalTicks; t++) {
      const tx = t * tickIntervalPx;
      const isMajor = t % 2 === 0;
      const tickH = isMajor ? 5 : 3;

      ctx.strokeStyle = isMajor ? '#1e293b' : '#64748b';
      ctx.lineWidth = isMajor ? 1.2 : 0.8;

      // Top edge tick
      ctx.beginPath();
      ctx.moveTo(tx, -halfThick);
      ctx.lineTo(tx, -halfThick + tickH);
      ctx.stroke();

      // Bottom edge tick
      ctx.beginPath();
      ctx.moveTo(tx, halfThick);
      ctx.lineTo(tx, halfThick - tickH);
      ctx.stroke();
    }

    // Metal end hook at point 0
    if (i === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-4, -halfThick - 3, 5, tapeThickness + 6);
      ctx.strokeRect(-4, -halfThick - 3, 5, tapeThickness + 6);
      // Hook lip
      ctx.fillRect(-6, halfThick - 2, 4, 6);
    }

    ctx.restore();

    // Floating Dimension Badge at Midpoint
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    drawDimensionBadge(
      ctx,
      midX,
      midY,
      formatMeasurement(lengthCm, unit, useFractions),
      `${(lengthCm / 2.54).toFixed(1)}"`
    );
  }
}

// 2. RENDER 2D AREA POLYGON & RECTANGLE
function renderAreaPolygon(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  pxPerCm: number,
  unit: MeasureUnit
) {
  if (pts.length < 2) return;

  // Draw translucent shaded area fill
  if (pts.length >= 3) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();

    // Semi-transparent blueprint grid fill
    ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.restore();

    // Calculate Area & Centroid
    const areaCm2 = calculatePolygonAreaCm2(pts, pxPerCm);
    let cx = 0;
    let cy = 0;
    pts.forEach((p) => {
      cx += p.x;
      cy += p.y;
    });
    cx /= pts.length;
    cy /= pts.length;

    drawDimensionBadge(
      ctx,
      cx,
      cy,
      formatArea(areaCm2, unit),
      `Area (${pts.length} pts)`
    );
  }

  // Draw perimeter tape segments
  renderTapeLine(ctx, pts, pxPerCm, unit, false);
}

// 3. RENDER HEIGHT STADIAMETER (Vertical Laser Beam)
function renderHeightStadiameter(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  pxPerCm: number,
  unit: MeasureUnit,
  useFractions: boolean
) {
  if (pts.length < 2) return;
  const base = pts[0];
  const top = pts[1];

  // Ground horizontal reference plane mark
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(base.x - 40, base.y);
  ctx.lineTo(base.x + 40, base.y);
  ctx.stroke();

  // Top height horizon mark
  ctx.beginPath();
  ctx.moveTo(top.x - 30, top.y);
  ctx.lineTo(top.x + 30, top.y);
  ctx.stroke();

  // Vertical Laser Line
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  ctx.restore();

  const heightPx = Math.abs(top.y - base.y);
  const heightCm = pixelsToCm(heightPx, pxPerCm);

  drawDimensionBadge(
    ctx,
    (base.x + top.x) / 2 + 35,
    (base.y + top.y) / 2,
    `H: ${formatMeasurement(heightCm, unit, useFractions)}`,
    'Vertical'
  );
}

// 4. RENDER ANGLE PROTRACTOR
function renderAngleProtractor(ctx: CanvasRenderingContext2D, pts: Point2D[]) {
  if (pts.length < 2) return;

  // Rays
  ctx.save();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(pts[1].x, pts[1].y);
  ctx.lineTo(pts[0].x, pts[0].y);
  ctx.stroke();

  if (pts.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.stroke();

    // Arc at vertex pts[1]
    const p1 = pts[0];
    const vertex = pts[1];
    const p3 = pts[2];

    const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const angle3 = Math.atan2(p3.y - vertex.y, p3.x - vertex.x);
    const deg = calculateAngleDegrees(p1, vertex, p3);

    ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.beginPath();
    ctx.moveTo(vertex.x, vertex.y);
    ctx.arc(vertex.x, vertex.y, 40, Math.min(angle1, angle3), Math.max(angle1, angle3));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    drawDimensionBadge(
      ctx,
      vertex.x,
      vertex.y - 45,
      `${deg.toFixed(1)}°`,
      'Angle'
    );
  }
  ctx.restore();
}

// 5. RENDER CIRCLE & DIAMETER
function renderCircleMeasure(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  pxPerCm: number,
  unit: MeasureUnit,
  useFractions: boolean
) {
  if (pts.length < 2) return;
  const center = pts[0];
  const rim = pts[1];
  const radiusPx = pixelDistance(center, rim);

  const { diameterCm, circumferenceCm } = calculateCircle(center, rim, pxPerCm) as any;

  ctx.save();
  // Draw translucent circle
  ctx.fillStyle = 'rgba(250, 204, 21, 0.12)';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radiusPx, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Radius Line
  ctx.strokeStyle = '#38bdf8';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(rim.x, rim.y);
  ctx.stroke();
  ctx.restore();

  drawDimensionBadge(
    ctx,
    center.x,
    center.y - radiusPx - 25,
    `Ø ${formatMeasurement(diameterCm, unit, useFractions)}`,
    `Circum: ${(circumferenceCm || diameterCm * Math.PI).toFixed(1)} cm`
  );
}

// Draw Pin Marker on anchored coordinates
function drawAnchorPin(
  ctx: CanvasRenderingContext2D,
  point: Point2D,
  index: number,
  totalPoints: number
) {
  const pinLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const label = point.label || pinLabels[index % pinLabels.length];

  ctx.save();

  // Outer Ripple Glow
  ctx.beginPath();
  ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.fill();

  // Pin Core
  ctx.beginPath();
  ctx.arc(point.x, point.y, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a'; // Deep slate
  ctx.strokeStyle = '#facc15'; // Amber border
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.stroke();

  // Letter label
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, point.x, point.y);

  ctx.restore();
}

// Draw Floating Dimension Badge (dark glass badge with yellow high-contrast typography)
function drawDimensionBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  mainText: string,
  subText?: string
) {
  ctx.save();
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  const textMetrics = ctx.measureText(mainText);
  const badgeWidth = Math.max(textMetrics.width + 24, 76);
  const badgeHeight = subText ? 34 : 26;

  const bx = x - badgeWidth / 2;
  const by = y - badgeHeight / 2;

  // Background Box
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; // Slate 900
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;

  roundRect(ctx, bx, by, badgeWidth, badgeHeight, 6);
  ctx.fill();
  ctx.stroke();

  // Main measurement text
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fef08a'; // bright yellow
  ctx.textAlign = 'center';
  ctx.textBaseline = subText ? 'top' : 'middle';
  ctx.fillText(mainText, x, subText ? by + 4 : by + badgeHeight / 2);

  // Subtitle (e.g. secondary inches, label)
  if (subText) {
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(subText, x, by + 19);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
