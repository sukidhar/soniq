import { BaseVisualizer, BarVisualizer } from './visualizers';

// Define types for options and callbacks
interface SoniqOptions {
  fftSize?: number;
  defaultColor?: string;
  onRecorded?: (blob: Blob) => void;
  onPermissionsFailed?: (error: Error) => void;
  visualizer?: BaseVisualizer;
}

class Soniq {
  // Private properties with proper typing
  private recorder: MediaRecorder | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: BlobPart[] = [];
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;
  private options: Required<Omit<SoniqOptions, 'visualizer'>> & { visualizer: BaseVisualizer };

  constructor(options: SoniqOptions = {}) {
    // Create default visualizer if none provided
    const visualizer = options.visualizer || new BarVisualizer({
      fftSize: options.fftSize,
      defaultColor: options.defaultColor
    });

    // Set default options
    this.options = {
      fftSize: options.fftSize || 64,
      defaultColor: options.defaultColor || "rgb(208, 213, 221)",
      onRecorded: options.onRecorded || ((blob: Blob) => {}),
      onPermissionsFailed: options.onPermissionsFailed || (() => {}),
      visualizer
    };

    // Check for AudioContext support
    if (!(window.AudioContext || (window as any).webkitAudioContext)) {
      throw new Error("AudioContext is not supported in this browser");
    }
  }

  private cleanup(): void {
    this.options.visualizer.cleanup();

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
    }

    if (this.context) {
      this.context.close();
    }

    this.stream = null;
    this.recorder = null;
    this.analyser = null;
    this.chunks = [];
    this.isRecording = false;
  }

  // Public methods
  public async setup(): Promise<boolean> {
    try {
      this.cleanup();

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = this.options.fftSize;

      const source = this.context.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Set the analyser in the visualizer
      this.options.visualizer.setAnalyser(this.analyser);

      this.recorder = new MediaRecorder(this.stream);

      this.recorder.ondataavailable = (event: BlobEvent) => {
        if (this.isRecording) {
          this.chunks.push(event.data);
        }
      };

      this.recorder.onstop = () => {
        if (!this.isRecording) return;
        const blob = new Blob(this.chunks, { type: "audio/mp3" });
        this.options.onRecorded(blob);
        this.cleanup();
      };

      return true;
    } catch (error) {
      this.options.onPermissionsFailed(error instanceof Error ? error : new Error(String(error)));
      this.cleanup();
      return false;
    }
  }

  public record(): boolean {
    if (!this.recorder) return false;
    try {
      this.recorder.start();
      this.isRecording = true;
      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      return false;
    }
  }

  public stop(): boolean {
    if (!this.recorder || !this.isRecording) return false;
    try {
      this.recorder.stop();
      return true;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      return false;
    }
  }

  public cancel(): boolean {
    if (!this.recorder || !this.isRecording) return false;
    try {
      this.isRecording = false;
      this.recorder.stop();
      this.cleanup();
      return true;
    } catch (error) {
      console.error("Failed to cancel recording:", error);
      return false;
    }
  }

  public visualize(canvas: HTMLCanvasElement): boolean {
    return this.options.visualizer.visualize(canvas);
  }

  public setVisualizer(visualizer: BaseVisualizer): void {
    // Clean up the current visualizer
    this.options.visualizer.cleanup();
    
    // Set the new visualizer
    this.options.visualizer = visualizer;
    
    // If we have an active analyser, set it in the new visualizer
    if (this.analyser) {
      visualizer.setAnalyser(this.analyser);
    }
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  public destroy(): void {
    this.cleanup();
  }
}

export default Soniq;
