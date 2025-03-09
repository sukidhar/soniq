import { BaseVisualizer } from './BaseVisualizer';
import type { VisualizerOptions } from './BaseVisualizer';

export interface SpectrumVisualizerOptions extends VisualizerOptions {
  barWidth?: number;
  barSpacing?: number;
  colorMode?: 'rainbow' | 'gradient' | 'single';
  gradientStart?: string;
  gradientEnd?: string;
}

export class SpectrumVisualizer extends BaseVisualizer {
  private barWidth: number;
  private barSpacing: number;
  private colorMode: 'rainbow' | 'gradient' | 'single';
  private gradientStart: string;
  private gradientEnd: string;
  private smoothedArray: Float32Array;

  constructor(options: SpectrumVisualizerOptions = {}) {
    super(options);
    this.barWidth = options.barWidth || 4;
    this.barSpacing = options.barSpacing || 1;
    this.colorMode = options.colorMode || 'rainbow';
    this.gradientStart = options.gradientStart || '#00FFFF';
    this.gradientEnd = options.gradientEnd || '#FF00FF';
    this.smoothedArray = new Float32Array(0);
  }

  private getColor(index: number, total: number, intensity: number): string {
    switch (this.colorMode) {
      case 'rainbow':
        const hue = (index / total) * 360;
        const saturation = 80 + intensity * 20;
        const lightness = 40 + intensity * 30;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      case 'gradient':
        // Create a gradient from start to end color
        return this.interpolateColor(this.gradientStart, this.gradientEnd, index / total);
      
      case 'single':
      default:
        // Use the default color with varying opacity based on intensity
        return this.options.defaultColor;
    }
  }

  private interpolateColor(startColor: string, endColor: string, factor: number): string {
    // Simple RGB interpolation
    const start = this.hexToRgb(startColor);
    const end = this.hexToRgb(endColor);
    
    if (!start || !end) return startColor;
    
    const r = Math.round(start.r + factor * (end.r - start.r));
    const g = Math.round(start.g + factor * (end.g - start.g));
    const b = Math.round(start.b + factor * (end.b - start.b));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    // Convert hex to RGB
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private drawSpectrum = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
    if (!this.analyser) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.drawSpectrum(canvas, ctx);
    });

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Get the display dimensions
    const displayWidth = canvas.width / this.dpr;
    const displayHeight = canvas.height / this.dpr;
    
    // Clear the canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Calculate how many bars we can fit
    const totalBars = Math.min(
      Math.floor(displayWidth / (this.barWidth + this.barSpacing)),
      this.dataArray.length
    );
    
    // Apply smoothing to the data
    if (this.smoothedArray.length !== this.dataArray.length) {
      this.smoothedArray = new Float32Array(this.dataArray.length);
      for (let i = 0; i < this.dataArray.length; i++) {
        this.smoothedArray[i] = this.dataArray[i];
      }
    } else {
      // Apply smoothing with a factor of 0.8 (80% previous value, 20% new value)
      for (let i = 0; i < this.dataArray.length; i++) {
        this.smoothedArray[i] = this.smoothedArray[i] * 0.8 + this.dataArray[i] * 0.2;
      }
    }
    
    // Draw each bar
    for (let i = 0; i < totalBars; i++) {
      // Map the data index to the available bars
      const dataIndex = Math.floor(i * (this.dataArray.length / totalBars));
      
      // Get the value and normalize it
      const value = this.smoothedArray[dataIndex];
      const normalizedValue = value / 255;
      
      // Calculate bar height
      const barHeight = normalizedValue * displayHeight;
      
      // Calculate x position
      const x = i * (this.barWidth + this.barSpacing);
      
      // Set color based on the frequency
      ctx.fillStyle = this.getColor(i, totalBars, normalizedValue);
      
      // Draw the bar
      this.drawRoundedRect(
        ctx,
        x,
        displayHeight - barHeight,
        this.barWidth,
        barHeight,
        this.barWidth / 2
      );
      
      // Add a reflection effect
      ctx.fillStyle = this.getColor(i, totalBars, normalizedValue * 0.3);
      this.drawRoundedRect(
        ctx,
        x,
        displayHeight,
        this.barWidth,
        barHeight * 0.2,
        this.barWidth / 2
      );
    }
  }

  public visualize(canvas: HTMLCanvasElement): boolean {
    if (!this.analyser || !canvas) return false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    this.cleanup();
    
    // Set up high-DPI canvas
    this.setupHighDPICanvas(canvas);
    
    // Initialize smoothed array
    this.smoothedArray = new Float32Array(this.analyser.frequencyBinCount);
    
    // Start animation
    this.drawSpectrum(canvas, ctx);
    
    return true;
  }
} 