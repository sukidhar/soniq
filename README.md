# Soniq

[![Made with Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![codecov](https://codecov.io/gh/sukidhar/soniq/branch/main/graph/badge.svg)](https://codecov.io/gh/sukidhar/soniq)
[![CI](https://github.com/YOUR_USERNAME/soniq/actions/workflows/ci.yml/badge.svg)](https://github.com/sukidhar/soniq/actions/workflows/ci.yml)

A modern audio visualization and recording library for the web.

## Features

- Real-time audio visualization with multiple visualizer types:
  - Bar Visualizer
  - Wave Visualizer
  - Spectrum Visualizer
  - Particle Visualizer
- Audio recording with microphone
- High-DPI canvas support
- React hooks for easy integration with React applications
- TypeScript support

## Installation

```bash
# Using npm
npm install soniq

# Using yarn
yarn add soniq

# Using bun
bun add soniq
```

## Usage

### Basic Usage

```typescript
import { Soniq, BarVisualizer } from 'soniq';

// Create a visualizer
const visualizer = new BarVisualizer({
  defaultColor: '#0071e3',
  fftSize: 1024,
  barWidth: 3
});

// Create a Soniq instance
const soniq = new Soniq({
  visualizer,
  onRecorded: (blob) => {
    // Handle the recorded audio blob
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  },
  onPermissionsFailed: (error) => {
    console.error('Microphone permissions failed:', error);
  }
});

// Set up the audio context and request microphone permissions
const setup = async () => {
  const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
  const success = await soniq.setup();
  
  if (success) {
    soniq.visualize(canvas);
  }
};

// Start recording
const startRecording = () => {
  soniq.record();
};

// Stop recording
const stopRecording = () => {
  soniq.stop();
};

// Cancel recording
const cancelRecording = () => {
  soniq.cancel();
};

// Change visualizer
const changeVisualizer = (newVisualizer) => {
  soniq.setVisualizer(newVisualizer);
  soniq.visualize(canvas);
};
```

### React Usage

```tsx
import { useSoniq } from 'soniq';

function AudioRecorder() {
  const {
    canvasRef,
    isSetup,
    isRecording,
    visualizerType,
    error,
    setup,
    startRecording,
    stopRecording,
    cancelRecording,
    changeVisualizer
  } = useSoniq({
    fftSize: 1024,
    defaultColor: '#0071e3',
    onRecorded: (blob) => {
      // Handle the recorded audio blob
      const url = URL.createObjectURL(blob);
      // ...
    },
    onPermissionsFailed: (error) => {
      console.error('Microphone permissions failed:', error);
    },
    initialVisualizer: 'spectrum'
  });

  return (
    <div>
      <canvas ref={canvasRef} width="800" height="200" />
      
      {!isSetup ? (
        <button onClick={setup}>Setup Microphone</button>
      ) : (
        <>
          {!isRecording ? (
            <button onClick={startRecording}>Start Recording</button>
          ) : (
            <>
              <button onClick={stopRecording}>Stop Recording</button>
              <button onClick={cancelRecording}>Cancel</button>
            </>
          )}
        </>
      )}
      
      <select 
        value={visualizerType} 
        onChange={(e) => changeVisualizer(e.target.value)}
        disabled={!isSetup || isRecording}
      >
        <option value="bar">Bar</option>
        <option value="wave">Wave</option>
        <option value="spectrum">Spectrum</option>
        <option value="particle">Particle</option>
      </select>
    </div>
  );
}
```

## Examples

Check out the examples directory for complete examples:

- `examples/basic-audio-recorder`: A vanilla JavaScript example
- `examples/next-audio-recorder`: A Next.js example

## Development

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/soniq.git
cd soniq

# Install dependencies
bun install
```

### Testing

```bash
# Run tests
bun test
```

## License

MIT
