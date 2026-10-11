export type MeasureMode =
  | 'TAPE'        // Point-to-point line & polyline
  | 'AREA'        // 2D surface / polygon
  | 'HEIGHT'      // Vertical ground-to-top ruler
  | 'ANGLE'       // 3-point protractor
  | 'CIRCLE'      // Diameter & radius
  | 'CALIPER'     // Direct 1:1 screen ruler
  | 'AI_VISION';  // Gemini-powered visual recognition

export type MeasureUnit = 'cm' | 'm' | 'in' | 'ft';

export interface Point2D {
  x: number;
  y: number;
  id: string;
  label?: string;
  timestamp?: number;
}

export interface CalibrationReference {
  id: string;
  name: string;
  description: string;
  realWidthCm: number;
  realHeightCm?: number;
  iconName: string;
}

export interface CalibrationData {
  referenceId: string;
  realSizeCm: number;
  pixelsPerCm: number; // Scale factor on current screen viewport
  cameraDistanceMeters: number; // Estimated distance from target
  deviceHeightMeters: number; // Eye/chest level from ground (default 1.4m)
}

export interface MeasurementRecord {
  id: string;
  title: string;
  mode: MeasureMode;
  timestamp: number;
  unit: MeasureUnit;
  values: {
    primaryValue: number;
    primaryFormatted: string;
    secondaryFormatted?: string;
    subValues?: { label: string; value: string }[];
  };
  notes?: string;
  tags?: string[];
  thumbnail?: string; // Data URL snapshot
}

export interface AIBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface AIObjectDetection {
  label: string;
  box2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  dimensions: {
    width_cm?: number;
    height_cm?: number;
    depth_cm?: number;
    width_in?: number;
    height_in?: number;
    depth_in?: number;
  };
  keyRulerPoints?: {
    start: { x: number; y: number; label: string };
    end: { x: number; y: number; label: string };
    distance_cm: number;
    distance_in: number;
    label: string;
  };
  confidence?: number;
  details?: string;
}

export interface AIAnalysisResult {
  objects: AIObjectDetection[];
  detectedReferences?: string[];
  sceneDescription?: string;
  measurementTips?: string[];
}
