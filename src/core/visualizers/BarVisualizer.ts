import { BaseVisualizer } from './BaseVisualizer';
import type { VisualizerOptions } from './BaseVisualizer';

export interface BarVisualizerOptions extends VisualizerOptions {
  barWidth?: number;
}

export class BarVisualizer extends BaseVisualizer {
  private xPosition: number = 0;
  private frameSkipTracker: number = 0;
  public barWidth: number;

  constructor(options: BarVisualizerOptions = {}) {
    super(options);
    this.barWidth = options.barWidth || 2;
  }

  private initializeDefaultBars(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const barHeight = 2;
    ctx.fillStyle = this.options.defaultColor;

    // Get the display width (not the canvas width which is scaled by DPR)
    const displayWidth = canvas.width / this.dpr;

    for (let x = 0; x < displayWidth; x += 4) {
      this.drawRoundedRect(ctx, x, canvas.height / (2 * this.dpr) - barHeight / 2, this.barWidth, barHeight);
    }
  }

  private updateBars = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
    if (!this.analyser) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.updateBars(canvas, ctx);
    });

    this.frameSkipTracker = (this.frameSkipTracker + 1) % 10;
    if (this.frameSkipTracker % 2 !== 0) return;

    this.analyser.getByteFrequencyData(this.dataArray);
    const rawAverage = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
    const normalizedAverage = Math.pow(rawAverage / 255, 1.8);

    // Get the display height (not the canvas height which is scaled by DPR)
    const displayHeight = canvas.height / this.dpr;

    let amplifiedHeight = Math.min(normalizedAverage * displayHeight * 1.5, 40);
    amplifiedHeight = Math.max(2, amplifiedHeight);

    ctx.clearRect(this.xPosition, 0, 3 * this.barWidth, displayHeight);
    ctx.fillStyle = `rgb(${100 + rawAverage}, 200, ${255 - rawAverage})`;

    this.drawRoundedRect(
      ctx, 
      this.xPosition, 
      displayHeight / 2 - amplifiedHeight / 2, 
      this.barWidth, 
      amplifiedHeight
    );

    this.xPosition += 2 * this.barWidth;
    // Get the display width (not the canvas width which is scaled by DPR)
    const displayWidth = canvas.width / this.dpr;
    if (this.xPosition >= displayWidth) {
      this.xPosition = 0;
    }
  }

  public visualize(canvas: HTMLCanvasElement): boolean {
    if (!this.analyser || !canvas) return false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    this.cleanup();

    // Set up high-DPI canvas
    this.setupHighDPICanvas(canvas);

    // Reset position
    this.xPosition = 0;

    this.initializeDefaultBars(canvas, ctx);
    this.updateBars(canvas, ctx);

    return true;
  }
} 