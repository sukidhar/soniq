import { useEffect, useRef, useState } from 'react';
import Soniq from '../core/soniq';
import { BaseVisualizer, BarVisualizer, WaveVisualizer, SpectrumVisualizer, ParticleVisualizer } from '../core/visualizers';

/** Available visualizer types */
export type VisualizerType = 'bar' | 'wave' | 'spectrum' | 'particle';

/**
 * Configuration options for the useSoniq hook
 */
export interface UseSoniqOptions {
  /** FFT size for audio analysis (power of 2) */
  fftSize?: number;
  /** Default color for visualizations */
  defaultColor?: string;
  /** Callback when recording is complete */
  onRecorded?: (blob: Blob) => void;
  /** Callback when microphone permissions fail */
  onPermissionsFailed?: (error: Error) => void;
  /** Initial visualizer type to use */
  initialVisualizer?: VisualizerType;
}

/**
 * React hook for audio visualization and recording
 * @param options Configuration options
 * @returns Object containing state and methods for audio recording and visualization
 */
export function useSoniq({
  fftSize = 512,
  defaultColor = '#0071e3',
  onRecorded = () => {},
  onPermissionsFailed = () => {},
  initialVisualizer = 'spectrum'
}: UseSoniqOptions = {}) {
  const soniqRef = useRef<Soniq | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSetup, setIsSetup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [visualizerType, setVisualizerType] = useState<VisualizerType>(initialVisualizer);
  const [error, setError] = useState<Error | null>(null);

  // Create visualizers
  const visualizers = useRef({
    bar: new BarVisualizer({ 
      defaultColor, 
      fftSize,
      barWidth: 3
    }),
    wave: new WaveVisualizer({
      defaultColor,
      fftSize
    }),
    spectrum: new SpectrumVisualizer({
      defaultColor,
      fftSize,
      barWidth: 4,
      barSpacing: 1,
      colorMode: 'rainbow'
    }),
    particle: new ParticleVisualizer({
      defaultColor,
      fftSize,
      particleCount: 150,
      particleMaxSize: 6,
      particleMinSize: 2,
      particleLifespan: 80,
      particleBaseSpeed: 1.5,
      colorMode: 'rainbow'
    })
  });

  // Initialize Soniq instance
  useEffect(() => {
    soniqRef.current = new Soniq({
      fftSize,
      defaultColor,
      visualizer: visualizers.current[visualizerType],
      onRecorded: (blob) => {
        setIsRecording(false);
        onRecorded(blob);
      },
      onPermissionsFailed: (err) => {
        setError(err);
        onPermissionsFailed(err);
      }
    });

    return () => {
      if (soniqRef.current) {
        soniqRef.current.destroy();
      }
    };
  }, [fftSize, defaultColor, visualizerType, onRecorded, onPermissionsFailed]);

  // Setup high-DPI canvas
  const setupHighDPICanvas = (canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    return dpr;
  };

  // Setup microphone and start visualizing
  const setup = async () => {
    if (!soniqRef.current || !canvasRef.current) return false;
    
    try {
      const success = await soniqRef.current.setup();
      
      if (success && canvasRef.current) {
        setupHighDPICanvas(canvasRef.current);
        soniqRef.current.visualize(canvasRef.current);
        setIsSetup(true);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };

  // Start recording
  const startRecording = () => {
    if (!soniqRef.current || !isSetup) return false;
    
    const success = soniqRef.current.record();
    if (success) {
      setIsRecording(true);
    }
    return success;
  };

  // Stop recording
  const stopRecording = () => {
    if (!soniqRef.current || !isRecording) return false;
    
    const success = soniqRef.current.stop();
    if (success) {
      setIsRecording(false);
    }
    return success;
  };

  // Cancel recording
  const cancelRecording = () => {
    if (!soniqRef.current || !isRecording) return false;
    
    const success = soniqRef.current.cancel();
    if (success) {
      setIsRecording(false);
    }
    return success;
  };

  // Change visualizer
  const changeVisualizer = (type: VisualizerType) => {
    if (!soniqRef.current || !canvasRef.current) return;
    
    setVisualizerType(type);
    soniqRef.current.setVisualizer(visualizers.current[type]);
    
    if (canvasRef.current && isSetup) {
      setupHighDPICanvas(canvasRef.current);
      soniqRef.current.visualize(canvasRef.current);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!soniqRef.current || !canvasRef.current || !isSetup) return;
      
      setupHighDPICanvas(canvasRef.current);
      soniqRef.current.visualize(canvasRef.current);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSetup]);

  return {
    /** Reference to the canvas element */
    canvasRef,
    /** Whether audio is set up and ready */
    isSetup,
    /** Whether recording is in progress */
    isRecording,
    /** Current visualizer type */
    visualizerType,
    /** Error if any occurred */
    error,
    /** Initialize audio and request permissions */
    setup,
    /** Start recording audio */
    startRecording,
    /** Stop recording and process audio */
    stopRecording,
    /** Cancel recording without processing */
    cancelRecording,
    /** Change the visualizer type */
    changeVisualizer
  };
}
