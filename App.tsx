import React, { useState, useEffect } from 'react';
import { StatusBar, SafeAreaView, View, Text } from 'react-native';
import { Provider } from 'react-redux';
import styled, { ThemeProvider } from 'styled-components/native';
import { Home, Moon, Users, Sparkles, User, Compass, HelpCircle, Clock } from 'lucide-react-native';
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
import { useAudioEngine } from './src/hooks/useAudioEngine';
import { BackgroundOrbs } from './src/components/BackgroundOrbs';
import { SettingsSheet } from './src/components/SettingsSheet';

const MainAppContent: React.FC = () => {
  // Initialize the audio engine hook
  useAudioEngine();

  const dispatch = useAppDispatch();

  // Hydration state
  const [isHydrated, setIsHydrated] = useState(false);

  const habitsState = useAppSelector((state) => state.habits);
  const audioState = useAppSelector((state) => state.audio);
  const isOnboardingCompleted = habitsState.isOnboardingCompleted;
  const { isPlaying, timerIsActive, isMiniPlayerDismissed } = audioState;

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'sleep' | 'double' | 'habits' | 'profile'>('home');

  // Overlay modals state
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const habitsData = await AsyncStorage.getItem('dopamind_habits_state');
        const audioData = await AsyncStorage.getItem('dopamind_audio_state');
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
      AsyncStorage.setItem('dopamind_habits_state', JSON.stringify({
        habits: habitsState.habits,
        isOnboardingCompleted: habitsState.isOnboardingCompleted,
        selectedStruggles: habitsState.selectedStruggles,
        focusScoreTotal: habitsState.focusScoreTotal,
        listeningTimeTotal: habitsState.listeningTimeTotal,
      }));
      AsyncStorage.setItem('dopamind_audio_state', JSON.stringify({
        completedPomodorosCount: audioState.completedPomodorosCount,
        totalFocusSeconds: audioState.totalFocusSeconds,
        weeklyFocusMinutes: audioState.weeklyFocusMinutes,
      }));
    }
  }, [habitsState.habits, habitsState.isOnboardingCompleted, habitsState.selectedStruggles, habitsState.focusScoreTotal, habitsState.listeningTimeTotal, audioState.completedPomodorosCount, audioState.totalFocusSeconds, audioState.weeklyFocusMinutes, isHydrated]);

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
            onOpenPlayer={() => setShowPlayer(true)}
            onOpenTimer={() => setShowTimer(true)}
            onOpenPaywall={() => setShowPaywall(true)}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
      case 'sleep':
        return (
          <SleepDashboard
            onOpenPlayer={() => setShowPlayer(true)}
            onOpenPaywall={() => setShowPaywall(true)}
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
            onOpenPlayer={() => setShowPlayer(true)}
            onOpenTimer={() => setShowTimer(true)}
            onOpenPaywall={() => setShowPaywall(true)}
            onNavigateToTab={(tab: any) => setActiveTab(tab)}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
    }
  };

  return (
    <SafeAreaContainer>
      <StatusBar barStyle="light-content" backgroundColor="#08080A" />
      <BackgroundOrbs />

      {/* Main active screen */}
      <ContentContainer>{renderTabContent()}</ContentContainer>

      {/* Persistent Audio Mini Player overlay */}
      {!showPlayer && (isPlaying || timerIsActive) && !isMiniPlayerDismissed && (
        <MiniPlayerContainer>
          <MiniPlayer onOpenPlayer={() => setShowPlayer(true)} onOpenTimer={() => setShowTimer(true)} />
        </MiniPlayerContainer>
      )}

      {/* Premium glowing central bottom tab bar navigation (Somora style) */}
      <BottomTabBar>
        <TabButton onPress={() => setActiveTab('home')} active={activeTab === 'home'}>
          <Home size={22} color={activeTab === 'home' ? '#FF7E47' : '#6B6280'} />
          <TabLabel active={activeTab === 'home'}>Home</TabLabel>
        </TabButton>

        <TabButton onPress={() => setActiveTab('sleep')} active={activeTab === 'sleep'}>
          <Moon size={22} color={activeTab === 'sleep' ? '#FF7E47' : '#6B6280'} />
          <TabLabel active={activeTab === 'sleep'}>Sleep</TabLabel>
        </TabButton>

        {/* Center glowing orb tab button (cloning Somora central neon sleep trigger button) */}
        <CenterOrbWrapper onPress={() => setShowPlayer(true)}>
          <CenterGlowOrb>
            <Compass size={26} color="#08080A" />
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

      {/* Soundscape Immersive Player Modal */}
      {showPlayer && (
        <OverlayContainer>
          <SoundPlayer onClose={() => setShowPlayer(false)} onOpenTimerSheet={() => setShowTimer(true)} />
        </OverlayContainer>
      )}

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
              setShowPlayer(true);
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

const BottomTabBar = styled.View`
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

const CenterGlowOrb = styled.View`
  width: 54px;
  height: 54px;
  border-radius: 27px;
  background-color: #FF7E47;
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.6;
  shadow-radius: 12px;
  elevation: 8;
  border-width: 2px;
  border-color: #FFFFFF;
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
