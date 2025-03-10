import { describe, test, expect, mock, spyOn } from 'bun:test';
import Soniq from '../../src/core/soniq';
import { BarVisualizer } from '../../src/core/visualizers';

// Mock the browser environment
globalThis.window = {
  AudioContext: class MockAudioContext {
    createAnalyser() {
      return {
        fftSize: 0,
        connect: () => {}
      };
    }
    
    createMediaStreamSource() {
      return {
        connect: () => {}
      };
    }
    
    close() {}
    
    resume() {
      return Promise.resolve();
    }
    
    state = 'running';
  },
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {}
} as any;

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  
  constructor(public stream: any) {}
  
  start() {}
  stop() {
    if (this.onstop) this.onstop();
  }
}

// Mock navigator.mediaDevices
const mockGetUserMedia = mock(() => {
  return Promise.resolve({
    getTracks: () => [{
      stop: () => {}
    }]
  });
});

// Setup global mocks
globalThis.MediaRecorder = MockMediaRecorder as any;
globalThis.navigator = {
  ...globalThis.navigator,
  mediaDevices: {
    getUserMedia: mockGetUserMedia
  }
} as any;

describe('Soniq', () => {
  test('should initialize with default options', () => {
    const soniq = new Soniq();
    expect(soniq).toBeDefined();
  });
  
  test('should initialize with custom options', () => {
    const visualizer = new BarVisualizer();
    const onRecorded = () => {};
    const onPermissionsFailed = () => {};
    
    const soniq = new Soniq({
      fftSize: 1024,
      defaultColor: '#ff0000',
      visualizer,
      onRecorded,
      onPermissionsFailed
    });
    
    expect(soniq).toBeDefined();
  });
  
  test('setup should request user media and initialize audio context', async () => {
    const soniq = new Soniq();
    const result = await soniq.setup();
    
    expect(result).toBe(true);
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true });
  });
  
  test('record should start recording', () => {
    const soniq = new Soniq();
    
    // Setup first
    soniq.setup();
    
    // Mock the recorder
    const mockRecorder = new MockMediaRecorder({});
    const startSpy = spyOn(mockRecorder, 'start');
    (soniq as any).recorder = mockRecorder;
    
    const result = soniq.record();
    
    expect(result).toBe(true);
    expect(startSpy).toHaveBeenCalled();
  });
  
  test('stop should stop recording', () => {
    const soniq = new Soniq();
    
    // Setup first
    soniq.setup();
    
    // Mock the recorder
    const mockRecorder = new MockMediaRecorder({});
    const stopSpy = spyOn(mockRecorder, 'stop');
    (soniq as any).recorder = mockRecorder;
    (soniq as any).isRecording = true;
    
    const result = soniq.stop();
    
    expect(result).toBe(true);
    expect(stopSpy).toHaveBeenCalled();
  });
  
  test('cancel should stop recording and clean up', () => {
    const soniq = new Soniq();
    
    // Setup first
    soniq.setup();
    
    // Mock the recorder
    const mockRecorder = new MockMediaRecorder({});
    const stopSpy = spyOn(mockRecorder, 'stop');
    (soniq as any).recorder = mockRecorder;
    (soniq as any).isRecording = true;
    
    const result = soniq.cancel();
    
    expect(result).toBe(true);
    expect(stopSpy).toHaveBeenCalled();
    expect((soniq as any).isRecording).toBe(false);
  });
  
  test('visualize should call visualizer.visualize', () => {
    const visualizer = new BarVisualizer();
    const visualizeSpy = spyOn(visualizer, 'visualize').mockImplementation(() => true);
    
    const soniq = new Soniq({ visualizer });
    
    // Setup first
    soniq.setup();
    
    // Mock the analyser
    (soniq as any).analyser = { fftSize: 512 };
    
    const canvas = {} as HTMLCanvasElement;
    const result = soniq.visualize(canvas);
    
    expect(result).toBe(true);
    expect(visualizeSpy).toHaveBeenCalledWith(canvas);
  });
  
  test('setVisualizer should change the visualizer', () => {
    const oldVisualizer = new BarVisualizer();
    const newVisualizer = new BarVisualizer();
    
    const cleanupSpy = spyOn(oldVisualizer, 'cleanup');
    const setAnalyserSpy = spyOn(newVisualizer, 'setAnalyser');
    
    const soniq = new Soniq({ visualizer: oldVisualizer });
    
    // Setup first
    soniq.setup();
    
    // Mock the analyser
    (soniq as any).analyser = { fftSize: 512 };
    
    soniq.setVisualizer(newVisualizer);
    
    expect(cleanupSpy).toHaveBeenCalled();
    expect(setAnalyserSpy).toHaveBeenCalled();
  });
  
  test('destroy should clean up resources', () => {
    const soniq = new Soniq();
    
    // Mock the stream and context directly
    const mockTrackStop = mock();
    const mockContextClose = mock();
    
    (soniq as any).stream = {
      getTracks: () => [{
        stop: mockTrackStop
      }]
    };
    
    (soniq as any).context = {
      close: mockContextClose
    };
    
    soniq.destroy();
    
    expect(mockTrackStop).toHaveBeenCalled();
    expect(mockContextClose).toHaveBeenCalled();
  });
}); 