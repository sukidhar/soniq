import { BaseVisualizer, BarVisualizer } from './visualizers';

/**
 * Options for configuring a Soniq instance
 */
interface SoniqOptions {
  /** FFT size for audio analysis (power of 2) */
  fftSize?: number;
  /** Default color for visualizations */
  defaultColor?: string;
  /** Callback when recording is complete */
  onRecorded?: (blob: Blob) => void;
  /** Callback when microphone permissions fail */
  onPermissionsFailed?: (error: Error) => void;
  /** Visualizer to use */
  visualizer?: BaseVisualizer;
}

/**
 * Audio visualization and recording manager
 */
class Soniq {
  // Private properties with proper typing
  private recorder: MediaRecorder | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: BlobPart[] = [];
  private isRecording: boolean = false;
  private stream: MediaStream | null = null;
  private options: Required<Omit<SoniqOptions, 'visualizer'>> & { visualizer: BaseVisualizer };

  /**
   * Creates a new Soniq instance
   * @param options Configuration options
   */
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

  /**
   * Sets up audio context and requests microphone permissions
   * @returns Promise resolving to true if setup was successful
   */
  public async setup(): Promise<boolean> {
    try {
      this.cleanup();

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
      
      // Ensure the audio context is running (needed for Safari)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
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

  /**
   * Starts audio recording
   * @returns True if recording started successfully
   */
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

  /**
   * Stops recording and processes the audio
   * @returns True if recording stopped successfully
   */
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

  /**
   * Cancels recording without processing the audio
   * @returns True if recording was cancelled successfully
   */
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

  /**
   * Starts visualization on the provided canvas
   * @param canvas Canvas element to visualize on
   * @returns True if visualization started successfully
   */
  public visualize(canvas: HTMLCanvasElement): boolean {
    if (!this.analyser || !this.options.visualizer) {
      return false;
    }
    
    // Ensure the audio context is running (needed for Safari)
    if (this.context && this.context.state === 'suspended') {
      this.context.resume().catch(err => {
        console.error('Failed to resume audio context:', err);
      });
    }
    
    // Ensure the visualizer has the analyser
    this.options.visualizer.setAnalyser(this.analyser);
    
    // Start visualization
    return this.options.visualizer.visualize(canvas);
  }

  /**
   * Changes the active visualizer
   * @param visualizer New visualizer to use
   */
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

  /**
   * Checks if recording is in progress
   * @returns True if currently recording
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Cleans up resources and stops all processes
   */
  public destroy(): void {
    this.cleanup();
  }
}

export default Soniq;
