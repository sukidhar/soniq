# Soniq Basic Audio Recorder Example

This is a simple example application demonstrating how to use the Soniq library for audio recording and visualization.

## Features

- Audio recording with microphone
- Real-time audio visualization with multiple visualizer types:
  - Bar Visualizer
  - Wave Visualizer
  - Spectrum Visualizer
  - Particle Visualizer
- Download recorded audio files

## Prerequisites

- [Bun](https://bun.sh/) (v1.0 or higher)

## Getting Started

1. Make sure you have built the main Soniq library first (from the root directory)

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the example:
   ```bash
   bun start
   ```

4. Open your browser and navigate to `http://localhost:4500`

## Usage

1. Click "Setup Microphone" to request microphone permissions and initialize the audio system
2. Once the microphone is ready, you can:
   - Select a visualizer type from the dropdown
   - Start recording by clicking "Start Recording"
   - Stop recording by clicking "Stop Recording"
   - Cancel recording by clicking "Cancel"
3. After stopping a recording, you can:
   - Play it back using the audio player
   - Download it by clicking "Download"

## Building Without Running

To build the application without starting the server:

```bash
bun run build
```

The bundled files will be available in the `dist` directory. 