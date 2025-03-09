import { BaseVisualizer } from './BaseVisualizer';
import type { VisualizerOptions } from './BaseVisualizer';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  life: number;
  maxLife: number;
}

export interface ParticleVisualizerOptions extends VisualizerOptions {
  particleCount?: number;
  particleMaxSize?: number;
  particleMinSize?: number;
  particleLifespan?: number;
  particleBaseSpeed?: number;
  colorMode?: 'rainbow' | 'gradient' | 'single';
}

export class ParticleVisualizer extends BaseVisualizer {
  private particles: Particle[] = [];
  private particleCount: number;
  private particleMaxSize: number;
  private particleMinSize: number;
  private particleLifespan: number;
  private particleBaseSpeed: number;
  private colorMode: 'rainbow' | 'gradient' | 'single';
  private hue: number = 0;
  private bassValue: number = 0;
  private midValue: number = 0;
  private trebleValue: number = 0;

  constructor(options: ParticleVisualizerOptions = {}) {
    super(options);
    this.particleCount = options.particleCount || 100;
    this.particleMaxSize = options.particleMaxSize || 8;
    this.particleMinSize = options.particleMinSize || 2;
    this.particleLifespan = options.particleLifespan || 100;
    this.particleBaseSpeed = options.particleBaseSpeed || 1;
    this.colorMode = options.colorMode || 'rainbow';
  }

  private createParticle(canvas: HTMLCanvasElement, intensity: number): Particle {
    const displayWidth = canvas.width / this.dpr;
    const displayHeight = canvas.height / this.dpr;
    
    // Center position
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    
    // Random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Random distance from center (more likely to be near center)
    const distance = Math.random() * Math.random() * (displayWidth / 3);
    
    // Calculate position
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    // Size based on intensity
    const size = this.particleMinSize + (this.particleMaxSize - this.particleMinSize) * intensity;
    
    // Speed based on intensity and distance from center
    const speed = this.particleBaseSpeed * (1 + intensity) * (1 + distance / (displayWidth / 2));
    
    // Color based on frequency range and mode
    let color;
    if (this.colorMode === 'rainbow') {
      // Use HSL for rainbow effect
      const hue = (this.hue + Math.random() * 60) % 360;
      const saturation = 80 + intensity * 20;
      const lightness = 50 + intensity * 30;
      color = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
    } else if (this.colorMode === 'gradient') {
      // Use different colors for different frequency ranges
      if (Math.random() < 0.33) {
        // Bass - red/orange
        color = `rgba(255, ${Math.floor(100 + this.bassValue * 155)}, 50, 0.8)`;
      } else if (Math.random() < 0.66) {
        // Mid - green/yellow
        color = `rgba(${Math.floor(100 + this.midValue * 155)}, 255, 50, 0.8)`;
      } else {
        // Treble - blue/purple
        color = `rgba(50, ${Math.floor(100 + this.trebleValue * 155)}, 255, 0.8)`;
      }
    } else {
      // Single color with varying opacity
      color = this.options.defaultColor.replace('rgb', 'rgba').replace(')', `, ${0.3 + intensity * 0.7})`);
    }
    
    // Create particle
    return {
      x,
      y,
      size,
      color,
      speed,
      angle,
      life: 0,
      maxLife: this.particleLifespan + Math.random() * this.particleLifespan * 0.5
    };
  }

  private updateParticles(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, intensity: number): void {
    const displayWidth = canvas.width / this.dpr;
    const displayHeight = canvas.height / this.dpr;
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      
      // Update life
      p.life++;
      
      // Remove if out of bounds or expired
      if (
        p.x < -p.size || 
        p.x > displayWidth + p.size || 
        p.y < -p.size || 
        p.y > displayHeight + p.size ||
        p.life > p.maxLife
      ) {
        this.particles.splice(i, 1);
      }
    }
    
    // Add new particles based on intensity
    const particlesToAdd = Math.floor(this.particleCount * intensity * 0.2);
    for (let i = 0; i < particlesToAdd; i++) {
      if (this.particles.length < this.particleCount) {
        this.particles.push(this.createParticle(canvas, intensity));
      }
    }
  }

  private drawParticles(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    // Draw each particle
    for (const p of this.particles) {
      const opacity = 1 - (p.life / p.maxLife);
      
      // Draw particle
      ctx.globalAlpha = opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Optional: add glow effect
      ctx.globalAlpha = opacity * 0.5;
      ctx.filter = 'blur(3px)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
    }
    
    ctx.globalAlpha = 1;
  }

  private analyzeFrequencyRanges(): void {
    if (!this.analyser) return;
    
    // Divide frequency data into ranges (bass, mid, treble)
    const bassEnd = Math.floor(this.dataArray.length * 0.1);
    const midEnd = Math.floor(this.dataArray.length * 0.5);
    
    // Calculate average values for each range
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    
    for (let i = 0; i < bassEnd; i++) {
      bassSum += this.dataArray[i];
    }
    
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += this.dataArray[i];
    }
    
    for (let i = midEnd; i < this.dataArray.length; i++) {
      trebleSum += this.dataArray[i];
    }
    
    // Normalize values
    this.bassValue = bassSum / (bassEnd * 255);
    this.midValue = midSum / ((midEnd - bassEnd) * 255);
    this.trebleValue = trebleSum / ((this.dataArray.length - midEnd) * 255);
  }

  private animateParticles = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void => {
    if (!this.analyser) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.animateParticles(canvas, ctx);
    });

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Analyze frequency ranges
    this.analyzeFrequencyRanges();
    
    // Calculate overall intensity
    const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
    const intensity = average / 255;
    
    // Get the display dimensions
    const displayWidth = canvas.width / this.dpr;
    const displayHeight = canvas.height / this.dpr;
    
    // Clear the canvas with a semi-transparent black for trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Update hue for rainbow effect
    this.hue = (this.hue + 1) % 360;
    
    // Update and draw particles
    this.updateParticles(canvas, ctx, intensity);
    this.drawParticles(canvas, ctx);
  }

  public visualize(canvas: HTMLCanvasElement): boolean {
    if (!this.analyser || !canvas) return false;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return false;

    this.cleanup();
    
    // Set up high-DPI canvas
    this.setupHighDPICanvas(canvas);
    
    // Reset particles
    this.particles = [];
    this.hue = 0;
    
    // Set initial background
    const displayWidth = canvas.width / this.dpr;
    const displayHeight = canvas.height / this.dpr;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, displayWidth, displayHeight);
    
    // Start animation
    this.animateParticles(canvas, ctx);
    
    return true;
  }
} 