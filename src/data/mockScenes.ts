export interface DemoScene {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  defaultScalePxPerCm: number;
  knownObjects: {
    name: string;
    description: string;
    expectedLengthCm: number;
    points: { x1: number; y1: number; x2: number; y2: number };
  }[];
}

// Crisp stylized realistic indoor scenes rendered with SVG Data URIs for instant zero-latency loading
export const DEMO_SCENES: DemoScene[] = [
  {
    id: 'desk_workspace',
    name: 'Desk Workspace (Laptop & Mug)',
    category: 'Interior & Office',
    description: 'Standard 14" laptop (31.2cm) and coffee mug (8.2cm) on wooden desk',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1e293b"/>
            <stop offset="60%" stop-color="#334155"/>
          </linearGradient>
          <linearGradient id="desk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#9a6e4d"/>
            <stop offset="50%" stop-color="#785338"/>
            <stop offset="100%" stop-color="#5c3e27"/>
          </linearGradient>
          <linearGradient id="laptopScreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#4f46e5"/>
          </linearGradient>
          <linearGradient id="laptopBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>
          <radialGradient id="lampGlow" cx="0.8" cy="0.2" r="0.6">
            <stop offset="0%" stop-color="#fef08a" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- Back wall with baseboard -->
        <rect width="1280" height="420" fill="url(#wall)"/>
        <line x1="0" y1="418" x2="1280" y2="418" stroke="#475569" stroke-width="4"/>

        <!-- Desk Surface with perspective -->
        <polygon points="0,420 1280,420 1280,720 0,720" fill="url(#desk)"/>

        <!-- Wood plank grain lines -->
        <line x1="0" y1="510" x2="1280" y2="510" stroke="#4a301e" stroke-width="1.5" opacity="0.4"/>
        <line x1="0" y1="610" x2="1280" y2="610" stroke="#4a301e" stroke-width="1.5" opacity="0.4"/>

        <!-- Lamp Warm Glow -->
        <circle cx="1020" cy="240" r="340" fill="url(#lampGlow)"/>

        <!-- Desk Mat / Pad -->
        <rect x="280" y="450" width="700" height="230" rx="16" fill="#1e293b" stroke="#334155" stroke-width="3"/>

        <!-- Laptop Base -->
        <polygon points="440,590 820,590 850,650 410,650" fill="url(#laptopBody)" stroke="#64748b" stroke-width="2"/>
        <rect x="580" y="605" width="100" height="40" rx="4" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>

        <!-- Laptop Screen (Open at Angle) -->
        <polygon points="460,400 800,400 820,590 440,590" fill="#0f172a" stroke="#475569" stroke-width="4"/>
        <polygon points="475,415 785,415 802,578 458,578" fill="url(#laptopScreen)"/>
        <text x="630" y="500" fill="#ffffff" font-family="sans-serif" font-weight="700" font-size="20" text-anchor="middle" opacity="0.8">14.0" Retina Display</text>

        <!-- Coffee Mug -->
        <ellipse cx="230" cy="560" rx="36" ry="18" fill="#e2e8f0"/>
        <path d="M 194,560 L 194,625 A 36 18 0 0 0 266,625 L 266,560 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <ellipse cx="230" cy="560" rx="32" ry="14" fill="#713f12"/>
        <path d="M 264,575 C 290,575 290,610 264,615" fill="none" stroke="#e2e8f0" stroke-width="7" stroke-linecap="round"/>

        <!-- Notebook with Pen -->
        <polygon points="1010,480 1160,510 1120,660 970,630" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="995" y1="520" x2="1140" y2="550" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
        <line x1="990" y1="550" x2="1135" y2="580" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
        <line x1="985" y1="580" x2="1130" y2="610" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

        <!-- Credit Card Reference on Desk -->
        <rect x="330" y="500" width="85.6" height="54" rx="4" fill="#2563eb" stroke="#1d4ed8" stroke-width="2" transform="rotate(-6, 330, 500)"/>
        <rect x="338" y="515" width="22" height="16" rx="2" fill="#fbbf24" transform="rotate(-6, 330, 500)"/>
        <text x="375" y="540" fill="#ffffff" font-family="monospace" font-size="7" font-weight="bold" transform="rotate(-6, 330, 500)">REFERENCE</text>
      </svg>
    `),
    defaultScalePxPerCm: 10.0,
    knownObjects: [
      {
        name: 'Credit Card (Calibration Std)',
        description: 'Standard ISO 7810 format',
        expectedLengthCm: 8.56,
        points: { x1: 330, y1: 500, x2: 415, y2: 491 },
      },
      {
        name: 'Laptop Width',
        description: 'MacBook width chassis',
        expectedLengthCm: 31.2,
        points: { x1: 440, y1: 590, x2: 820, y2: 590 },
      },
      {
        name: 'Coffee Mug Diameter',
        description: 'Ceramic mug top rim',
        expectedLengthCm: 8.2,
        points: { x1: 194, y1: 560, x2: 266, y2: 560 },
      },
    ],
  },
  {
    id: 'living_room_table',
    name: 'Living Room (Coffee Table & Rug)',
    category: 'Home & Furniture',
    description: 'Modern coffee table (110cm × 60cm) on patterned area rug',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
        <defs>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d6d3d1"/>
            <stop offset="100%" stop-color="#a8a29e"/>
          </linearGradient>
          <linearGradient id="sofa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.6"/>
          </linearGradient>
        </defs>

        <!-- Hardwood Floor -->
        <rect width="1280" height="720" fill="url(#floor)"/>

        <!-- Sofa Background -->
        <polygon points="120,240 1160,240 1220,380 60,380" fill="url(#sofa)"/>
        <rect x="180" y="270" width="280" height="80" rx="12" fill="#475569"/>
        <rect x="500" y="270" width="280" height="80" rx="12" fill="#475569"/>
        <rect x="820" y="270" width="280" height="80" rx="12" fill="#475569"/>

        <!-- Living Room Area Rug -->
        <polygon points="260,390 1020,390 1120,680 160,680" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4"/>
        <polygon points="300,410 980,410 1070,660 210,660" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="10,6"/>

        <!-- Coffee Table Legs -->
        <line x1="390" y1="520" x2="390" y2="600" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <line x1="890" y1="520" x2="890" y2="600" stroke="#0f172a" stroke-width="8" stroke-linecap="round"/>
        <line x1="430" y1="460" x2="430" y2="540" stroke="#334155" stroke-width="6" stroke-linecap="round"/>
        <line x1="850" y1="460" x2="850" y2="540" stroke="#334155" stroke-width="6" stroke-linecap="round"/>

        <!-- Coffee Table Glass Top (110cm x 60cm) -->
        <polygon points="410,460 870,460 930,550 350,550" fill="url(#glass)" stroke="#38bdf8" stroke-width="3"/>

        <!-- Books on table -->
        <polygon points="560,480 680,480 690,520 570,520" fill="#f43f5e"/>
        <polygon points="555,475 675,475 685,515 565,515" fill="#f59e0b"/>

        <!-- Plant pot -->
        <ellipse cx="760" cy="495" rx="20" ry="10" fill="#15803d"/>
        <circle cx="760" cy="485" r="14" fill="#22c55e"/>
      </svg>
    `),
    defaultScalePxPerCm: 5.2,
    knownObjects: [
      {
        name: 'Coffee Table Top Width',
        description: 'Tempered glass tabletop width',
        expectedLengthCm: 110.0,
        points: { x1: 350, y1: 550, x2: 930, y2: 550 },
      },
      {
        name: 'Area Rug Width',
        description: 'Woven rug front width',
        expectedLengthCm: 185.0,
        points: { x1: 160, y1: 680, x2: 1120, y2: 680 },
      },
    ],
  },
  {
    id: 'doorway_wall',
    name: 'Doorway & Ceiling Height',
    category: 'Architecture & Construction',
    description: 'Standard interior door frame (204cm high × 82cm wide)',
    imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
        <defs>
          <linearGradient id="wallPaint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e2e8f0"/>
            <stop offset="100%" stop-color="#cbd5e1"/>
          </linearGradient>
          <linearGradient id="doorWood" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#78350f"/>
            <stop offset="100%" stop-color="#92400e"/>
          </linearGradient>
        </defs>

        <!-- Wall -->
        <rect width="1280" height="600" fill="url(#wallPaint)"/>

        <!-- Baseboard -->
        <rect y="580" width="1280" height="20" fill="#f8fafc" stroke="#94a3b8" stroke-width="1"/>

        <!-- Floor Tiles -->
        <rect y="600" width="1280" height="120" fill="#94a3b8"/>
        <line x1="200" y1="600" x2="100" y2="720" stroke="#64748b" stroke-width="2"/>
        <line x1="500" y1="600" x2="400" y2="720" stroke="#64748b" stroke-width="2"/>
        <line x1="800" y1="600" x2="700" y2="720" stroke="#64748b" stroke-width="2"/>
        <line x1="1100" y1="600" x2="1000" y2="720" stroke="#64748b" stroke-width="2"/>

        <!-- Door Frame Moldings -->
        <rect x="470" y="110" width="340" height="490" fill="#0f172a" stroke="#ffffff" stroke-width="8"/>
        <rect x="490" y="130" width="300" height="470" fill="url(#doorWood)"/>

        <!-- Door Panels -->
        <rect x="520" y="160" width="105" height="170" rx="4" fill="#b45309" stroke="#451a03" stroke-width="2"/>
        <rect x="655" y="160" width="105" height="170" rx="4" fill="#b45309" stroke="#451a03" stroke-width="2"/>
        <rect x="520" y="370" width="105" height="190" rx="4" fill="#b45309" stroke="#451a03" stroke-width="2"/>
        <rect x="655" y="370" width="105" height="190" rx="4" fill="#b45309" stroke="#451a03" stroke-width="2"/>

        <!-- Brass Door Handle -->
        <circle cx="515" cy="380" r="8" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
        <rect x="500" y="377" width="18" height="6" rx="2" fill="#fbbf24"/>

        <!-- Framed Wall Art to Left -->
        <rect x="160" y="180" width="180" height="230" fill="#f8fafc" stroke="#1e293b" stroke-width="12"/>
        <rect x="180" y="200" width="140" height="190" fill="#38bdf8"/>
        <circle cx="250" cy="280" r="35" fill="#f59e0b"/>
      </svg>
    `),
    defaultScalePxPerCm: 2.3,
    knownObjects: [
      {
        name: 'Standard Door Height',
        description: 'Interior jamb height',
        expectedLengthCm: 204.0,
        points: { x1: 490, y1: 130, x2: 490, y2: 600 },
      },
      {
        name: 'Door Leaf Width',
        description: 'Standard 82cm interior door',
        expectedLengthCm: 82.0,
        points: { x1: 490, y1: 600, x2: 790, y2: 600 },
      },
    ],
  },
];
