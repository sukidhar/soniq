'use client';

import { useEffect, useState, useRef } from 'react';
import Soniq from '../../../../src/core/soniq';
import { 
  BarVisualizer, 
  WaveVisualizer, 
  SpectrumVisualizer, 
  ParticleVisualizer 
} from '../../../../src/core/visualizers';

type VisualizerType = 'bar' | 'wave' | 'spectrum' | 'particle';

export default function AudioRecorder() {
  const [recordings, setRecordings] = useState<{ url: string; timestamp: string }[]>([]);
  const [isSetup, setIsSetup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [visualizerType, setVisualizerType] = useState<VisualizerType>('bar');
  const [error, setError] = useState<Error | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const soniqRef = useRef<Soniq | null>(null);
  
  // Create visualizers
  const visualizers = useRef({
    bar: new BarVisualizer({ 
      defaultColor: '#0071e3', 
      fftSize: 1024,
      barWidth: 3
    }),
    wave: new WaveVisualizer({
      defaultColor: '#0071e3',
      fftSize: 1024
    }),
    spectrum: new SpectrumVisualizer({
      defaultColor: '#0071e3',
      fftSize: 1024,
      barWidth: 4,
      barSpacing: 1,
      colorMode: 'rainbow'
    }),
    particle: new ParticleVisualizer({
      defaultColor: '#0071e3',
      fftSize: 1024,
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
    // Clean up previous instance if it exists
    if (soniqRef.current) {
      soniqRef.current.destroy();
    }
    
    // Create new instance
    soniqRef.current = new Soniq({
      fftSize: 1024,
      defaultColor: '#0071e3',
      visualizer: visualizers.current[visualizerType],
      onRecorded: (blob) => {
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toLocaleTimeString();
        setRecordings(prev => [...prev, { url, timestamp }]);
        setIsRecording(false);
      },
      onPermissionsFailed: (err) => {
        setError(err);
      }
    });

    // If already set up, re-visualize with new visualizer
    if (isSetup && canvasRef.current && soniqRef.current) {
      // Need to re-setup since we created a new instance
      soniqRef.current.setup().then(success => {
        if (success && canvasRef.current && soniqRef.current) {
          setupHighDPICanvas(canvasRef.current);
          soniqRef.current.visualize(canvasRef.current);
        }
      }).catch(err => {
        setError(err instanceof Error ? err : new Error(String(err)));
      });
    }

    return () => {
      if (soniqRef.current) {
        soniqRef.current.destroy();
      }
    };
  }, [visualizerType, isSetup]);

  // Set up high-DPI canvas
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
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !isSetup) return;
      
      setupHighDPICanvas(canvasRef.current);
      if (soniqRef.current) {
        soniqRef.current.visualize(canvasRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isSetup]);

  // Setup microphone and start visualizing
  const handleSetup = async () => {
    if (!soniqRef.current || !canvasRef.current) return;
    
    try {
      // First, ensure the canvas is properly set up
      setupHighDPICanvas(canvasRef.current);
      
      // Then set up the audio
      const success = await soniqRef.current.setup();
      
      if (success && canvasRef.current) {
        // Start visualization
        soniqRef.current.visualize(canvasRef.current);
        setIsSetup(true);
        
        // Force a resize to ensure proper rendering
        window.dispatchEvent(new Event('resize'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Start recording
  const handleStartRecording = () => {
    if (!soniqRef.current || !isSetup) return;
    
    const success = soniqRef.current.record();
    if (success) {
      setIsRecording(true);
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (!soniqRef.current || !isRecording) return;
    
    soniqRef.current.stop();
  };

  // Cancel recording
  const handleCancelRecording = () => {
    if (!soniqRef.current || !isRecording) return;
    
    soniqRef.current.cancel();
    setIsRecording(false);
  };

  // Change visualizer
  const handleChangeVisualizer = (type: VisualizerType) => {
    if (type === visualizerType) return;
    
    // Just update the state, the effect will handle the rest
    setVisualizerType(type);
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      recordings.forEach(recording => URL.revokeObjectURL(recording.url));
    };
  }, [recordings]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Next.js Audio Recorder</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full">
          <p>{error.message}</p>
        </div>
      )}
      
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-6 border border-gray-300">
        <canvas 
          ref={canvasRef} 
          className="w-full h-48"
          style={{ 
            background: 'rgba(0, 0, 0, 0.05)',
            display: 'block'
          }}
        />
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        Status: {isSetup ? 'Microphone ready' : 'Waiting for microphone setup'} | 
        Visualizer: {visualizerType} | 
        Recording: {isRecording ? 'Yes' : 'No'}
      </div>
      
      <div className="flex gap-4 mb-6">
        {!isSetup ? (
          <button
            onClick={handleSetup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Setup Microphone
          </button>
        ) : (
          <>
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Start Recording
              </button>
            ) : (
              <>
                <button
                  onClick={handleStopRecording}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Stop Recording
                </button>
                <button
                  onClick={handleCancelRecording}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </>
        )}
      </div>
      
      <div className="w-full mb-6">
        <label htmlFor="visualizer-type" className="block mb-2 text-sm font-medium">
          Visualizer Type
        </label>
        <select
          id="visualizer-type"
          value={visualizerType}
          onChange={(e) => handleChangeVisualizer(e.target.value as VisualizerType)}
          disabled={!isSetup || isRecording}
          className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full"
        >
          <option value="bar">Bar</option>
          <option value="wave">Wave</option>
          <option value="spectrum">Spectrum</option>
          <option value="particle">Particle</option>
        </select>
      </div>
      
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Recordings</h2>
        {recordings.length === 0 ? (
          <p className="text-gray-500">No recordings yet</p>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording, index) => (
              <div key={index} className="p-4 border rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Recorded at {recording.timestamp}</span>
                </div>
                <audio controls src={recording.url} className="w-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 