import AudioRecorder from './components/AudioRecorder';

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold">Soniq Next.js Audio Recorder</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          A beautiful audio recorder with visualizations powered by Soniq
        </p>
      </header>
      
      <main className="w-full max-w-3xl">
        <AudioRecorder />
      </main>
      
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Built with Soniq and Next.js</p>
      </footer>
    </div>
  );
}
