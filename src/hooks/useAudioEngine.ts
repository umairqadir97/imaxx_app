import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import { useAppSelector } from '../store';

export const useAudioEngine = () => {
  const { isPlaying, activeSoundscape, volume } = useAppSelector((state) => state.audio);
  const soundRef = useRef<Audio.Sound | null>(null);

  // High-speed CDN URLs for short loopable ambient sounds to prevent Metro build-time resource conflicts
  const soundUrlMap: Record<string, string> = {
    focus: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav', // Soft synthesizer drone
    relax: 'https://assets.mixkit.co/active_storage/sfx/2433/2433-84.wav', // Gentle rain
    sleep: 'https://assets.mixkit.co/active_storage/sfx/2073/2073-84.wav', // Deep white noise/wave hum
    move: 'https://assets.mixkit.co/active_storage/sfx/1254/1254-84.wav',  // Soft percussion rhythm
    uplift: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav',// Shimmering pads
  };

  useEffect(() => {
    let active = true;

    const loadAndPlaySound = async () => {
      try {
        // Unload previous sound if exists
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        if (!isPlaying) return;

        const url = soundUrlMap[activeSoundscape];
        if (!url) {
          console.warn(`Audio url for soundscape: "${activeSoundscape}" not configured. Running simulated mode.`);
          return;
        }

        // Configure audio session for background playback
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          {
            shouldPlay: true,
            isLooping: true,
            volume: volume,
          },
          null,
          false
        );

        if (active) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (err) {
        console.warn(`Failed to stream dynamic audio loop:`, err);
        console.warn(`Soundscape "${activeSoundscape}" is running in simulated visualization mode.`);
      }
    };

    loadAndPlaySound();

    return () => {
      active = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [isPlaying, activeSoundscape]);

  // Adjust volume dynamically when Redux volume state changes
  useEffect(() => {
    const updateVolume = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(volume);
        }
      } catch (err) {
        console.warn('Failed to adjust volume of audio stream:', err);
      }
    };
    updateVolume();
  }, [volume]);
};
