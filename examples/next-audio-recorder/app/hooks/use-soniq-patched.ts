'use client';

import { useEffect, useRef, useState } from 'react';
import Soniq from '../../../../src/core/soniq';
import { 
  BaseVisualizer, 
  BarVisualizer, 
  WaveVisualizer, 
  SpectrumVisualizer, 
  ParticleVisualizer 
} from '../../../../src/core/visualizers';

export type VisualizerType = 'bar' | 'wave' | 'spectrum' | 'particle';

interface UseSoniqOptions {
  fftSize?: number;
  defaultColor?: string;
  onRecorded?: (blob: Blob) => void;
  onPermissionsFailed?: (error: Error) => void;
  initialVisualizer?: VisualizerType;
}

export function useSoniqPatched({
  fftSize = 1024,
  defaultColor = '#0071e3',
  onRecorded = () => {},
  onPermissionsFailed = () => {},
  initialVisualizer = 'bar'
}: UseSoniqOptions = {}) {
  const soniqRef = useRef<Soniq | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      // Clean up resources
      if (soniqRef.current) {
        // Instead of calling destroy, do manual cleanup
        if ((soniqRef.current as any).stream) {
          (soniqRef.current as any).stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
          });
        }
        
        // Close audio context if it exists
        if ((soniqRef.current as any).audioContext) {
          try {
            (soniqRef.current as any).audioContext.close();
            console.log('Audio context closed');
          } catch (err) {
            console.error('Error closing audio context:', err);
          }
        }
        
        // Clean up visualizer
        if (visualizers.current[visualizerType]) {
          visualizers.current[visualizerType].cleanup();
        }
        
        soniqRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [fftSize, defaultColor, visualizerType, onRecorded, onPermissionsFailed]);

  // Direct visualization implementation
  const startDirectVisualization = () => {
    console.log('startDirectVisualization called');
    
    if (!canvasRef.current || !analyserRef.current) {
      console.error('Cannot start visualization: missing canvas or analyser', {
        hasCanvas: !!canvasRef.current,
        hasAnalyser: !!analyserRef.current
      });
      return;
    }
    
    console.log('Starting visualization with canvas and analyser');
    
    if (animationRef.current) {
      console.log('Canceling previous animation frame');
      cancelAnimationFrame(animationRef.current);
    }
    
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Cannot get 2D context from canvas');
      return;
    }
    
    // Set up high-DPI canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    console.log('Canvas dimensions:', {
      rect: `${rect.width}x${rect.height}`,
      dpr: dpr
    });
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // Create data array for frequency data
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    console.log('Frequency bin count:', analyser.frequencyBinCount);
    
    // Animation function based on visualizer type
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Get frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Check if we're getting audio data
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const avg = sum / dataArray.length;
      
      if (avg > 0) {
        console.log('Receiving audio data, average level:', avg.toFixed(2));
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      if (visualizerType === 'bar') {
        // Draw bars
        const barWidth = 3;
        const barSpacing = 1;
        const barCount = Math.min(100, Math.floor(rect.width / (barWidth + barSpacing)));
        const step = Math.floor(dataArray.length / barCount);
        
        ctx.fillStyle = defaultColor;
        
        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          const value = dataArray[dataIndex];
          const percent = value / 255;
          const height = percent * rect.height;
          const x = i * (barWidth + barSpacing);
          const y = rect.height - height;
          
          ctx.fillRect(x, y, barWidth, height);
        }
      } else if (visualizerType === 'wave') {
        // Draw wave
        const sliceWidth = rect.width / dataArray.length;
        
        ctx.beginPath();
        ctx.strokeStyle = defaultColor;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < dataArray.length; i++) {
          const value = dataArray[i];
          const percent = value / 255;
          const y = rect.height - (percent * rect.height);
          const x = i * sliceWidth;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      } else if (visualizerType === 'spectrum') {
        // Draw spectrum
        const barWidth = 4;
        const barSpacing = 1;
        const barCount = Math.min(100, Math.floor(rect.width / (barWidth + barSpacing)));
        const step = Math.floor(dataArray.length / barCount);
        
        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          const value = dataArray[dataIndex];
          const percent = value / 255;
          const height = percent * rect.height;
          const x = i * (barWidth + barSpacing);
          const y = rect.height - height;
          
          // Rainbow color
          const hue = (i / barCount) * 360;
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.fillRect(x, y, barWidth, height);
        }
      } else if (visualizerType === 'particle') {
        // Simple particle visualization
        const particleCount = 100;
        const maxSize = 5;
        
        for (let i = 0; i < particleCount; i++) {
          const dataIndex = Math.floor((i / particleCount) * dataArray.length);
          const value = dataArray[dataIndex];
          const percent = value / 255;
          
          const size = percent * maxSize;
          const x = Math.random() * rect.width;
          const y = Math.random() * rect.height;
          
          // Rainbow color
          const hue = (i / particleCount) * 360;
          ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${percent})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    
    console.log('Starting animation loop');
    animate();
  };

  // Setup microphone and start visualizing
  const setup = async () => {
    if (!canvasRef.current) return false;
    
    try {
      // Clean up previous resources
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Ensure audio context is running (needed for Safari)
      if (audioContext.state === 'suspended') {
        console.log('Audio context is suspended, attempting to resume');
        await audioContext.resume();
      }
      
      console.log('Audio context state:', audioContext.state);
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyserRef.current = analyser;
      
      // Connect source to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Set up recorder
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onRecorded(blob);
        setIsRecording(false);
      };
      
      // Store references
      soniqRef.current = {
        ...soniqRef.current,
        recorder,
        stream,
        analyser,
        audioContext
      } as any;
      
      // Start visualization immediately
      console.log('Starting visualization after setup');
      setTimeout(() => {
        startDirectVisualization();
        console.log('Visualization started with delay');
      }, 100);
      
      setIsSetup(true);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onPermissionsFailed(error);
      return false;
    }
  };

  // Start recording
  const startRecording = () => {
    if (!soniqRef.current || !isSetup) return false;
    
    try {
      (soniqRef.current as any).recorder.start();
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      return false;
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!soniqRef.current || !isRecording) return false;
    
    try {
      (soniqRef.current as any).recorder.stop();
      return true;
    } catch (err) {
      console.error('Failed to stop recording:', err);
      return false;
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (!soniqRef.current || !isRecording) return false;
    
    try {
      (soniqRef.current as any).recorder.stop();
      setIsRecording(false);
      return true;
    } catch (err) {
      console.error('Failed to cancel recording:', err);
      return false;
    }
  };

  // Change visualizer
  const changeVisualizer = (type: VisualizerType) => {
    setVisualizerType(type);
    
    // Restart visualization with new type
    if (isSetup) {
      startDirectVisualization();
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isSetup || isRecording || !canvasRef.current) return;
      startDirectVisualization();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSetup, isRecording]);

  return {
    canvasRef,
    isSetup,
    isRecording,
    visualizerType,
    error,
    setup,
    startRecording,
    stopRecording,
    cancelRecording,
    changeVisualizer,
    startVisualization: startDirectVisualization
  };
} 