// This file provides type declarations when React is not installed
declare module 'react' {
  export function useState<T>(initialState: T): [T, (newState: T) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
} 