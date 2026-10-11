import { Point2D, MeasureUnit, CalibrationReference } from '../types/measurement';

export const STANDARD_REFERENCES: CalibrationReference[] = [
  {
    id: 'credit_card',
    name: 'Credit / ID Card',
    description: 'ISO 7810 standard (8.56 cm × 5.40 cm)',
    realWidthCm: 8.56,
    realHeightCm: 5.398,
    iconName: 'CreditCard',
  },
  {
    id: 'a4_paper',
    name: 'A4 / Letter Paper',
    description: 'Standard 21.0 cm × 29.7 cm sheet',
    realWidthCm: 21.0,
    realHeightCm: 29.7,
    iconName: 'FileText',
  },
  {
    id: 'dollar_bill',
    name: 'US Dollar Bill',
    description: 'Standard 15.6 cm × 6.63 cm banknote',
    realWidthCm: 15.6,
    realHeightCm: 6.63,
    iconName: 'Banknote',
  },
  {
    id: 'us_quarter',
    name: 'US Quarter / Coin',
    description: 'Diameter 2.43 cm (0.955 in)',
    realWidthCm: 2.426,
    iconName: 'Coins',
  },
  {
    id: 'custom',
    name: 'Custom Reference Item',
    description: 'Enter known length in cm or inches',
    realWidthCm: 10.0,
    iconName: 'Ruler',
  },
];

// Distance in screen pixels between two points
export function pixelDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.hypot(dx, dy);
}

// Convert screen pixels to real centimeters based on calibration
export function pixelsToCm(pixels: number, pixelsPerCm: number): number {
  if (pixelsPerCm <= 0) return 0;
  return pixels / pixelsPerCm;
}

// Convert cm to imperial inches
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

// Convert inches to cm
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

// Convert length to formatted string with unit
export function formatMeasurement(
  cmVal: number,
  unit: MeasureUnit,
  useFractions: boolean = false
): string {
  if (isNaN(cmVal) || cmVal < 0) return '0.0 ' + unit;

  switch (unit) {
    case 'cm':
      return `${cmVal.toFixed(1)} cm`;
    case 'm':
      return `${(cmVal / 100).toFixed(2)} m`;
    case 'in': {
      const inches = cmToInches(cmVal);
      if (useFractions) {
        return formatInchFraction(inches);
      }
      return `${inches.toFixed(1)} in`;
    }
    case 'ft': {
      const totalInches = cmToInches(cmVal);
      const feet = Math.floor(totalInches / 12);
      const remainingInches = totalInches % 12;
      return `${feet}' ${remainingInches.toFixed(1)}"`;
    }
  }
}

// Convert decimal inches to fractional notation (e.g. 5 1/4")
export function formatInchFraction(decimalInches: number): string {
  const whole = Math.floor(decimalInches);
  const fraction = decimalInches - whole;

  // Round to nearest 1/16
  const sixteenths = Math.round(fraction * 16);
  if (sixteenths === 0) return `${whole}"`;
  if (sixteenths === 16) return `${whole + 1}"`;

  let num = sixteenths;
  let den = 16;
  while (num % 2 === 0 && den % 2 === 0) {
    num /= 2;
    den /= 2;
  }

  return whole > 0 ? `${whole} ${num}/${den}"` : `${num}/${den}"`;
}

// Calculate angle between 3 points in degrees (vertex at p2)
export function calculateAngleDegrees(p1: Point2D, p2: Point2D, p3: Point2D): number {
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

// Shoelace formula for polygon area in square centimeters
export function calculatePolygonAreaCm2(points: Point2D[], pixelsPerCm: number): number {
  if (points.length < 3 || pixelsPerCm <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += (current.x * next.y) - (next.x * current.y);
  }
  const pixelArea = Math.abs(sum) / 2;
  return pixelArea / (pixelsPerCm * pixelsPerCm);
}

// Format area value
export function formatArea(cm2: number, unit: MeasureUnit): string {
  if (isNaN(cm2) || cm2 < 0) return '0';

  if (unit === 'cm') {
    if (cm2 >= 10000) {
      return `${(cm2 / 10000).toFixed(2)} m²`;
    }
    return `${cm2.toFixed(1)} cm²`;
  } else if (unit === 'm') {
    return `${(cm2 / 10000).toFixed(3)} m²`;
  } else {
    // Imperial square feet or square inches
    const sqInches = cm2 / 6.4516;
    if (sqInches >= 144) {
      return `${(sqInches / 144).toFixed(2)} sq ft`;
    }
    return `${sqInches.toFixed(1)} sq in`;
  }
}

// Approximate circle measurements
export function calculateCircle(center: Point2D, rim: Point2D, pixelsPerCm: number) {
  const radiusPx = pixelDistance(center, rim);
  const radiusCm = pixelsToCm(radiusPx, pixelsPerCm);
  const diameterCm = radiusCm * 2;
  const perimeterCm = 2 * Math.PI * radiusCm;
  const areaCm2 = Math.PI * radiusCm * radiusCm;

  return { radiusCm, diameterCm, perimeterCm, areaCm2 };
}
