import { createContext, useContext } from 'react';

export type MusicName = 'menu' | 'credits';

export type AudioContextType = {
  playMusic: (name: MusicName) => Promise<void>;
  stopMusic: () => Promise<void>;
  setMusicVolume: (value: number) => Promise<void>;
  volume: number;
};

export const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used inside AudioProvider");
  return ctx;
};