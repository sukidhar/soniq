import { describe, test, expect, mock, spyOn } from 'bun:test';
import { 
  BaseVisualizer, 
  BarVisualizer, 
  WaveVisualizer, 
  SpectrumVisualizer, 
  ParticleVisualizer 
} from '../../src/core/visualizers';

// Mock AnalyserNode
class MockAnalyserNode {
  fftSize = 0;
  frequencyBinCount = 256;
  
  getByteFrequencyData(array: Uint8Array) {
    // Fill with random data
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
}

// Mock Canvas and Context
class MockCanvasContext {
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  
  scale() {}
  clearRect() {}
  fillRect() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  stroke() {}
  arc() {}
  fill() {}
  closePath() {}
  
  // Add roundRect for BarVisualizer
  roundRect(x: number, y: number, width: number, height: number, radius: number) {
    // Just a mock implementation
    return this;
  }
}

class MockCanvas {
  width = 300;
  height = 150;
  style = { width: '300px', height: '150px' };
  
  getContext() {
    return new MockCanvasContext();
  }
  
  getBoundingClientRect() {
    return { width: 300, height: 150 };
  }
}

// Mock global functions
const mockRequestAnimationFrame = mock((callback: FrameRequestCallback) => {
  callback(0);
  return 0;
});

const mockCancelAnimationFrame = mock();

// Add to global scope
globalThis.window = {
  ...globalThis.window,
  devicePixelRatio: 1
} as any;

globalThis.requestAnimationFrame = mockRequestAnimationFrame;
globalThis.cancelAnimationFrame = mockCancelAnimationFrame;

describe('Visualizers', () => {
  describe('BaseVisualizer', () => {
    test('should initialize with default options', () => {
      const visualizer = new class extends BaseVisualizer {
        visualize() { return true; }
      }();
      
      expect(visualizer).toBeDefined();
    });
    
    test('should initialize with custom options', () => {
      const visualizer = new class extends BaseVisualizer {
        visualize() { return true; }
      }({ 
        defaultColor: '#ff0000',
        fftSize: 1024
      });
      
      expect(visualizer).toBeDefined();
    });
    
    test('setAnalyser should set the analyser', () => {
      const visualizer = new class extends BaseVisualizer {
        visualize() { return true; }
      }();
      
      const analyser = new MockAnalyserNode();
      visualizer.setAnalyser(analyser as any);
      
      expect((visualizer as any).analyser).toBe(analyser);
    });
    
    test('cleanup should cancel animation frame', () => {
      const visualizer = new class extends BaseVisualizer {
        visualize() { return true; }
      }();
      
      (visualizer as any).animationFrameId = 123;
      
      visualizer.cleanup();
      
      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123);
      expect((visualizer as any).animationFrameId).toBeNull();
    });
  });
  
  describe('BarVisualizer', () => {
    test('should initialize with default options', () => {
      const visualizer = new BarVisualizer();
      expect(visualizer).toBeDefined();
    });
    
    test('should initialize with custom options', () => {
      const visualizer = new BarVisualizer({ 
        defaultColor: '#ff0000',
        fftSize: 1024,
        barWidth: 5
      });
      
      expect(visualizer).toBeDefined();
      expect((visualizer as any).barWidth).toBe(5);
    });
    
    test('visualize should set up animation loop', () => {
      // Reset mock
      mockRequestAnimationFrame.mockClear();
      
      const visualizer = new BarVisualizer();
      const analyser = new MockAnalyserNode();
      visualizer.setAnalyser(analyser as any);
      
      const canvas = new MockCanvas();
      
      // Mock the internal methods to avoid errors
      (visualizer as any).initializeDefaultBars = mock();
      (visualizer as any).updateBars = mock();
      
      const result = visualizer.visualize(canvas as any);
      
      expect(result).toBe(true);
      expect((visualizer as any).initializeDefaultBars).toHaveBeenCalled();
      expect((visualizer as any).updateBars).toHaveBeenCalled();
    });
  });
  
  describe('WaveVisualizer', () => {
    test('should initialize with default options', () => {
      const visualizer = new WaveVisualizer();
      expect(visualizer).toBeDefined();
    });
    
    test('visualize should set up animation loop', () => {
      // Reset mock
      mockRequestAnimationFrame.mockClear();
      
      const visualizer = new WaveVisualizer();
      const analyser = new MockAnalyserNode();
      visualizer.setAnalyser(analyser as any);
      
      const canvas = new MockCanvas();
      
      // Mock the internal methods to avoid errors
      (visualizer as any).drawWave = mock();
      
      const result = visualizer.visualize(canvas as any);
      
      expect(result).toBe(true);
      expect((visualizer as any).drawWave).toHaveBeenCalled();
    });
  });
  
  describe('SpectrumVisualizer', () => {
    test('should initialize with default options', () => {
      const visualizer = new SpectrumVisualizer();
      expect(visualizer).toBeDefined();
    });
    
    test('visualize should set up animation loop', () => {
      // Reset mock
      mockRequestAnimationFrame.mockClear();
      
      const visualizer = new SpectrumVisualizer();
      const analyser = new MockAnalyserNode();
      visualizer.setAnalyser(analyser as any);
      
      const canvas = new MockCanvas();
      
      // Mock the internal methods to avoid errors
      (visualizer as any).drawSpectrum = mock();
      
      const result = visualizer.visualize(canvas as any);
      
      expect(result).toBe(true);
      expect((visualizer as any).drawSpectrum).toHaveBeenCalled();
    });
  });
  
  describe('ParticleVisualizer', () => {
    test('should initialize with default options', () => {
      const visualizer = new ParticleVisualizer();
      expect(visualizer).toBeDefined();
    });
    
    test('visualize should set up animation loop', () => {
      // Reset mock
      mockRequestAnimationFrame.mockClear();
      
      const visualizer = new ParticleVisualizer();
      const analyser = new MockAnalyserNode();
      visualizer.setAnalyser(analyser as any);
      
      const canvas = new MockCanvas();
      
      // Mock the internal methods to avoid errors
      (visualizer as any).animateParticles = mock();
      
      const result = visualizer.visualize(canvas as any);
      
      expect(result).toBe(true);
      expect((visualizer as any).animateParticles).toHaveBeenCalled();
    });
  });
}); 