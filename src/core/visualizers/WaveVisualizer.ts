import { BaseVisualizer } from './BaseVisualizer';
import type { VisualizerOptions } from './BaseVisualizer';

export class WaveVisualizer extends BaseVisualizer {
  constructor(options: VisualizerOptions = {}) {
    super(options);
  }

  private drawWave = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
    if (!this.analyser) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.drawWave(canvas, ctx);
    });

    // Use time domain data for waveform visualization
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    // Get the display dimensions (not the canvas dimensions which are scaled by DPR)
    const displayWidth = canvas.width / this.dpr;
    const displayHeight = canvas.height / this.dpr;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.options.defaultColor;
    ctx.beginPath();

    const sliceWidth = displayWidth / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * displayHeight / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(displayWidth, displayHeight / 2);
    ctx.stroke();
  }

  public visualize(canvas: HTMLCanvasElement): boolean {
    if (!this.analyser || !canvas) return false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    this.cleanup();
    
    // Set up high-DPI canvas
    this.setupHighDPICanvas(canvas);
    
    this.drawWave(canvas, ctx);
    return true;
  }
} 