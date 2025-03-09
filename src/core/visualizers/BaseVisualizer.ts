export interface VisualizerOptions {
  defaultColor?: string;
  fftSize?: number;
}

export abstract class BaseVisualizer {
  protected analyser: AnalyserNode | null = null;
  protected animationFrameId: number | null = null;
  protected dataArray: Uint8Array = new Uint8Array();
  protected options: Required<VisualizerOptions>;
  protected dpr: number = 1; // Device pixel ratio

  constructor(options: VisualizerOptions = {}) {
    this.options = {
      defaultColor: options.defaultColor || "rgb(208, 213, 221)",
      fftSize: options.fftSize || 64
    };
  }

  public setAnalyser(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.analyser.fftSize = this.options.fftSize;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  public abstract visualize(canvas: HTMLCanvasElement): boolean;

  public cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Sets up the canvas for high-DPI displays
   * @param canvas The canvas element to set up
   * @returns The device pixel ratio
   */
  protected setupHighDPICanvas(canvas: HTMLCanvasElement): number {
    // Get the device pixel ratio
    this.dpr = window.devicePixelRatio || 1;
    
    // Get the canvas size from CSS
    const rect = canvas.getBoundingClientRect();
    
    // Set the canvas dimensions to match its CSS dimensions multiplied by the device pixel ratio
    canvas.width = rect.width * this.dpr;
    canvas.height = rect.height * this.dpr;
    
    // Scale the canvas context to ensure correct drawing operations
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(this.dpr, this.dpr);
    }
    
    return this.dpr;
  }

  protected drawRoundedRect(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number = 2
  ): void {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.closePath();
    ctx.fill();
  }
} 