import { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';

export interface SensorOrientation {
  pitch: number; // Front-to-back tilt in degrees (-90 to 90)
  roll: number;  // Left-to-right tilt in degrees (-180 to 180)
  yaw: number;   // Compass heading (0 to 360)
  isSupported: boolean;
  isLevel: boolean; // Exactly within ±0.8° of horizontal or vertical
}

export function useSensors() {
  const [orientation, setOrientation] = useState<SensorOrientation>({
    pitch: 0,
    roll: 0,
    yaw: 0,
    isSupported: false,
    isLevel: false,
  });

  const lastLevelState = useRef(false);

  useEffect(() => {
    let hasOrientation = false;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null && e.gamma === null) return;
      hasOrientation = true;

      const pitch = Math.round((e.beta || 0) * 10) / 10;
      const roll = Math.round((e.gamma || 0) * 10) / 10;
      const yaw = Math.round((e.alpha || 0) * 10) / 10;

      // Check if phone is held level (pitch near 0 or 90, roll near 0)
      const isPitchLevel = Math.abs(pitch) < 0.8 || Math.abs(Math.abs(pitch) - 90) < 0.8;
      const isRollLevel = Math.abs(roll) < 0.8;
      const isLevel = isPitchLevel && isRollLevel;

      if (isLevel && !lastLevelState.current) {
        sound.playLevelChime();
      }
      lastLevelState.current = isLevel;

      setOrientation({
        pitch,
        roll,
        yaw,
        isSupported: true,
        isLevel,
      });
    };

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  return orientation;
}
