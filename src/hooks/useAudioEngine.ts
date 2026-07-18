import { useEffect, useRef } from 'react';
import { useAppSelector } from '../store';
import { getOrDownloadTrack } from './useAudioDownloadManager';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import tracksData from '../data/tracks.json';

export const useAudioEngine = () => {
  const { isPlaying, activeSoundscape, activeScenarioId, volume, isYTAdPlaying } = useAppSelector((state) => state.audio);

  // Web player reference
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Mobile player reference
  const mobileSoundRef = useRef<any>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef<boolean>(false);

  // Configure Audio mode on mobile
  useEffect(() => {
    if (Platform.OS !== 'web') {
      setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'mixWithOthers',
      }).catch(err => console.log('Audio mode error:', err));
    }
  }, []);

  // Web Player effect
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const manageWebPlayback = async () => {
      const activeTrack = (tracksData as any[]).find(t => t.id === (activeScenarioId || activeSoundscape));
      const isYouTubeTest = activeTrack?.source === 'youtube';

      // YouTube scenario controls its own audio, skip standard playback unless an ad is playing
      if (isYouTubeTest && !isYTAdPlaying) {
        if (webAudioRef.current) {
          webAudioRef.current.pause();
        }
        return;
      }

      if (!isPlaying) {
        if (webAudioRef.current) {
          webAudioRef.current.pause();
        }
        return;
      }

      let targetTrackId = activeScenarioId || activeSoundscape;
      const currentKey = targetTrackId + (isYTAdPlaying ? '_ad' : '');
      
      let url = '';
      if (isYTAdPlaying && activeTrack?.local_1_minute_audio) {
        url = activeTrack.local_1_minute_audio;
      } else {
        let lookupId = targetTrackId;
        if (isYTAdPlaying) {
          if (lookupId === 'rain_2') lookupId = 'rain_1';
          else if (lookupId === 'uplift') lookupId = 'relax_1';
        }
        url = await getOrDownloadTrack(lookupId);
      }
      
      if (!webAudioRef.current) {
        webAudioRef.current = new window.Audio(url);
        webAudioRef.current.loop = true;
      } else if (currentTrackIdRef.current !== currentKey) {
        webAudioRef.current.src = url;
      }

      currentTrackIdRef.current = currentKey;
      webAudioRef.current.volume = volume;
      
      try {
        await webAudioRef.current.play();
      } catch (err) {
        console.log('Web audio play blocked by browser auto-play restrictions, waiting for interaction:', err);
      }
    };

    manageWebPlayback();
  }, [isPlaying, activeSoundscape, volume, activeScenarioId, isYTAdPlaying]);

  // Mobile Player effect
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const manageMobilePlayback = async () => {
      try {
        const activeTrack = (tracksData as any[]).find(t => t.id === (activeScenarioId || activeSoundscape));
        const isYouTubeTest = activeTrack?.source === 'youtube';

        // YouTube scenario controls its own audio, skip standard playback unless an ad is playing
        if (isYouTubeTest && !isYTAdPlaying) {
          if (mobileSoundRef.current) {
            mobileSoundRef.current.pause();
          }
          return;
        }

        if (!isPlaying) {
          if (mobileSoundRef.current) {
            mobileSoundRef.current.pause();
          }
          return;
        }

        let targetTrackId = activeScenarioId || activeSoundscape;
        const currentKey = targetTrackId + (isYTAdPlaying ? '_ad' : '');

        // Check if track changes
        if (currentTrackIdRef.current !== currentKey && !isLoadingRef.current) {
          isLoadingRef.current = true;
          
          // Release previous player
          if (mobileSoundRef.current) {
            try {
              mobileSoundRef.current.pause();
              mobileSoundRef.current.release();
            } catch (e) {}
            mobileSoundRef.current = null;
          }

          console.log(`[AudioEngine] Loading sound track for ${targetTrackId} (key: ${currentKey})...`);
          
          let sourceUri = '';
          if (isYTAdPlaying && activeTrack?.local_1_minute_audio) {
            const localPath = activeTrack.local_1_minute_audio;
            sourceUri = localPath.startsWith('/') ? `file://${localPath}` : localPath;
          } else {
            let lookupId = targetTrackId;
            if (isYTAdPlaying) {
              if (lookupId === 'rain_2') lookupId = 'rain_1';
              else if (lookupId === 'uplift') lookupId = 'relax_1';
            }
            sourceUri = await getOrDownloadTrack(lookupId);
          }
          
          const player = createAudioPlayer(sourceUri);
          player.loop = true;
          player.volume = volume;
          player.play();
          
          mobileSoundRef.current = player;
          currentTrackIdRef.current = currentKey;
          isLoadingRef.current = false;
        } else if (mobileSoundRef.current) {
          mobileSoundRef.current.volume = volume;
          mobileSoundRef.current.play();
        }
      } catch (err) {
        console.log('Mobile audio engine error:', err);
        isLoadingRef.current = false;
      }
    };

    manageMobilePlayback();

    return () => {
      // Keep playing in background as user requested
    };
  }, [isPlaying, activeSoundscape, volume, activeScenarioId, isYTAdPlaying]);
};
