import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { getOrDownloadTrack } from './useAudioDownloadManager';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { setLoading, setJustStartedPlaying } from '../store/audioSlice';
import tracksData from '../data/tracks.json';

const getVolumeBoostMultiplier = (boost: number): number => {
  if (boost === 1.0) return 1.0;
  if (boost === 1.25) return 1.8;
  if (boost === 1.5) return 2.6;
  if (boost === 2.0) return 4.0; // VLC-style quadratic amplification
  return 1.0;
};

export const useAudioEngine = () => {
  const { isPlaying, activeSoundscape, activeScenarioId, volume, isYTAdPlaying, trackBoosts, globalBoost, eqAmbient, eqTempo, eqFocus } = useAppSelector((state) => state.audio);
  const dispatch = useAppDispatch();

  // Web player references
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lowshelfRef = useRef<BiquadFilterNode | null>(null);
  const peakingRef = useRef<BiquadFilterNode | null>(null);
  const highshelfRef = useRef<BiquadFilterNode | null>(null);
  
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
        dispatch(setLoading(true));
        dispatch(setJustStartedPlaying(false));
        url = await getOrDownloadTrack(lookupId);
      }
      
      if (!webAudioRef.current) {
        webAudioRef.current = new window.Audio();
        webAudioRef.current.crossOrigin = 'anonymous'; // Allow cross-origin Web Audio API gain processing
        webAudioRef.current.loop = true;
        webAudioRef.current.src = url;
      } else if (currentTrackIdRef.current !== currentKey) {
        webAudioRef.current.src = url;
      }

      currentTrackIdRef.current = currentKey;

      // Extract current track boost factor or use global boost
      const trackId = activeTrack?.id || 'focus';
      const boost = trackBoosts[trackId] || globalBoost || 1.0;
      const multiplier = getVolumeBoostMultiplier(boost);
      
      // Route through Web Audio API to amplify sound output past 100% (volume * boost can exceed 1.0)
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
          if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
          }
          if (!gainNodeRef.current) {
            gainNodeRef.current = audioCtxRef.current.createGain();
          }

          // Setup 3-band parametric equalizer filters (lowshelf, peaking, highshelf)
          if (!lowshelfRef.current) {
            lowshelfRef.current = audioCtxRef.current.createBiquadFilter();
            lowshelfRef.current.type = 'lowshelf';
            lowshelfRef.current.frequency.value = 320; // Ambient / Noise layer
          }
          if (!peakingRef.current) {
            peakingRef.current = audioCtxRef.current.createBiquadFilter();
            peakingRef.current.type = 'peaking';
            peakingRef.current.frequency.value = 1000; // Melody / Tempos mid-range
            peakingRef.current.Q.value = 1.0;
          }
          if (!highshelfRef.current) {
            highshelfRef.current = audioCtxRef.current.createBiquadFilter();
            highshelfRef.current.type = 'highshelf';
            highshelfRef.current.frequency.value = 3200; // Sparkles / High frequency
          }

          if (!sourceNodeRef.current) {
            sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(webAudioRef.current);
            
            // Connect in series: Source -> Low-shelf -> Peaking -> High-shelf -> Gain -> Output
            sourceNodeRef.current.connect(lowshelfRef.current);
            lowshelfRef.current.connect(peakingRef.current);
            peakingRef.current.connect(highshelfRef.current);
            highshelfRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(audioCtxRef.current.destination);
          }
          
          // Hardware element volume set to maximum (1.0), gain node does the scaling/boosting
          webAudioRef.current.volume = 1.0;
          gainNodeRef.current.gain.setValueAtTime(volume * multiplier, audioCtxRef.current.currentTime);

          // Apply EQ gains dynamically (map 0..1 to -12dB .. +12dB boost range)
          lowshelfRef.current.gain.setValueAtTime((eqAmbient - 0.5) * 24, audioCtxRef.current.currentTime);
          peakingRef.current.gain.setValueAtTime((eqTempo - 0.5) * 24, audioCtxRef.current.currentTime);
          highshelfRef.current.gain.setValueAtTime((eqFocus - 0.5) * 24, audioCtxRef.current.currentTime);
          
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
        } catch (e) {
          // Fallback if media routing fails
          webAudioRef.current.volume = Math.min(1.0, volume * multiplier);
        }
      } else {
        webAudioRef.current.volume = Math.min(1.0, volume * multiplier);
      }
      
      try {
        await webAudioRef.current.play();
        dispatch(setLoading(false));
        dispatch(setJustStartedPlaying(true));
        setTimeout(() => {
          dispatch(setJustStartedPlaying(false));
        }, 2500);
      } catch (err) {
        console.log('Web audio play blocked by browser auto-play restrictions, waiting for interaction:', err);
        dispatch(setLoading(false));
      }
    };

    manageWebPlayback();
  }, [isPlaying, activeSoundscape, volume, activeScenarioId, isYTAdPlaying, trackBoosts, globalBoost, eqAmbient, eqTempo, eqFocus]);

  // Mobile Player effect
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const manageMobilePlayback = async () => {
      try {
        const activeTrack = (tracksData as any[]).find(t => t.id === (activeScenarioId || activeSoundscape));
        const isYouTubeTest = activeTrack?.source === 'youtube';

        if (!isPlaying) {
          if (mobileSoundRef.current) {
            mobileSoundRef.current.pause();
          }
          return;
        }

        let targetTrackId = activeScenarioId || activeSoundscape;
        const currentKey = targetTrackId + (isYTAdPlaying ? '_ad' : '');

        // Extract current track boost factor or use global boost
        const trackId = activeTrack?.id || 'focus';
        const boost = trackBoosts[trackId] || globalBoost || 1.0;
        const multiplier = getVolumeBoostMultiplier(boost);

        // Check if track changes
        if (currentTrackIdRef.current !== currentKey && !isLoadingRef.current) {
          isLoadingRef.current = true;
          dispatch(setLoading(true));
          dispatch(setJustStartedPlaying(false));
          
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
            if (isYouTubeTest || isYTAdPlaying) {
              if (lookupId === 'rain_2') lookupId = 'rain_1';
              else if (lookupId === 'uplift') lookupId = 'relax_1';
              else if (lookupId === 'move') lookupId = 'relax';
            }
            sourceUri = await getOrDownloadTrack(lookupId);
          }
          
          const player = createAudioPlayer(sourceUri);
          player.loop = true;
          player.volume = Math.min(1.0, volume * multiplier);
          player.play();
          
          mobileSoundRef.current = player;
          currentTrackIdRef.current = currentKey;
          isLoadingRef.current = false;
          dispatch(setLoading(false));
          dispatch(setJustStartedPlaying(true));
          setTimeout(() => {
            dispatch(setJustStartedPlaying(false));
          }, 2500);
        } else if (mobileSoundRef.current) {
          mobileSoundRef.current.volume = Math.min(1.0, volume * multiplier);
          mobileSoundRef.current.play();
        }
      } catch (err) {
        console.log('Mobile audio engine error:', err);
        isLoadingRef.current = false;
        dispatch(setLoading(false));
      }
    };

    manageMobilePlayback();

    return () => {
      // Keep playing in background as user requested
    };
  }, [isPlaying, activeSoundscape, volume, activeScenarioId, isYTAdPlaying, trackBoosts, globalBoost]);
};
