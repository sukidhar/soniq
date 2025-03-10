/**
 * Soniq - Audio visualization and recording library
 */

// Core exports
export { default as Soniq } from './src/core/soniq';
export * from './src/core/visualizers';

// React exports
export { useSoniq } from './src/react/use_soniq';
export type { VisualizerType, UseSoniqOptions } from './src/react/use_soniq';
