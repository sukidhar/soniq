import Soniq from '../../../src/core/soniq';
import { 
  BarVisualizer, 
  WaveVisualizer, 
  SpectrumVisualizer, 
  ParticleVisualizer 
} from '../../../src/core/visualizers';

// DOM Elements
const setupBtn = document.getElementById('setup-btn') as HTMLButtonElement;
const recordBtn = document.getElementById('record-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const visualizerCanvas = document.getElementById('visualizer') as HTMLCanvasElement;
const visualizerSelect = document.getElementById('visualizer-type') as HTMLSelectElement;
const recordingsList = document.getElementById('recordings-list') as HTMLDivElement;

// Set up high-DPI canvas
function setupHighDPICanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  // Set the canvas dimensions to match its CSS dimensions
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  // Scale the canvas context to ensure correct drawing operations
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  
  // Set CSS display dimensions (unchanged)
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  
  return dpr;
}

// Initialize visualizers with higher resolution settings
const barVisualizer = new BarVisualizer({ 
  defaultColor: '#0071e3',
  fftSize: 256,
  barWidth: 3
});

const waveVisualizer = new WaveVisualizer({
  defaultColor: '#0071e3',
  fftSize: 256
});

const spectrumVisualizer = new SpectrumVisualizer({
  defaultColor: '#0071e3',
  fftSize: 512,
  barWidth: 4,
  barSpacing: 1,
  colorMode: 'rainbow'
});

const particleVisualizer = new ParticleVisualizer({
  defaultColor: '#0071e3',
  fftSize: 512,
  particleCount: 150,
  particleMaxSize: 6,
  particleMinSize: 2,
  particleLifespan: 80,
  particleBaseSpeed: 1.5,
  colorMode: 'rainbow'
});

// Initialize Soniq with default visualizer
let soniq = new Soniq({
  fftSize: 512, // Increased for more detail
  defaultColor: '#0071e3',
  visualizer: spectrumVisualizer, // Changed default to spectrum visualizer
  onRecorded: handleRecordedAudio,
  onPermissionsFailed: handlePermissionError
});

// Event listeners
setupBtn.addEventListener('click', setupMicrophone);
recordBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
cancelBtn.addEventListener('click', cancelRecording);
visualizerSelect.addEventListener('change', changeVisualizer);

// Functions
async function setupMicrophone() {
  setupBtn.disabled = true;
  setupBtn.textContent = 'Setting up...';
  
  try {
    const success = await soniq.setup();
    
    if (success) {
      setupBtn.textContent = 'Microphone Ready';
      recordBtn.disabled = false;
      
      // Set up high-DPI canvas before visualizing
      setupHighDPICanvas(visualizerCanvas);
      
      // Start visualizing
      soniq.visualize(visualizerCanvas);
    } else {
      setupBtn.textContent = 'Setup Failed';
      setupBtn.disabled = false;
    }
  } catch (error) {
    console.error('Setup error:', error);
    setupBtn.textContent = 'Setup Failed';
    setupBtn.disabled = false;
  }
}

function startRecording() {
  if (soniq.record()) {
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    cancelBtn.disabled = false;
  }
}

function stopRecording() {
  if (soniq.stop()) {
    resetRecordingButtons();
  }
}

function cancelRecording() {
  if (soniq.cancel()) {
    resetRecordingButtons();
  }
}

function resetRecordingButtons() {
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  cancelBtn.disabled = true;
}

function handleRecordedAudio(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  const recordingItem = document.createElement('div');
  recordingItem.className = 'recording-item';
  
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = url;
  
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `recording-${timestamp}.mp3`;
  downloadLink.textContent = 'Download';
  downloadLink.className = 'download-btn';
  
  recordingItem.appendChild(audio);
  recordingItem.appendChild(downloadLink);
  recordingsList.prepend(recordingItem);
  
  // Setup microphone again for next recording
  setupMicrophone();
}

function handlePermissionError(error: Error) {
  console.error('Permission error:', error);
  alert(`Microphone permission denied: ${error.message}`);
  setupBtn.textContent = 'Setup Failed';
  setupBtn.disabled = false;
}

function changeVisualizer() {
  const visualizerType = visualizerSelect.value;
  
  // Set up high-DPI canvas before changing visualizer
  setupHighDPICanvas(visualizerCanvas);
  
  switch (visualizerType) {
    case 'bar':
      soniq.setVisualizer(barVisualizer);
      break;
    case 'wave':
      soniq.setVisualizer(waveVisualizer);
      break;
    case 'spectrum':
      soniq.setVisualizer(spectrumVisualizer);
      break;
    case 'particle':
      soniq.setVisualizer(particleVisualizer);
      break;
  }
  
  // Re-visualize with the new visualizer
  soniq.visualize(visualizerCanvas);
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  soniq.destroy();
});

// Set up high-DPI canvas on window resize
window.addEventListener('resize', () => {
  if (soniq.isCurrentlyRecording()) return; // Don't resize during recording
  
  setupHighDPICanvas(visualizerCanvas);
  soniq.visualize(visualizerCanvas);
}); 