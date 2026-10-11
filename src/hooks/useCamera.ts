import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraState {
  isActive: boolean;
  isStreaming: boolean;
  facingMode: 'environment' | 'user';
  hasTorch: boolean;
  isTorchOn: boolean;
  error: string | null;
  videoWidth: number;
  videoHeight: number;
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>({
    isActive: false,
    isStreaming: false,
    facingMode: 'environment',
    hasTorch: false,
    isTorchOn: false,
    error: null,
    videoWidth: 1280,
    videoHeight: 720,
  });

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({
      ...prev,
      isActive: false,
      isStreaming: false,
      hasTorch: false,
      isTorchOn: false,
    }));
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = (videoTrack?.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
      const hasTorch = Boolean(capabilities.torch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play interrupted:', err);
        });
      }

      setState((prev) => ({
        ...prev,
        isActive: true,
        isStreaming: true,
        facingMode: facing,
        hasTorch,
        isTorchOn: false,
        error: null,
      }));
    } catch (err: any) {
      console.warn('Could not start real camera stream:', err);
      setState((prev) => ({
        ...prev,
        isActive: false,
        isStreaming: false,
        error: err?.message || 'Camera permission denied or camera not found.',
      }));
    }
  }, [stopStream]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !state.isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setState((prev) => ({ ...prev, isTorchOn: nextState }));
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  }, [state.isTorchOn]);

  const switchCamera = useCallback(() => {
    const nextFacing = state.facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  }, [state.facingMode, startCamera]);

  // Capture frame as JPEG data URL
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  useEffect(() => {
    // Attempt camera start on mount
    startCamera('environment');

    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  return {
    videoRef,
    state,
    startCamera,
    stopStream,
    toggleTorch,
    switchCamera,
    captureFrame,
  };
}
