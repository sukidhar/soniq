# Next.js Audio Recorder with Soniq

This example demonstrates how to use the Soniq audio visualization and recording library in a Next.js application.

## Features

- Beautiful audio visualizations with multiple visualizer types
- Audio recording with playback
- Responsive design with Tailwind CSS
- Dark mode support

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How It Works

This example uses the `useSoniq` React hook from the Soniq library to create an audio recorder with visualizations. The hook provides the following functionality:

- Setting up the microphone and audio context
- Starting, stopping, and canceling recordings
- Switching between different visualizer types
- Error handling for microphone permissions

## Component Structure

- `app/components/AudioRecorder.tsx`: The main component that uses the `useSoniq` hook
- `app/page.tsx`: The main page that renders the AudioRecorder component

## Customization

You can customize the audio recorder by modifying the options passed to the `useSoniq` hook:

```typescript
const {
  // ...
} = useSoniq({
  fftSize: 1024, // Controls the frequency resolution
  defaultColor: '#0071e3', // Default color for visualizers
  initialVisualizer: 'bar', // Initial visualizer type
  // ...
});
```

## Learn More

To learn more about Soniq, check out the main repository.

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
