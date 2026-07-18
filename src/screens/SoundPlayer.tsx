import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, Animated, Modal, View, Text, PanResponder, Image, TouchableWithoutFeedback, ActivityIndicator, Platform } from 'react-native';

// Safe import for WebView to prevent web issues
let WebViewComponent: any = null;
if (Platform.OS !== 'web') {
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    console.log('React Native WebView failed to load dynamically:', e);
  }
}
import styled from 'styled-components/native';
import { ChevronDown, Info, Play, Pause, RotateCcw, Timer, Compass, Shuffle, Moon, Flame, Sun, Volume2, HelpCircle, X, Check } from 'lucide-react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { useAppDispatch, useAppSelector } from '../store';
import { togglePlayback, setSoundscape, setVolume, startTimer, stopTimer, setYTAdPlaying, resetAudioState } from '../store/audioSlice';
import { Waveform } from '../components/Waveform';
import { theme } from '../theme/colors';
import tracksData from '../data/tracks.json';
import { getOrDownloadImage } from '../hooks/useAudioDownloadManager';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Curated high-fidelity public-domain Unsplash backdrops that load instantly without regional/hotlink blockages
const PORTAL_GIFS: Record<string, { uri: string; label: string; location: string }> = {
  focus: {
    uri: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800',
    label: 'COSTA RICA CANOPY',
    location: 'Costa Rica Forest'
  },
  relax: {
    uri: 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?q=80&w=800',
    label: 'DAWN AT SKÓGAFOSS',
    location: 'Iceland Waterfall'
  },
  sleep: {
    uri: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=800',
    label: 'DEEP NEBULA',
    location: 'Cosmic Outer Space'
  },
  move: {
    uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    label: 'HAWAIIAN BREAKERS',
    location: 'Maui North Shore'
  },
  uplift: {
    uri: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800',
    label: 'GOLDEN TUNDRA GLOW',
    location: 'Norway Fjords'
  }
};

// -------------------------------------------------------------
// Styled components declared at the top to prevent TDZ ReferenceErrors
// -------------------------------------------------------------
const AbsoluteCanvas = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 0;
`;

const AnimatedOrbitalContainer = Reanimated.createAnimatedComponent(styled.View`
  position: absolute;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.05);
  justify-content: center;
  align-items: center;
`);

const CelestialPoint = styled.View<{ color: string }>`
  position: absolute;
  top: -2px;
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: ${props => props.color};
  opacity: 0.8;
`;

const TwinklingStar: React.FC<{ size: number; x: number; y: number }> = ({ size, x, y }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000 + Math.random() * 1500 }),
        withTiming(0.1, { duration: 2000 + Math.random() * 1500 })
      ),
      -1,
      true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  return (
    <Reanimated.View
      style={[
        animStyle,
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#FFFFFF',
          left: x,
          top: y,
        }
      ]}
    />
  );
};

const RotatingOrbit: React.FC<{ size: number; duration: number; clockwise: boolean; color: string }> = ({ size, duration, clockwise, color }) => {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(clockwise ? 360 : -360, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));
  return (
    <AnimatedOrbitalContainer
      style={[
        animStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        }
      ]}
    >
      <CelestialPoint color={color} />
    </AnimatedOrbitalContainer>
  );
};

const EndelRelaxingBackground: React.FC = () => {
  return (
    <AbsoluteCanvas pointerEvents="none">
      {/* Constellation stars (spaced away from center to avoid overlaps) */}
      <TwinklingStar size={2} x={SCREEN_WIDTH * 0.15} y={SCREEN_HEIGHT * 0.12} />
      <TwinklingStar size={3} x={SCREEN_WIDTH * 0.82} y={SCREEN_HEIGHT * 0.18} />
      <TwinklingStar size={1.5} x={SCREEN_WIDTH * 0.2} y={SCREEN_HEIGHT * 0.3} />
      <TwinklingStar size={2.5} x={SCREEN_WIDTH * 0.78} y={SCREEN_HEIGHT * 0.32} />
      <TwinklingStar size={1.8} x={SCREEN_WIDTH * 0.1} y={SCREEN_HEIGHT * 0.72} />
      <TwinklingStar size={3} x={SCREEN_WIDTH * 0.88} y={SCREEN_HEIGHT * 0.65} />
      <TwinklingStar size={2.2} x={SCREEN_WIDTH * 0.25} y={SCREEN_HEIGHT * 0.82} />
      <TwinklingStar size={1.5} x={SCREEN_WIDTH * 0.72} y={SCREEN_HEIGHT * 0.8} />
    </AbsoluteCanvas>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: #08080A;
  position: relative;
  overflow: hidden;
  justify-content: space-between;
  padding-bottom: 24px;
`;

const AmbientOrb = styled.View`
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 160px;
  opacity: 0.12;
  z-index: 0;
  pointer-events: none;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 10px 16px;
  background-color: transparent;
`;

const HeaderButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(255, 255, 255, 0.04);
  justify-content: center;
  align-items: center;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const TitleContainer = styled.View`
  align-items: center;
`;

const PlayerTitle = styled.Text`
  color: #FFFFFF;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 0.5px;
`;

const PlayerSubtitle = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  margin-top: 2px;
  letter-spacing: 0.2px;
`;

const ArtSection = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

const PortalContainer = styled.View`
  width: 218px;
  height: 218px;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const AnimatedPortalCircle = styled(Animated.View)`
  width: 218px;
  height: 218px;
  overflow: hidden;
  background-color: #08080A;
`;

const PortalInnerView = styled.View`
  width: 100%;
  height: 100%;
`;

const PortalLabel = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 2px;
`;

const PortalSub = styled.Text`
  color: #8E8E93;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 3px;
  margin-top: 8px;
`;

// Full-screen backdrop transitions (Image 3 & 4)
const FullScreenBackdrop = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 400;
  background-color: transparent;
`;

const ImmersionOverlay = styled.View`
  position: absolute;
  bottom: 45px;
  left: 0;
  right: 0;
  align-items: center;
  z-index: 420;
`;

const ImmersionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 4px;
  text-shadow-color: rgba(0, 0, 0, 0.6);
  text-shadow-offset: 1px 1px;
  text-shadow-radius: 8px;
`;

const ImmersionSubtitle = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 3px;
  margin-top: 8px;
  text-shadow-color: rgba(0, 0, 0, 0.5);
  text-shadow-offset: 0.5px 0.5px;
  text-shadow-radius: 4px;
`;

const AnimatedHintText = styled(Animated.Text)`
  position: absolute;
  bottom: 110px;
  align-self: center;
  color: #E6E6FA;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  z-index: 430;
  opacity: 0.7;
`;

const WaveOverlay = styled.View`
  height: 60px;
  justify-content: center;
  align-items: center;
  margin-vertical: 10px;
`;

const SelectorSection = styled.View`
  margin-bottom: 16px;
`;

const SelectorRow = styled.View`
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  width: 100%;
`;

const SelectorItem = styled.TouchableOpacity`
  align-items: center;
`;

const SelectorCircle = styled.View<{ active: boolean; activeColor: string }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  justify-content: center;
  align-items: center;
  border-width: 0.8px;
  border-color: ${props => props.active ? props.activeColor : 'rgba(255, 255, 255, 0.1)'};
`;

const InnerCircle = styled.View<{ active: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 19px;
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  justify-content: center;
  align-items: center;
`;

const SelectorLabel = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FFFFFF' : '#8E8E93'};
  font-size: 9px;
  font-weight: 600;
  margin-top: 6px;
  letter-spacing: 0.2px;
`;

const ControlPillsRow = styled.View`
  flex-direction: row;
  justify-content: space-evenly;
  padding-horizontal: 16px;
  margin-bottom: 20px;
`;

const PillButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.04);
  padding: 8px 14px;
  border-radius: 18px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const PillText = styled.Text`
  color: #E6E6FA;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2px;
`;

const HighlightedPillButton = styled.TouchableOpacity`
  background-color: rgba(255, 126, 71, 0.16);
  padding: 8px 14px;
  border-radius: 18px;
  border-width: 0.8px;
  border-color: rgba(255, 126, 71, 0.35);
`;

const HighlightedPillText = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const ControlsBar = styled.View`
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  padding: 0 40px;
  margin-top: 10px;
  margin-bottom: 12px;
`;

const ActionButton = styled.TouchableOpacity<{ active?: boolean; primary?: boolean }>`
  width: ${props => props.primary ? '48px' : '40px'};
  height: ${props => props.primary ? '48px' : '40px'};
  border-radius: ${props => props.primary ? '24px' : '20px'};
  background-color: ${props => props.primary ? '#FFFFFF' : 'rgba(255, 255, 255, 0.03)'};
  justify-content: center;
  align-items: center;
  border-width: 0.8px;
  border-color: ${props => props.active ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)'};
`;

// Tuner Modal Elements
const TunerModalBackdrop = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(8, 8, 12, 0.6);
  justify-content: flex-end;
`;

const TunerModalContainer = styled.TouchableOpacity`
  background-color: rgba(20, 20, 25, 0.96);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  border-top-width: 0.8px;
  border-top-color: rgba(255, 255, 255, 0.12);
  shadow-color: #000;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
`;

const ModalHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const ClosePill = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.95);
  padding-horizontal: 14px;
  padding-vertical: 5px;
  border-radius: 14px;
`;

const ClosePillText = styled.Text`
  color: #08080C;
  font-size: 12px;
  font-weight: bold;
`;

const SliderGroup = styled.View`
  margin-bottom: 24px;
`;

const SliderLabelRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SliderLabel = styled.Text`
  color: #A2A2A8;
  font-size: 12px;
  font-weight: 500;
`;

const SliderValue = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
`;

const MockSliderTrack = styled.TouchableOpacity`
  width: 100%;
  height: 5px;
  border-radius: 2.5px;
  background-color: rgba(255, 255, 255, 0.08);
  position: relative;
`;

const MockSliderFill = styled.View<{ width: number; color: string }>`
  width: ${props => props.width}%;
  height: 100%;
  border-radius: 2.5px;
  background-color: ${props => props.color};
`;

const MockSliderThumb = styled.View<{ left: number }>`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background-color: #FFFFFF;
  position: absolute;
  top: -4.5px;
  left: ${props => props.left}%;
  margin-left: -7px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.3;
  shadow-radius: 2px;
  elevation: 3;
`;

const VolumeControlRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
  background-color: rgba(255, 255, 255, 0.02);
  padding: 10px 14px;
  border-radius: 12px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const VolumeText = styled.Text`
  color: #8E8E93;
  font-size: 11px;
  margin-left: 8px;
`;

const HeaderWrapper = styled.View`
  background-color: transparent;
  width: 100%;
  padding-top: 40px;
`;

const GestureIndicatorContainer = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
  padding-bottom: 5px;
  background-color: transparent;
`;

const GestureIndicatorBar = styled.View`
  width: 40px;
  height: 5px;
  border-radius: 2.5px;
  background-color: rgba(255, 255, 255, 0.15);
`;

// -------------------------------------------------------------
// Component Props and implementation
// -------------------------------------------------------------

// -------------------------------------------------------------
// Component Props and implementation
// -------------------------------------------------------------
interface SoundPlayerProps {
  onClose: () => void;
  onOpenTimerSheet: () => void;
  onOpenScenarios: () => void;
}

export const SoundPlayer: React.FC<SoundPlayerProps> = ({ onClose, onOpenTimerSheet, onOpenScenarios }) => {
  const dispatch = useAppDispatch();
  const { isPlaying, activeSoundscape, activeScenarioId, volume, timerIsActive, timerTimeLeft, scenariosList, isYTAdPlaying } = useAppSelector((state) => state.audio);

  const activeTrack = tracksData.find(t => t.id === (activeScenarioId || activeSoundscape));
  const isYouTubeTest = activeTrack?.source === 'youtube';
  const activeScenario = scenariosList?.find(s => s.id === activeScenarioId);

  const getYouTubeId = (url: string): string => {
    if (!url) return 'ubNfkpbxXUs';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : 'ubNfkpbxXUs';
  };
  const ytVideoId = activeTrack?.url ? getYouTubeId(activeTrack.url) : 'ubNfkpbxXUs';

  const displayLabel = activeTrack
    ? activeTrack.title || activeTrack.name.toUpperCase()
    : (activeScenario ? activeScenario.name.toUpperCase() : PORTAL_GIFS[activeSoundscape]?.label);

  const displaySub = activeTrack
    ? activeTrack.slogan || activeTrack.category.toUpperCase()
    : (activeScenario ? activeScenario.category.toUpperCase() : PORTAL_GIFS[activeSoundscape]?.location.toUpperCase());

  const [isYTLoading, setIsYTLoading] = useState(false);
  const ytLoadingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isYouTubeTest && isPlaying) {
      setIsYTLoading(true);
      // Safety fallback: if no event received, hide overlay after 7 seconds
      ytLoadingTimeoutRef.current = setTimeout(() => {
        setIsYTLoading(false);
      }, 7000);
      return () => {
        if (ytLoadingTimeoutRef.current) clearTimeout(ytLoadingTimeoutRef.current);
      };
    } else {
      setIsYTLoading(false);
      if (ytLoadingTimeoutRef.current) {
        clearTimeout(ytLoadingTimeoutRef.current);
        ytLoadingTimeoutRef.current = null;
      }
    }
  }, [isPlaying, isYouTubeTest]);

  const showYTStaticOverlay = isYouTubeTest && (!isPlaying || isYTLoading || isYTAdPlaying);

  const [localImageUri, setLocalImageUri] = useState<string>('');

  useEffect(() => {
    const loadTrackImage = async () => {
      const remoteImg = activeTrack?.staticImage || PORTAL_GIFS[activeSoundscape]?.uri || 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800';
      if (Platform.OS === 'web') {
        setLocalImageUri(remoteImg);
        return;
      }
      try {
        const localPath = await getOrDownloadImage(activeScenarioId || activeSoundscape || 'relax', remoteImg);
        setLocalImageUri(localPath);
      } catch (e) {
        setLocalImageUri(remoteImg);
      }
    };
    loadTrackImage();
  }, [activeScenarioId, activeSoundscape, activeTrack]);

  const handleYTEvent = (eventStr: string) => {
    try {
      const data = JSON.parse(eventStr);
      if (data.event === 'yt_playing') {
        setIsYTLoading(false);
        if (ytLoadingTimeoutRef.current) {
          clearTimeout(ytLoadingTimeoutRef.current);
          ytLoadingTimeoutRef.current = null;
        }
      } else if (data.event === 'yt_ad_start') {
        dispatch(setYTAdPlaying(true));
      } else if (data.event === 'yt_ad_end') {
        dispatch(setYTAdPlaying(false));
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleWebMessage = (e: MessageEvent) => {
      handleYTEvent(e.data);
    };
    window.addEventListener('message', handleWebMessage);
    return () => window.removeEventListener('message', handleWebMessage);
  }, []);

  // YouTube state syncing
  const iframeRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  const getPlayerHtml = (isFull: boolean) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; position: relative; }
          #player {
            position: absolute;
            height: 112%;
            width: ${isFull ? '354%' : '200%'};
            left: ${isFull ? '-127%' : '-50%'};
            top: -6%;
            border: none;
          }
          .blocker {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: transparent;
            z-index: 9999;
          }
        </style>
      </head>
      <body>
        <div class="blocker"></div>
        <div id="player"></div>
        <script>
          var tag = document.createElement('script');
          tag.src = "https://www.youtube.com/iframe_api";
          var firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

          var player;
          var isReady = false;
          var pendingCommand = "${isPlaying ? 'play' : 'pause'}";

          function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
              videoId: '${ytVideoId}',
              playerVars: {
                autoplay: ${isPlaying ? 1 : 0},
                controls: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
                mute: 0,
                loop: 1,
                playlist: '${ytVideoId}',
                playsinline: 1,
                cc_load_policy: 0,
                disablekb: 1,
                fs: 0,
                origin: window.location.origin || '*'
              },
              events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange
              }
            });
          }

          function disableCaptions() {
            try {
              if (player && player.unloadModule) {
                player.unloadModule('captions');
              }
            } catch (e) {}
            try {
              if (player && player.setOption) {
                player.setOption('captions', 'track', {});
                player.setOption('cc', 'track', {});
              }
            } catch (e) {}
          }

          function sendToParent(eventObj) {
            var msg = JSON.stringify(eventObj);
            try {
              window.parent.postMessage(msg, '*');
            } catch(e) {}
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(msg);
              }
            } catch(e) {}
          }

          function onPlayerReady(event) {
            isReady = true;
            disableCaptions();
            setInterval(disableCaptions, 1000);
            
            // Ad checking & auto-skip interval
            setInterval(function() {
              if (player && player.getVideoData) {
                var currentId = player.getVideoData().video_id;
                var isAd = currentId && currentId !== '${ytVideoId}';
                if (isAd) {
                  sendToParent({ event: 'yt_ad_start' });
                  player.mute();
                  
                  // Try to find and auto-click the YouTube skip ad button
                  try {
                    var skipBtn = document.querySelector('.ytp-ad-skip-button') || 
                                  document.querySelector('.ytp-ad-skip-button-text') ||
                                  document.querySelector('.ytp-ad-skip-modern') ||
                                  document.querySelector('.ytp-ad-skip-button-modern');
                    if (skipBtn) {
                      skipBtn.click();
                      var clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
                      skipBtn.dispatchEvent(clickEvt);
                    }
                  } catch (e) {}
                } else {
                  sendToParent({ event: 'yt_ad_end' });
                  player.unMute();
                }
              }
            }, 1000);

            if (pendingCommand === 'play') {
              player.playVideo();
            } else if (pendingCommand === 'pause') {
              player.pauseVideo();
            }
          }

          function onPlayerStateChange(event) {
            disableCaptions();
            if (event.data === YT.PlayerState.PLAYING) {
              sendToParent({ event: 'yt_playing' });
            }
          }

          window.addEventListener('message', function(event) {
            try {
              var data = JSON.parse(event.data);
              if (data.command === 'play') {
                if (isReady && player && player.playVideo) player.playVideo();
                else pendingCommand = 'play';
              } else if (data.command === 'pause') {
                if (isReady && player && player.pauseVideo) player.pauseVideo();
                else pendingCommand = 'pause';
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (!isYouTubeTest) return;

    const command = isPlaying ? 'play' : 'pause';
    const message = JSON.stringify({ command });

    if (Platform.OS === 'web') {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(message, '*');
        } catch (e) {
          console.log('Web YT postMessage failed:', e);
        }
      }
    } else if (WebViewComponent && webViewRef.current) {
      try {
        webViewRef.current.postMessage(message);
      } catch (e) {
        console.log('Mobile YT postMessage failed:', e);
      }
    }
  }, [isPlaying, isYouTubeTest]);

  const renderYouTubePlayer = (isFull: boolean) => {
    const htmlContent = getPlayerHtml(isFull);

    if (Platform.OS === 'web') {
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          backgroundColor: '#000',
          borderRadius: 0
        }}>
          <iframe
            ref={iframeRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              pointerEvents: 'none'
            }}
            srcDoc={htmlContent}
          />
        </div>
      );
    }

    if (WebViewComponent) {
      return (
        <View style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          backgroundColor: '#000',
          borderRadius: 0
        }}>
          <WebViewComponent
            ref={webViewRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
            }}
            scrollEnabled={false}
            allowsFullscreenVideo={false}
            mediaPlaybackRequiresUserAction={false}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            onMessage={(event: any) => {
              handleYTEvent(event.nativeEvent.data);
            }}
            source={{
              html: htmlContent,
              baseUrl: 'https://www.youtube.com'
            }}
          />
        </View>
      );
    }

    return null;
  };

  // Somatic visual states
  const [showTuner, setShowTuner] = useState(false);
  const [eqAmbient, setEqAmbient] = useState(0.5);
  const [eqTempo, setEqTempo] = useState(0.4);
  const [eqFocus, setEqFocus] = useState(0.7);
  const [isImmersionActive, setIsImmersionActive] = useState(false);

  // standard Animated.Value (useRef) to prevent Reanimated mismatch crashes
  const circleScale = useRef(new Animated.Value(1)).current;
  const borderRadiusAnim = useRef(new Animated.Value(109)).current;
  const fullScreenOpacity = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;

  const soundscapesList = [
    { id: 'focus', name: 'Focus', baseColor: '#FF7E47' },
    { id: 'relax', name: 'Relax', baseColor: '#4ECDC4' },
    { id: 'sleep', name: 'Sleep', baseColor: '#9B7EDE' },
    { id: 'move', name: 'Move', baseColor: '#00BCD4' },
    { id: 'uplift', name: 'Uplift', baseColor: '#E91E63' }
  ];

  const enterImmersion = () => {
    setIsImmersionActive(true);
    Animated.parallel([
      Animated.timing(circleScale, { toValue: 3.5, duration: 900, useNativeDriver: true }),
      Animated.timing(borderRadiusAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      Animated.timing(fullScreenOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(controlsOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
    ]).start(() => {
      // Fade hint text in then out
      Animated.sequence([
        Animated.timing(hintOpacity, { toValue: 0.8, duration: 450, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: true })
      ]).start();
    });
  };

  const exitImmersion = () => {
    Animated.parallel([
      Animated.timing(circleScale, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(borderRadiusAnim, { toValue: 109, duration: 750, useNativeDriver: false }),
      Animated.timing(fullScreenOpacity, { toValue: 0, duration: 750, useNativeDriver: true }),
      Animated.timing(controlsOpacity, { toValue: 1, duration: 550, useNativeDriver: true })
    ]).start(() => {
      setIsImmersionActive(false);
    });
  };

  const getSoundscapeName = (id: string) => {
    if (activeScenarioId) {
      if (activeScenarioId === 'rain_2') return 'RAINFOREST SHOWER';
      const scenario = scenariosList?.find(s => s.id === activeScenarioId);
      if (scenario) return scenario.name;
    }
    if (id === 'uplift') return 'UPLIFTING CHILL';
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  const getSubtitle = (id: string) => {
    if (activeScenarioId) {
      if (activeScenarioId === 'rain_2') return 'AMAZON JUNGLE';
      const scenario = scenariosList?.find(s => s.id === activeScenarioId);
      if (scenario) return scenario.category.toUpperCase() + ' MODE';
    }
    if (id === 'uplift') return 'AMAZON JUNGLE';
    switch (id) {
      case 'focus':
        return 'Altered State Circadian Flow';
      case 'relax':
        return 'Somatic Calm Resonator';
      case 'sleep':
        return 'Night Energy Fade';
      case 'move':
        return 'Ultradian Heartbeat Sync';
      case 'uplift':
        return 'Serotonergic Peak State';
      default:
        return 'Adaptive Acoustic Rhythm';
    }
  };

  const getSoundIcon = (id: string, color: string = '#FFFFFF') => {
    switch (id) {
      case 'focus':
        return <Compass color={color} size={22} />;
      case 'relax':
        return <Shuffle color={color} size={22} />;
      case 'sleep':
        return <Moon color={color} size={22} />;
      case 'move':
        return <Flame color={color} size={22} />;
      case 'uplift':
        return <Sun color={color} size={22} />;
      default:
        return <Compass color={color} size={22} />;
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dy, dx } = gestureState;
        return dy > 45 && Math.abs(dx) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dy } = gestureState;
        if (dy > 80) {
          onClose();
        }
      },
    })
  ).current;

  return (
    <Container>
      {/* Immersive Background Endel Celestial Animation (Fades during immersion) */}
      <Animated.View style={{ flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, opacity: controlsOpacity }}>
        {/* Global Ambient Orbs at top-left and bottom-right for rich background glow */}
        <AmbientOrb style={{ top: -80, left: -80, backgroundColor: '#FF7E47', opacity: 0.08 }} />
        <AmbientOrb style={{ bottom: 120, right: -100, backgroundColor: '#9B7EDE', opacity: 0.08 }} />
        {/* Endel style starry sky and orbit rings framing the central player (no overlapping center circles!) */}
        <EndelRelaxingBackground />
      </Animated.View>

      {/* Mesmerizing Full-Screen Looping Video Backdrop Overlay */}

      {/* Slide down gesture handle area (Fades out when in full screen) */}
      {!isImmersionActive && (
        <HeaderWrapper {...panResponder.panHandlers}>
          <GestureIndicatorContainer>
            <GestureIndicatorBar />
          </GestureIndicatorContainer>
          <Animated.View style={{ opacity: controlsOpacity }}>
            <HeaderBar>
              <HeaderButton onPress={onClose}>
                <ChevronDown size={24} color="#FFFFFF" style={{ opacity: 0.8 }} />
              </HeaderButton>
              <TitleContainer>
                <PlayerTitle>{getSoundscapeName(activeSoundscape)}</PlayerTitle>
                <PlayerSubtitle>{getSubtitle(activeSoundscape)}</PlayerSubtitle>
              </TitleContainer>
              <HeaderButton onPress={() => setShowTuner(true)}>
                <Info size={20} color="#FFFFFF" style={{ opacity: 0.8 }} />
              </HeaderButton>
            </HeaderBar>
          </Animated.View>
        </HeaderWrapper>
      )}

      {/* Center Circle Portal Section */}
      <ArtSection>
        <PortalContainer>
          {/* Elegant rotating orbits centered exactly around the image circle (no offsets!) */}
          <AbsoluteCanvas style={{ justifyContent: 'center', alignItems: 'center', zIndex: -1 }}>
            <RotatingOrbit size={240} duration={24000} clockwise={true} color="#FF7E47" />
            <RotatingOrbit size={300} duration={36000} clockwise={false} color="#9B7EDE" />
          </AbsoluteCanvas>

          <AnimatedPortalCircle style={{ transform: [{ scale: circleScale }], borderRadius: borderRadiusAnim }}>
            <TouchableWithoutFeedback onPress={isImmersionActive ? exitImmersion : enterImmersion}>
              <PortalInnerView>
                {isYouTubeTest && renderYouTubePlayer(false)}
                {(!isYouTubeTest || showYTStaticOverlay) && (
                  <Image
                    source={{ uri: localImageUri || PORTAL_GIFS[activeSoundscape]?.uri }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: showYTStaticOverlay ? 5 : 1
                    }}
                    resizeMode="cover"
                  />
                )}
              </PortalInnerView>
            </TouchableWithoutFeedback>
          </AnimatedPortalCircle>
        </PortalContainer>

        {/* Portal Location Text Indicator (Fades out when in full screen) */}
        {!isImmersionActive && (
          <Animated.View style={{ opacity: controlsOpacity, alignItems: 'center', marginTop: 50 }}>
            <PortalLabel>{displayLabel}</PortalLabel>
            <PortalSub>{displaySub}</PortalSub>
            {isYouTubeTest && isYTLoading && (
              <Text style={{ color: '#FFB347', fontSize: 13, fontWeight: '600', marginTop: 8 }}>
                loading...
              </Text>
            )}
          </Animated.View>
        )}
      </ArtSection>

      {/* Main player controls wrapper (Faded during full screen) */}
      <Animated.View style={{ opacity: controlsOpacity, width: '100%' }}>
        {/* Waveform graphic overlay - Shown on all modes EXCEPT focus, runs continuously */}
        {activeSoundscape !== 'focus' && (
          <WaveOverlay>
            <Waveform isPlaying={true} height={60} mode={activeSoundscape as any} />
          </WaveOverlay>
        )}

        {/* Soundscape horizontal selector row centered and aligned */}
        {!isPlaying && (
          <SelectorSection>
            <SelectorRow>
              {soundscapesList.map((item) => {
                const isActive = activeSoundscape === item.id;
                return (
                  <SelectorItem key={item.id} onPress={() => dispatch(setSoundscape(item.id))}>
                    <SelectorCircle active={isActive} activeColor={item.baseColor}>
                      <InnerCircle active={isActive}>
                        {getSoundIcon(item.id, isActive ? item.baseColor : '#FFFFFF')}
                      </InnerCircle>
                    </SelectorCircle>
                    <SelectorLabel active={isActive}>{item.name}</SelectorLabel>
                  </SelectorItem>
                );
              })}
            </SelectorRow>
          </SelectorSection>
        )}

        {/* Control Pills row - Apple Glass effect */}
        {!isPlaying && (
          <ControlPillsRow>
            <PillButton onPress={onOpenTimerSheet}>
              <PillText>{timerIsActive ? `⏳ ${formatTimer(timerTimeLeft)}` : '⏳ Set Timer'}</PillText>
            </PillButton>
            <HighlightedPillButton onPress={onOpenScenarios}>
              <HighlightedPillText>🎵 Discover</HighlightedPillText>
            </HighlightedPillButton>
            <PillButton onPress={() => setShowTuner(true)}>
              <PillText>🔧 Tune Sound</PillText>
            </PillButton>
          </ControlPillsRow>
        )}

        {isPlaying && <View style={{ height: 40 }} />}

        {/* Playback Controls bar */}
        <ControlsBar>
          <ActionButton onPress={() => dispatch(togglePlayback())} primary={true}>
            {isPlaying ? <Pause size={20} color="#08080C" /> : <Play size={20} color="#08080C" fill="#08080C" style={{ marginLeft: 2 }} />}
          </ActionButton>
          
          <ActionButton onPress={() => {
            dispatch(resetAudioState());
            onClose();
          }}>
            <RotateCcw size={18} color="#FFFFFF" style={{ opacity: 0.8 }} />
          </ActionButton>

          <ActionButton onPress={onOpenTimerSheet} active={timerIsActive}>
            <Timer size={18} color={timerIsActive ? '#FF7E47' : '#FFFFFF'} style={{ opacity: 0.8 }} />
          </ActionButton>
        </ControlsBar>
      </Animated.View>

      {isImmersionActive && (
        <TouchableWithoutFeedback onPress={exitImmersion}>
          <FullScreenBackdrop style={{ opacity: fullScreenOpacity, pointerEvents: 'auto' }}>
            {/* Title & Subtitle overlay inside full bleed view */}
            <ImmersionOverlay>
              <ImmersionTitle>{displayLabel}</ImmersionTitle>
              <ImmersionSubtitle>{displaySub}</ImmersionSubtitle>
            </ImmersionOverlay>

            <AnimatedHintText style={{ opacity: hintOpacity }}>
              Tap anywhere to return to controls
            </AnimatedHintText>
          </FullScreenBackdrop>
        </TouchableWithoutFeedback>
      )}

      {/* Sound Tuner Modal */}
      <Modal visible={showTuner} transparent={true} animationType="slide" onRequestClose={() => setShowTuner(false)}>
        <TunerModalBackdrop onPress={() => setShowTuner(false)}>
          <TunerModalContainer onPress={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>Sound Tuner</ModalTitle>
              <ClosePill onPress={() => setShowTuner(false)}>
                <ClosePillText>Done</ClosePillText>
              </ClosePill>
            </ModalHeaderRow>

            <SliderGroup>
              <SliderLabelRow>
                <SliderLabel>Ambient Intensity (Noise Layer)</SliderLabel>
                <SliderValue>{Math.round(eqAmbient * 100)}%</SliderValue>
              </SliderLabelRow>
              <MockSliderTrack onPress={(e) => setEqAmbient(0.4)}>
                <MockSliderFill width={eqAmbient * 100} color="#FF7E47" />
                <MockSliderThumb left={eqAmbient * 100} />
              </MockSliderTrack>
            </SliderGroup>

            <SliderGroup>
              <SliderLabelRow>
                <SliderLabel>Melody / Rhythm Beat (Heart Tempos)</SliderLabel>
                <SliderValue>{Math.round(eqTempo * 100)}%</SliderValue>
              </SliderLabelRow>
              <MockSliderTrack onPress={(e) => setEqTempo(0.6)}>
                <MockSliderFill width={eqTempo * 100} color="#4ECDC4" />
                <MockSliderThumb left={eqTempo * 100} />
              </MockSliderTrack>
            </SliderGroup>

            <SliderGroup>
              <SliderLabelRow>
                <SliderLabel>High Frequency (Focus Sparkles)</SliderLabel>
                <SliderValue>{Math.round(eqFocus * 100)}%</SliderValue>
              </SliderLabelRow>
              <MockSliderTrack onPress={(e) => setEqFocus(0.85)}>
                <MockSliderFill width={eqFocus * 100} color="#9B7EDE" />
                <MockSliderThumb left={eqFocus * 100} />
              </MockSliderTrack>
            </SliderGroup>

            <VolumeControlRow>
              <Volume2 size={16} color="#8E8E93" />
              <VolumeText>Dynamic Volume Auto-adjusts with heart rate</VolumeText>
            </VolumeControlRow>
          </TunerModalContainer>
        </TunerModalBackdrop>
      </Modal>
    </Container>
  );
};
