import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, SafeAreaView, View, Text, PanResponder, Platform, Animated } from 'react-native';
import { Provider } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components/native';
import { Home, Moon, Users, Sparkles, User, Compass, HelpCircle, Clock, Wind } from 'lucide-react-native';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { store, useAppDispatch, useAppSelector } from './src/store';
import { theme } from './src/theme/colors';
import { tickTimer, addFocusSeconds, hydrateAudio, setActiveSubScreen } from './src/store/audioSlice';
import { addListeningTime, hydrateHabits } from './src/store/habitSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import { Onboarding } from './src/screens/Onboarding';
import { HomeDashboard } from './src/screens/HomeDashboard';
import { SoundPlayer } from './src/screens/SoundPlayer';
import { SleepDashboard } from './src/screens/SleepDashboard';
import { ScenariosGrid } from './src/screens/ScenariosGrid';
import { HabitTracker } from './src/screens/HabitTracker';
import { FocusTimerTab } from './src/screens/FocusTimerTab';
import { StatsDashboard } from './src/screens/StatsDashboard';
import { Paywall } from './src/screens/Paywall';

// Components
import { MiniPlayer } from './src/components/MiniPlayer';
import { TimerSheet } from './src/components/TimerSheet';

// Custom Relax Yoga Icon matching Finch design
const RelaxYogaIcon = ({ size = 26, color = '#08080A' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx="50" cy="27" r="10" fill={color} />
      <Path
        d="M50,40 C41,40 37,45 33,52 C30,57 32,60 38,60 C42,60 48,56 50,56 C52,56 58,60 62,60 C68,60 70,57 67,52 C63,45 59,40 50,40 Z"
        fill={color}
      />
      <G transform="rotate(16 43 66)">
        <Rect x="25" y="61" width="36" height="11" rx="5.5" fill={color} />
      </G>
      <G transform="rotate(-16 57 66)">
        <Rect x="39" y="61" width="36" height="11" rx="5.5" fill={color} />
      </G>
      <Path d="M19,45 L25,45 M22,42 L22,48" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Circle cx="16" cy="53" r="2.5" fill={color} />
      <Path d="M75,51 L81,51 M78,48 L78,54" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Circle cx="75" cy="42" r="2" fill={color} />
    </Svg>
  );
};
import { useAudioEngine } from './src/hooks/useAudioEngine';
import { useAudioDownloadManager } from './src/hooks/useAudioDownloadManager';
import { BackgroundOrbs } from './src/components/BackgroundOrbs';
import { SettingsSheet } from './src/components/SettingsSheet';

const MainAppContent: React.FC = () => {
  // Initialize the audio engine hook
  useAudioEngine();
  // Start background onboarding & local caching manager
  useAudioDownloadManager();

  const dispatch = useAppDispatch();

  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  const habitsState = useAppSelector((state) => state.habits);
  const audioState = useAppSelector((state) => state.audio);
  const isOnboardingCompleted = habitsState.isOnboardingCompleted;
  const { isPlaying, timerIsActive, isMiniPlayerDismissed, hasActiveAudioSession } = audioState;

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'sleep' | 'relax' | 'double' | 'habits' | 'profile'>('home');

  // Overlay modals state
  const [showTimer, setShowTimer] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Tab sequences for horizontal swiping
  const TABS: ('home' | 'sleep' | 'double' | 'habits')[] = ['home', 'sleep', 'double', 'habits'];

  // Tab bar hiding / visibility states and animations
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const tabBarY = useRef(new Animated.Value(0)).current;
  const inactivityTimer = useRef<any>(null);

  const resetInactivityTimer = () => {
    // Show tab bar with animation
    setIsTabBarVisible(true);
    Animated.timing(tabBarY, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Only auto-hide on Android as requested
    if (Platform.OS !== 'android') return;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(() => {
      // Don't auto-hide if any modal/overlay sheet is open
      const isAnyModalOpen = activeTab === 'relax' || showSettings || showScenarios || showPaywall || showTimer;
      if (!isAnyModalOpen) {
        setIsTabBarVisible(false);
        Animated.timing(tabBarY, {
          toValue: 100, // Translate down out of sight
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }, 5000);
  };

  // Reset/run inactivity timer on mount or state changes
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [showSettings, showScenarios, showPaywall, showTimer, activeTab]);

  // Automatically slide down/hide tab bar on Relax screen when audio starts playing
  useEffect(() => {
    if (activeTab === 'relax' && isPlaying) {
      setIsTabBarVisible(false);
      Animated.timing(tabBarY, {
        toValue: 100, // Slide down
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setIsTabBarVisible(true);
      Animated.timing(tabBarY, {
        toValue: 0, // Slide up
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying, activeTab]);

  // PanResponder to handle swiping up from bottom to show navbar
  const mainPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Accept the gesture if it's a swipe up from bottom
        return dy < -40 && Math.abs(dx) < 20;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dy } = gestureState;
        resetInactivityTimer();

        // Vertical Swipe Up
        if (dy < -50) {
          // Swipe Up: show tab bar immediately
          resetInactivityTimer();
        }
      },
    })
  ).current;

  // Load persisted state on mount
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname;
      if (path !== '/' && path !== '') {
        console.log('Redirected from non-existent sub-path:', path);
        window.history.replaceState(null, '', '/');
      }
    }

    const loadState = async () => {
      try {
        const habitsData = await AsyncStorage.getItem('iMaxx_habits_state');
        const audioData = await AsyncStorage.getItem('iMaxx_audio_state');
        if (habitsData) {
          dispatch(hydrateHabits(JSON.parse(habitsData)));
        }
        if (audioData) {
          dispatch(hydrateAudio(JSON.parse(audioData)));
        }
      } catch (err) {
        console.log('Error loading state:', err);
      } finally {
        setIsHydrated(true);
      }
    };
    loadState();
  }, []);

  // Save state on changes
  useEffect(() => {
    if (isHydrated) {
      AsyncStorage.setItem('iMaxx_habits_state', JSON.stringify({
        habits: habitsState.habits,
        isOnboardingCompleted: habitsState.isOnboardingCompleted,
        selectedStruggles: habitsState.selectedStruggles,
        focusScoreTotal: habitsState.focusScoreTotal,
        listeningTimeTotal: habitsState.listeningTimeTotal,
      }));
      AsyncStorage.setItem('iMaxx_audio_state', JSON.stringify({
        completedPomodorosCount: audioState.completedPomodorosCount,
        totalFocusSeconds: audioState.totalFocusSeconds,
        weeklyFocusMinutes: audioState.weeklyFocusMinutes,
        categoryFocusSeconds: audioState.categoryFocusSeconds,
      }));
    }
  }, [habitsState.habits, habitsState.isOnboardingCompleted, habitsState.selectedStruggles, habitsState.focusScoreTotal, habitsState.listeningTimeTotal, audioState.completedPomodorosCount, audioState.totalFocusSeconds, audioState.weeklyFocusMinutes, audioState.categoryFocusSeconds, isHydrated]);

  // Real-time ticking system
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        // Tick active count timers
        if (timerIsActive) {
          dispatch(tickTimer());
          dispatch(addFocusSeconds(1)); // Accumulate focus time in store
        }
        // Accumulate user listening focus points
        dispatch(addListeningTime(1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timerIsActive]);

  // Render loading screen during hydration check
  if (!isHydrated) {
    return (
      <SafeAreaContainer style={{ justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#08080A" />
        <Compass size={48} color="#FF7E47" />
        <Text style={{ color: '#6B6280', fontSize: 13, fontWeight: 'bold', marginTop: 16, letterSpacing: 1 }}>LOADING PROFILE...</Text>
      </SafeAreaContainer>
    );
  }

  // Gate app behind onboarding flow
  if (!isOnboardingCompleted) {
    return (
      <SafeAreaContainer>
        <StatusBar barStyle="light-content" backgroundColor="#08080A" />
        <Onboarding />
      </SafeAreaContainer>
    );
  }

  // Render current tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeDashboard
            onOpenPlayer={() => setActiveTab('relax')}
            onOpenTimer={() => setShowTimer(true)}
            onOpenPaywall={() => setShowPaywall(true)}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
      case 'sleep':
        return (
          <SleepDashboard
            onOpenPlayer={() => setActiveTab('relax')}
            onOpenPaywall={() => setShowPaywall(true)}
            onOpenScenarios={() => setShowScenarios(true)}
          />
        );
      case 'relax':
        return (
          <SoundPlayer
            onClose={() => setActiveTab('home')}
            onOpenTimerSheet={() => setShowTimer(true)}
            onOpenScenarios={() => setShowScenarios(true)}
          />
        );
      case 'double':
        return <FocusTimerTab />;
      case 'habits':
        return <HabitTracker onOpenSettings={() => setShowSettings(true)} />;
      case 'profile':
        return <StatsDashboard onOpenPaywall={() => setShowPaywall(true)} />;
      default:
        return (
          <HomeDashboard
            onOpenPlayer={() => setActiveTab('relax')}
            onOpenTimer={() => setShowTimer(true)}
            onOpenPaywall={() => setShowPaywall(true)}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
    }
  };

  return (
    <SafeAreaContainer onTouchStart={resetInactivityTimer}>
      <StatusBar barStyle="light-content" backgroundColor="#08080A" />
      <BackgroundOrbs />

      {/* Main active screen wrapped with gesture navigations */}
      <ContentContainer {...mainPanResponder.panHandlers}>
        {renderTabContent()}
      </ContentContainer>

      {/* Persistent Audio Mini Player overlay */}
      {activeTab !== 'relax' && hasActiveAudioSession && !isMiniPlayerDismissed && (
        <MiniPlayerContainer style={Platform.OS === 'android' && !isTabBarVisible ? { bottom: 12 } : null}>
          <MiniPlayer onOpenPlayer={() => setActiveTab('relax')} onOpenTimer={() => setShowTimer(true)} />
        </MiniPlayerContainer>
      )}

      {/* Premium glowing central bottom tab bar navigation (Somora style) */}
      <BottomTabBar style={{ transform: [{ translateY: tabBarY }] }}>
        <TabButton onPress={() => setActiveTab('home')} active={activeTab === 'home'}>
          <Home size={22} color={activeTab === 'home' ? '#FF7E47' : '#6B6280'} />
          <TabLabel active={activeTab === 'home'}>Home</TabLabel>
        </TabButton>

        <TabButton onPress={() => setActiveTab('sleep')} active={activeTab === 'sleep'}>
          <Moon size={22} color={activeTab === 'sleep' ? '#FF7E47' : '#6B6280'} />
          <TabLabel active={activeTab === 'sleep'}>Sleep+</TabLabel>
        </TabButton>

        {/* Center glowing orb tab button (cloning Somora central neon sleep trigger button) */}
        <CenterOrbWrapper onPress={() => setActiveTab('relax')}>
          <CenterGlowOrb active={activeTab === 'relax'}>
            <RelaxYogaIcon size={50} color="#08080A" />
          </CenterGlowOrb>
        </CenterOrbWrapper>

        <TabButton onPress={() => { setActiveTab('double'); dispatch(setActiveSubScreen('timer')); }} active={activeTab === 'double'}>
          <Clock size={22} color={activeTab === 'double' ? '#FF7E47' : '#6B6280'} />
          <TabLabel active={activeTab === 'double'}>Timer</TabLabel>
        </TabButton>

        <TabButton onPress={() => setActiveTab('habits')} active={activeTab === 'habits'}>
          <Sparkles size={22} color={activeTab === 'habits' ? '#FF7E47' : '#6B6280'} />
          <TabLabel active={activeTab === 'habits'}>Habits</TabLabel>
        </TabButton>
      </BottomTabBar>

      {/* Global App Settings Modal Sheet */}
      {showSettings && (
        <OverlayContainer>
          <SettingsSheet onClose={() => setShowSettings(false)} />
        </OverlayContainer>
      )}

      {/* Scenarios List Sheet */}
      {showScenarios && (
        <OverlayContainer>
          <ScenariosGrid
            onClose={() => setShowScenarios(false)}
            onOpenPaywall={() => setShowPaywall(true)}
            onSelectScenario={() => {
              setShowScenarios(false);
              setActiveTab('relax');
            }}
          />
        </OverlayContainer>
      )}

      {/* Paywall Overlay Modal */}
      {showPaywall && (
        <OverlayContainer>
          <Paywall onClose={() => setShowPaywall(false)} />
        </OverlayContainer>
      )}

      {/* Timer Sheet Picker Bottom Overlay */}
      <TimerSheet visible={showTimer} onClose={() => setShowTimer(false)} />
    </SafeAreaContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MainAppContent />
      </ThemeProvider>
    </Provider>
  );
}

const SafeAreaContainer = styled.View`
  flex: 1;
  background-color: #08080A;
`;

const ContentContainer = styled.View`
  flex: 1;
  background-color: transparent;
`;

const MiniPlayerContainer = styled.View`
  position: absolute;
  bottom: 74px; /* Sits exactly on top of the tab bar */
  left: 0;
  right: 0;
  z-index: 90;
`;

const BottomTabBar = styled(Animated.View)`
  flex-direction: row;
  height: 74px;
  background-color: #111116;
  border-top-width: 1px;
  border-top-color: #1E1E26;
  justify-content: space-around;
  align-items: center;
  padding-bottom: 8px;
  position: relative;
  z-index: 100;
`;

const TabButton = styled.TouchableOpacity<{ active: boolean }>`
  align-items: center;
  justify-content: center;
  width: 65px;
  height: 100%;
`;

const TabLabel = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#6B6280'};
  font-size: 10px;
  font-weight: 600;
  margin-top: 4px;
`;

const CenterOrbWrapper = styled.TouchableOpacity`
  top: -24px; /* Rises above the tab bar */
  width: 64px;
  height: 64px;
  justify-content: center;
  align-items: center;
  z-index: 110;
`;

const CenterGlowOrb = styled.View<{ active?: boolean }>`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  background-color: ${props => props.active ? '#FFF5F0' : '#FF7E47'};
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.6;
  shadow-radius: 12px;
  elevation: 8;
  border-width: 2px;
  border-color: ${props => props.active ? '#FF7E47' : '#FFFFFF'};
`;

const OverlayContainer = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 500;
  background-color: #08080A;
`;
