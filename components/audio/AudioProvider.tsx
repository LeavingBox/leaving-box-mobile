import { PropsWithChildren, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { MusicName, AudioContext } from '@/hooks/useAudio';

export const AudioProvider = ({ children }: PropsWithChildren) => {
  const musicMap = {
    menu: require('../../assets/music/menu_theme.mp3'),
  };

  const currentTrack = useRef<string | null>(null);
  const bgMusic = useRef<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(1);

  const playMusic = async (name: MusicName) => {
    try {
      if (currentTrack.current === name) return;

      currentTrack.current = name;

      // stop ancienne musique
      await stopMusic();

      const sound = new Audio.Sound();
      await sound.loadAsync(musicMap[name]);
      await sound.setIsLoopingAsync(true);
      await sound.setVolumeAsync(volume);

      await sound.playAsync();

      bgMusic.current = sound;
    } catch (e) {
      console.log("Music error:", e);
    }
  };

  const stopMusic = async () => {
    if (bgMusic.current) {
      await bgMusic.current.stopAsync();
      await bgMusic.current.unloadAsync();
      bgMusic.current = null;
    }
  };

  const setMusicVolume = async (value: number) => {
    setVolume(value);
    if (bgMusic.current) {
        await bgMusic.current.setVolumeAsync(value);
    }
  }

  return (
    <AudioContext.Provider value={{ playMusic, stopMusic, setMusicVolume, volume }}>
      {children}
    </AudioContext.Provider>
  );
};