import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// CORS support so external PWABuilder / store package bots can access assets
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Generous body limit for high-res AR camera snapshots
app.use(express.json({ limit: '25mb' }));

// Explicit PWA Manifest route providing absolute URLs to prevent Bubblewrap resolution errors
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const manifestPath = path.resolve(__dirname, 'public', 'manifest.json');
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const baseUrl = `${proto}://${host}`;

    // Ensure icon and screenshot URLs are full absolute URLs
    if (Array.isArray(manifest.icons)) {
      manifest.icons = manifest.icons.map((icon: any) => ({
        ...icon,
        src: icon.src.startsWith('http') ? icon.src : `${baseUrl}${icon.src.startsWith('/') ? '' : '/'}${icon.src}`,
      }));
    }
    if (Array.isArray(manifest.screenshots)) {
      manifest.screenshots = manifest.screenshots.map((s: any) => ({
        ...s,
        src: s.src.startsWith('http') ? s.src : `${baseUrl}${s.src.startsWith('/') ? '' : '/'}${s.src}`,
      }));
    }

    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(manifest);
  } catch {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(manifestPath);
  }
});

app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

// Serve public directory assets (icons, screenshots)
app.use(express.static(path.resolve(__dirname, 'public'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Gemini Vision Smart Measurement endpoint
app.post('/api/measure-ai', async (req, res) => {
  try {
    const { image, referenceObject, unit = 'cm' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

    const systemPrompt = `You are an expert Computer Vision Metrology & Augmented Reality Measurement Engine.
Analyze this photo taken from an AR tape measure camera.
The user wants to measure items in this scene accurately.
Known reference object hints if any: "${referenceObject || 'None specified. Identify standard real-world objects like credit cards, phones, sheets of paper, cans, or doors to infer optical scale'}".

Your tasks:
1. Identify primary measurable objects in the image.
2. For each object, provide:
   - "label": Name of the object (e.g. "MacBook Pro", "Desk Lamp", "Coffee Mug", "Notebook", "Coffee Table", "Doorway")
   - "box2d": Normalized bounding box [ymin, xmin, ymax, xmax] scaled 0 to 1000.
   - "dimensions": Estimated physical measurements:
       - width_cm, height_cm, depth_cm (null if not visible)
       - width_in, height_in, depth_in
   - "keyRulerPoints": 2 primary endpoints for a virtual tape measure line across its longest or most prominent dimension:
       - start: { x: number (0-1000), y: number (0-1000), label: string }
       - end: { x: number (0-1000), y: number (0-1000), label: string }
       - distance_cm: number
       - distance_in: number
       - label: string (e.g. "Width", "Height", "Diagonal")
   - "confidence": confidence score from 0.0 to 1.0
   - "details": Brief measurement notes explaining how the dimension was estimated (e.g. standard ISO paper dimension, standard credit card 85.6mm, typical laptop footprint)
3. Detect any known reference objects in the scene that could be used for scale calibration (e.g., Credit Card, A4 paper, US Dollar bill, Coin).
4. Provide an overall scene description and tips to improve measurement precision (such as lighting, camera angle, or placing a coin/card).

Return valid JSON adhering to the specified schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              text: systemPrompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fences
      const cleaned = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      parsedData = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/measure-ai:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze measurement image',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AR Ruler App listening on port ${PORT}`);
  });
}

startServer();
