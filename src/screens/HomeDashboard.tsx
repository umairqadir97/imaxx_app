import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, Dimensions, TouchableOpacity, Text, Modal, Platform, Image, Animated, Easing, View } from 'react-native';
import styled from 'styled-components/native';
import { Compass, Gift, User, Plus, Lock, Play, Pause, X, Star, Sparkles, Check, ChevronRight, Grid, Calendar, Clock, Settings as SettingsIcon, Music, Flame, BarChart2, Activity, Volume2, RotateCcw } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../store';
import { setSoundscape, startTimer, togglePlayback, stopTimer } from '../store/audioSlice';
import { toggleHabitCompletion, setHabitsSubTab } from '../store/habitSlice';
import { GlassCard } from '../components/GlassCard';
import { HabitGrid } from '../components/HabitGrid';
import { theme } from '../theme/colors';
import { CompanionStage, CompanionType, COMPANION_IMAGES, getEmotionalState, getEmotionalLabel } from '../components/CompanionStage';
import { getLocalDateStr } from '../utils/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserJourneyMapModal } from '../components/UserJourneyMapModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Styled Components defined at top to prevent TDZ ReferenceErrors in eager module loads ───
const QuickCheckoffOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.85);
  justify-content: flex-end;
`;

const QuickCheckoffCard = styled.View`
  background-color: #0E0E14;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.06);
  max-height: 80%;
  padding: 24px;
`;

const QuickCheckoffHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CloseQuickCheckoffButton = styled.TouchableOpacity`
  background-color: #1E1E26;
  padding: 14px 0;
  border-radius: 16px;
  align-items: center;
  margin-top: 18px;
`;

const CloseQuickCheckoffButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
`;

const SimulatorOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.9);
  justify-content: flex-end;
`;

const SimulatorCard = styled.View`
  background-color: #08080C;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
  height: 90%;
  padding: 24px;
`;

const SimulatorHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 800;
`;

const ModalSubtitle = styled.Text`
  color: #6B6280;
  font-size: 13px;
  margin-top: 4px;
  margin-bottom: 18px;
`;

const WidgetTabContainer = styled.View`
  flex-direction: row;
  background-color: #111116;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
`;

const WidgetTab = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  padding: 10px 0;
  align-items: center;
  border-radius: 8px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.15)' : 'transparent'};
`;

const WidgetTabText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#8E8E93'};
  font-size: 12px;
  font-weight: bold;
`;

// ─── Consistency Counter List Styled Components ───
const ConsistencyHabitsList = styled.View`
  margin-bottom: 20px;
`;

const ConsistencyHabitCard = styled.TouchableOpacity`
  background-color: rgba(14, 14, 18, 0.85);
  border-width: 1.5px;
  border-color: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 12px 16px;
  margin-bottom: 8px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ConsistencyCardLeft = styled.View`
  flex: 1;
`;

const ConsistencyHabitName = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 6px;
`;

const MiniGridRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const MiniGridDot = styled.View<{ completed: boolean; color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background-color: ${props => props.completed ? props.color : 'rgba(255, 255, 255, 0.06)'};
  margin-right: 4px;
`;

const ConsistencyCardRight = styled.View`
  flex-direction: row;
  align-items: center;
`;

const MiniStreakText = styled.Text`
  color: #FF7E47;
  font-size: 12px;
  font-weight: bold;
  margin-right: 8px;
`;

interface HomeDashboardProps {
  onOpenPlayer: () => void;
  onOpenTimer: () => void;
  onOpenPaywall: () => void;
  onNavigateToTab: (tabName: string) => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  isGuest?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onOpenPlayer,
  onOpenTimer,
  onOpenPaywall,
  onNavigateToTab,
  onOpenSettings,
  onOpenAuth,
  isGuest = false,
}) => {
  const dispatch = useAppDispatch();

  // Redux store states
  const habits = useAppSelector((state) => state.habits.habits);
  const { isPlaying, timerIsActive, timerTimeLeft, timerDuration, activeSoundscape, completedPomodorosCount, totalFocusSeconds, weeklyFocusMinutes, isPremiumUnlocked } = useAppSelector((state) => state.audio);

  const [selectedDuration, setSelectedDuration] = useState(1500); // Default 25 min
  const [activeCompanion, setActiveCompanion] = useState<CompanionType>('red_panda');
  const [showWidgetSimulator, setShowWidgetSimulator] = useState(false);
  const [showQuickCheckoff, setShowQuickCheckoff] = useState(false);
  const [showUserJourneyModal, setShowUserJourneyModal] = useState(false);
  const [activeWidgetType, setActiveWidgetType] = useState<'companion' | 'habits' | 'timer' | 'stats' | 'soundscape' | 'circadian'>('companion');
  const [confettiParticles, setConfettiParticles] = useState<any[]>([]);

  const triggerConfettiAnimation = () => {
    const colors = ['#FF6B6B', '#FFB347', '#38EF7D', '#00F2FE', '#9B7EDE', '#FF7EB9'];
    const particleData = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * SCREEN_WIDTH,
      y: new Animated.Value(-30),
      rotate: `${Math.random() * 360}deg`,
      scale: Math.random() * 0.7 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfettiParticles(particleData);

    const anims = particleData.map(p => {
      return Animated.timing(p.y, {
        toValue: 900,
        duration: Math.random() * 1200 + 800,
        useNativeDriver: false,
      });
    });

    Animated.parallel(anims).start(() => {
      setConfettiParticles([]);
    });
  };

  const handleToggleHabitCompletion = (habitId: string) => {
    if (!isPremiumUnlocked) {
      onOpenPaywall();
      return;
    }
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      const wasCompleted = habit.completions.includes(todayStr);
      dispatch(toggleHabitCompletion({ habitId, date: todayStr }));
      if (!wasCompleted) {
        triggerConfettiAnimation();
      }
    }
  };

  const navigateToMicroHabits = async () => {
    if (!isPremiumUnlocked) {
      onOpenPaywall();
      return;
    }
    dispatch(setHabitsSubTab('micro'));
    try {
      await AsyncStorage.setItem('habits_sub_tab', 'micro');
    } catch (e) { }
    onNavigateToTab('habits');
  };

  // Load selection from storage
  useEffect(() => {
    const loadCompanion = async () => {
      try {
        const saved = await AsyncStorage.getItem('iMaxx_active_companion');
        if (saved) {
          setActiveCompanion(saved as CompanionType);
        }
      } catch (e) { }
    };
    loadCompanion();
  }, []);

  const handleActiveCompanionChange = async (newCompanion: CompanionType) => {
    if (!isPremiumUnlocked) {
      onOpenPaywall();
      return;
    }
    setActiveCompanion(newCompanion);
    try {
      await AsyncStorage.setItem('iMaxx_active_companion', newCompanion);
    } catch (e) { }
  };

  // Merge completions from all habits to show a combined HabitKit activity board
  const getMergedCompletions = () => {
    const allCompletions = new Set<string>();
    habits.forEach(habit => {
      habit.completions.forEach(c => allCompletions.add(c));
    });
    return Array.from(allCompletions);
  };

  const mergedCompletions = getMergedCompletions();
  const todayStr = getLocalDateStr();

  // Radial Pomodoro variables
  const radius = 64;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = timerIsActive ? (timerTimeLeft / timerDuration) : 1;
  const strokeDashoffset = circumference - progressPercent * circumference;

  // Calculate coordinates of the cursor dot at the end of progress path
  const angle = progressPercent * 2 * Math.PI - Math.PI / 2; // offset by 90deg to start at top
  const cx = radius + (radius * Math.cos(angle)) + strokeWidth;
  const cy = radius + (radius * Math.sin(angle)) + strokeWidth;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartTimer = () => {
    if (!isPremiumUnlocked) {
      onOpenPaywall();
      return;
    }
    if (timerIsActive) {
      dispatch(togglePlayback());
    } else {
      dispatch(startTimer(selectedDuration));
    }
  };

  const handleCancelTimer = () => {
    dispatch(stopTimer());
  };

  const totalHabits = habits.length;
  const completedHabitsCount = habits.filter(h => h.completions.includes(todayStr)).length;
  const focusSessionFactor = timerIsActive ? (1 - (timerTimeLeft / timerDuration)) * 0.25 : 0;
  const fillProgress = Math.min(1.0, Math.max(0.0, (totalHabits > 0 ? completedHabitsCount / totalHabits : 0) + focusSessionFactor));

  const currentHour = new Date().getHours();
  const companionState = (timerIsActive && isPlaying) ? 'focus' : (currentHour >= 21 || currentHour < 6) ? 'sleep' : 'idle';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);
  const completedYesterdayCount = habits.filter(h => h.completions.includes(yesterdayStr)).length;

  const maxStreakCount = Math.max(...habits.map(h => h.streakCount), 0);

  const getHabitLast10Days = (completions: string[]) => {
    const dots = [];
    for (let i = 9; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      dots.push({
        dateStr,
        completed: completions.includes(dateStr),
      });
    }
    return dots;
  };

  return (
    <Container>
      {/* Sticky top header bar */}
      <HeaderBar>
        <LogoArea>
          <ActionButton onPress={onOpenSettings} style={{ marginRight: 10 }}>
            <SettingsIcon size={18} color="#FFFFFF" />
          </ActionButton>
          <LogoIconGlow style={{ marginLeft: 4 }}>
            <Compass size={18} color="#FF7E47" />
          </LogoIconGlow>
          <LogoText>iMaxx</LogoText>
        </LogoArea>

        <HeaderActions>
          <PaywallBadge onPress={onOpenPaywall}>
            <Star size={10} color="#FF7E47" fill={isPremiumUnlocked ? '#FF7E47' : 'transparent'} style={{ marginRight: 4 }} />
            <BadgeText>{isPremiumUnlocked ? 'PRO' : 'UPGRADE'}</BadgeText>
          </PaywallBadge>
          <ActionButton onPress={() => onNavigateToTab('profile')}>
            <User size={18} color="#FFFFFF" />
          </ActionButton>
        </HeaderActions>
      </HeaderBar>

      {/* Free Plan Lock Banner */}
      {!isPremiumUnlocked && (
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(255, 126, 71, 0.12)',
            borderWidth: 1,
            borderColor: 'rgba(255, 126, 71, 0.35)',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginHorizontal: 20,
            marginTop: 10,
            marginBottom: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          onPress={onOpenPaywall}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Lock size={16} color="#FF7E47" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 13 }}>
              🔒 Free Plan — <Text style={{ color: '#FF7E47', fontWeight: 'bold' }}>Upgrade to iMaxx Premium</Text> to unlock all features
            </Text>
          </View>
          <ChevronRight size={16} color="#FF7E47" />
        </TouchableOpacity>
      )}

      <ScrollContent showsVerticalScrollIndicator={false} style={{ opacity: !isPremiumUnlocked ? 0.45 : 1 }}>

        {/* Gamified Focus Companion Stage */}
        <CompanionStage
          fillProgress={fillProgress}
          state={companionState}
          totalFocusSeconds={totalFocusSeconds}
          completedHabitsCount={completedHabitsCount}
          maxStreakCount={maxStreakCount}
          activeCompanion={activeCompanion}
          onChangeCompanion={handleActiveCompanionChange}
          totalTasksCount={totalHabits}
          completedTasksCount={completedHabitsCount}
          onPressTaskPreview={() => isPremiumUnlocked ? setShowQuickCheckoff(true) : onOpenPaywall()}
          onPressUserJourney={() => isPremiumUnlocked ? setShowUserJourneyModal(true) : onOpenPaywall()}
        />

        {/* Consistency Counter (moved directly below Companion Stage & above ADHD Focus Dial) */}
        <SectionTitleRow>
          <SectionTitle>Consistency Counter</SectionTitle>
          <ShowAllLink onPress={navigateToMicroHabits}>Manage Habits →</ShowAllLink>
        </SectionTitleRow>

        <ConsistencyHabitsList>
          {habits.length === 0 ? (
            <ConsistencyHabitCard onPress={navigateToMicroHabits} activeOpacity={0.85}>
              <ConsistencyCardLeft>
                <ConsistencyHabitName>Create your first micro-habit</ConsistencyHabitName>
                <Text style={{ color: '#6B6280', fontSize: 11 }}>Build daily routines to level up companion energy</Text>
              </ConsistencyCardLeft>
              <ConsistencyCardRight>
                <ChevronRight size={16} color="#6B6280" />
              </ConsistencyCardRight>
            </ConsistencyHabitCard>
          ) : (
            habits.slice(0, 4).map(habit => {
              const dots = getHabitLast10Days(habit.completions);
              return (
                <ConsistencyHabitCard
                  key={habit.id}
                  onPress={navigateToMicroHabits}
                  activeOpacity={0.85}
                >
                  <ConsistencyCardLeft>
                    <ConsistencyHabitName>{habit.name}</ConsistencyHabitName>
                    <MiniGridRow>
                      {dots.map((dot, idx) => (
                        <MiniGridDot
                          key={idx}
                          completed={dot.completed}
                          color={habit.color || '#FF7E47'}
                        />
                      ))}
                    </MiniGridRow>
                  </ConsistencyCardLeft>
                  <ConsistencyCardRight>
                    <MiniStreakText>🔥 {habit.streakCount}d</MiniStreakText>
                    <ChevronRight size={16} color="#6B6280" />
                  </ConsistencyCardRight>
                </ConsistencyHabitCard>
              );
            })
          )}
        </ConsistencyHabitsList>

        {/* Frictionless ADHD Zero-Guilt Clean Slate Banner */}
        {completedYesterdayCount === 0 && (
          <GlassCard style={{ padding: 14, marginBottom: 20, backgroundColor: 'rgba(78,205,196,0.06)', borderColor: 'rgba(78,205,196,0.15)', alignItems: 'center' }}>
            <Text style={{ color: '#4ECDC4', fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>
              ☀️ Clean Slate Day! Your companion is rested and excited to join you today. Let's start with just one micro-habit!
            </Text>
          </GlassCard>
        )}

        {/* Expenses-style Radial Focus Timer Card (cloned from expenses ring in Image 1) */}
        <SectionTitle>ADHD Focus Dial</SectionTitle>
        <TimerDialCard>
          <DialRow>
            {/* Svg Radial Dial */}
            <SvgContainer>
              <Svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2}>
                <Defs>
                  <LinearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#00F2FE" />
                    <Stop offset="1" stopColor="#4FACFE" />
                  </LinearGradient>
                </Defs>

                {/* Background track circle */}
                <Circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke="#1E1E26"
                  strokeWidth={strokeWidth}
                  fill="none"
                />

                {/* Progress bar circle */}
                <Circle
                  cx={radius + strokeWidth}
                  cy={radius + strokeWidth}
                  r={radius}
                  stroke="url(#tealGrad)"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
                />

                {timerIsActive && (
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill="#FFFFFF"
                  />
                )}
              </Svg>

              {/* Central text overlay inside Dial */}
              <DialOverlayCenter>
                <DialCenterPercent>
                  {timerIsActive ? formatTimer(timerTimeLeft) : `${Math.floor(selectedDuration / 60)}m`}
                </DialCenterPercent>
                <DialCenterSubtext>
                  {timerIsActive ? (isPlaying ? 'Focusing' : 'Paused') : 'Ready'}
                </DialCenterSubtext>
              </DialOverlayCenter>
            </SvgContainer>

            {/* Play controls and quick selects */}
            <DialControlsSection>
              <DialLabelText>ADHD Focus Session</DialLabelText>
              <DialDescText>Fades out sound when complete.</DialDescText>

              {/* Pomodoro presets picker */}
              {!timerIsActive && (
                <PresetSelectionRow>
                  {[15, 25, 45].map((mins) => (
                    <PresetPill
                      key={mins}
                      active={selectedDuration === mins * 60}
                      onPress={() => setSelectedDuration(mins * 60)}
                    >
                      <PresetPillText active={selectedDuration === mins * 60}>
                        {mins}m
                      </PresetPillText>
                    </PresetPill>
                  ))}
                </PresetSelectionRow>
              )}

              {/* Action buttons (Orange gradient start trigger) */}
              <ActionButtonsRow>
                <OrangeGradientButton onPress={handleStartTimer}>
                  {timerIsActive && isPlaying ? (
                    <>
                      <Pause size={16} color="#08080A" fill="#08080A" style={{ marginRight: 6 }} />
                      <OrangeButtonText>Pause</OrangeButtonText>
                    </>
                  ) : (
                    <>
                      <Play size={16} color="#08080A" fill="#08080A" style={{ marginRight: 6 }} />
                      <OrangeButtonText>{timerIsActive ? 'Resume' : 'Start Focus'}</OrangeButtonText>
                    </>
                  )}
                </OrangeGradientButton>

                {timerIsActive && (
                  <CancelButton onPress={handleCancelTimer}>
                    <X size={16} color="#FFFFFF" />
                  </CancelButton>
                )}
              </ActionButtonsRow>
            </DialControlsSection>
          </DialRow>
        </TimerDialCard>

        {/* Focus Performance Stats widget (Image 5 & 3) */}
        <SectionTitleRow>
          <SectionTitle>Focus Performance</SectionTitle>
          <ShowAllLink onPress={() => onNavigateToTab('double')}>Timer Stats →</ShowAllLink>
        </SectionTitleRow>

        <FocusStatsWidgetCard>
          <WidgetStatsRow>
            <WidgetStatBox>
              <WidgetStatLabel>Total Pomodoros</WidgetStatLabel>
              <WidgetStatValue>🍅 {completedPomodorosCount}</WidgetStatValue>
            </WidgetStatBox>

            <WidgetStatBox>
              <WidgetStatLabel>Total Focus Hours</WidgetStatLabel>
              <WidgetStatValue>{Math.floor(totalFocusSeconds / 3600)}h</WidgetStatValue>
            </WidgetStatBox>

            <WidgetStatBox>
              <WidgetStatLabel>Daily Average</WidgetStatLabel>
              <WidgetStatValue>
                {(() => {
                  const activeDaysCount = weeklyFocusMinutes ? weeklyFocusMinutes.filter(m => m > 0).length || 1 : 1;
                  const weeklyMins = weeklyFocusMinutes ? weeklyFocusMinutes.reduce((acc, m) => acc + m, 0) : 0;
                  const dailyAvgMins = Math.round(weeklyMins / activeDaysCount);
                  const avgH = Math.floor(dailyAvgMins / 60);
                  const avgM = Math.round(dailyAvgMins % 60);
                  return weeklyMins > 0 ? `${avgH}h ${avgM < 10 ? '0' : ''}${avgM}m` : '0h 00m';
                })()}
              </WidgetStatValue>
            </WidgetStatBox>
          </WidgetStatsRow>
          <WidgetStatsSubtext>🔥 Active focus sessions sync in real-time.</WidgetStatsSubtext>
        </FocusStatsWidgetCard>

        {/* ADHD Homescreen & Lockscreen Widgets Section */}
        <SectionTitleRow>
          <SectionTitle>Interactive Widgets</SectionTitle>
          <SectionInfoText>Tap to open interactive simulator</SectionInfoText>
        </SectionTitleRow>

        <WidgetsHorizontalCarousel horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {/* Card 1: Companion */}
          <WidgetMockCard onPress={() => { setActiveWidgetType('companion'); setShowWidgetSimulator(true); }}>
            <WidgetTitleRow>
              <WidgetPill style={{ color: '#00F2FE' }}>COMPANION</WidgetPill>
            </WidgetTitleRow>
            <Image
              source={
                activeCompanion === 'red_panda'
                  ? COMPANION_IMAGES.red_panda[getEmotionalState(fillProgress, companionState)]
                  : COMPANION_IMAGES[activeCompanion]?.roster || COMPANION_IMAGES.red_panda.happy
              }
              style={{ width: 44, height: 44, borderRadius: 8, marginVertical: 6 }}
              resizeMode="contain"
            />
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
              Energy: {Math.round(fillProgress * 100)}%
            </Text>
            <WidgetNameText style={{ fontSize: 9, opacity: 0.6 }}>Tap to customize</WidgetNameText>
          </WidgetMockCard>

          {/* Card 2: Habits Checklist */}
          <WidgetMockCard onPress={() => { setActiveWidgetType('habits'); setShowWidgetSimulator(true); }}>
            <WidgetTitleRow>
              <WidgetPill style={{ color: '#FF7E47' }}>DAILY HABITS</WidgetPill>
            </WidgetTitleRow>
            <View style={{ width: '100%', marginVertical: 4 }}>
              {habits.slice(0, 2).map((habit) => {
                const isCompleted = habit.completions.includes(todayStr);
                return (
                  <TouchableOpacity
                    key={habit.id}
                    onPress={(e) => {
                      e.stopPropagation(); // Prevent opening simulator modal
                      handleToggleHabitCompletion(habit.id);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 3 }}
                  >
                    <WidgetCheckCircle completed={isCompleted} color={habit.color} style={{ width: 10, height: 10, borderRadius: 5 }}>
                      {isCompleted && <Check size={5} color="#08080A" strokeWidth={4} />}
                    </WidgetCheckCircle>
                    <Text numberOfLines={1} style={{ color: isCompleted ? '#444' : '#FFF', fontSize: 9, marginLeft: 6, textDecorationLine: isCompleted ? 'line-through' : 'none', flex: 1 }}>
                      {habit.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <WidgetNameText style={{ fontSize: 9, opacity: 0.6 }}>Tap to open list</WidgetNameText>
          </WidgetMockCard>

          {/* Card 3: Pomodoro Focus Timer */}
          <WidgetMockCard onPress={() => { setActiveWidgetType('timer'); setShowWidgetSimulator(true); }}>
            <WidgetTitleRow>
              <WidgetPill style={{ color: '#FFB347' }}>FOCUS TIMER</WidgetPill>
            </WidgetTitleRow>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginVertical: 4 }}>
              {formatTimer(timerTimeLeft)}
            </Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleStartTimer();
              }}
              style={{ backgroundColor: 'rgba(255,179,71,0.1)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, marginVertical: 4 }}
            >
              <Text style={{ color: '#FFB347', fontSize: 9, fontWeight: '800' }}>
                {timerIsActive ? 'PAUSE' : 'START'}
              </Text>
            </TouchableOpacity>
            <WidgetNameText style={{ fontSize: 9, opacity: 0.6 }}>{timerIsActive ? 'Focus Running' : 'Tap to start'}</WidgetNameText>
          </WidgetMockCard>

          {/* Card 4: Focus Stats */}
          <WidgetMockCard onPress={() => { setActiveWidgetType('stats'); setShowWidgetSimulator(true); }}>
            <WidgetTitleRow>
              <WidgetPill style={{ color: '#38EF7D' }}>FOCUS STATS</WidgetPill>
            </WidgetTitleRow>
            <BarChart2 size={24} color="#38EF7D" style={{ marginVertical: 4 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
              {Math.round(totalFocusSeconds / 60)} mins tracked
            </Text>
            <WidgetNameText style={{ fontSize: 9, opacity: 0.6 }}>View weekly stats</WidgetNameText>
          </WidgetMockCard>

          {/* Card 5: Mind Waves */}
          <WidgetMockCard onPress={() => { setActiveWidgetType('soundscape'); setShowWidgetSimulator(true); }}>
            <WidgetTitleRow>
              <WidgetPill style={{ color: '#9B7EDE' }}>MIND WAVES</WidgetPill>
            </WidgetTitleRow>
            <Music size={24} color="#9B7EDE" style={{ marginVertical: 4 }} />
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                dispatch(togglePlayback());
              }}
              style={{ backgroundColor: 'rgba(155,126,222,0.15)', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 }}
            >
              <Text style={{ color: '#9B7EDE', fontSize: 9, fontWeight: '800' }}>
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </Text>
            </TouchableOpacity>
            <WidgetNameText style={{ fontSize: 9, opacity: 0.6 }} numberOfLines={1}>
              {activeSoundscape.toUpperCase()}
            </WidgetNameText>
          </WidgetMockCard>

          {/* Card 6: Circadian Rhythm */}
          <WidgetMockCard onPress={() => { setActiveWidgetType('circadian'); setShowWidgetSimulator(true); }}>
            <WidgetTitleRow>
              <WidgetPill style={{ color: '#E91E63' }}>CIRCADIAN</WidgetPill>
            </WidgetTitleRow>
            <Activity size={24} color="#E91E63" style={{ marginVertical: 4 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', textAlign: 'center' }}>
              Peak alert state
            </Text>
            <WidgetNameText style={{ fontSize: 9, opacity: 0.6 }}>Tap to sync status</WidgetNameText>
          </WidgetMockCard>
        </WidgetsHorizontalCarousel>

        {/* We removed the inline Micro Habits checklist from home tab and put it in a quick checkoff popup modal instead */}
        <ExtraSpacing />
      </ScrollContent>

      {/* ─── Quick Task Checkoff Modal ─── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQuickCheckoff}
        onRequestClose={() => setShowQuickCheckoff(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowQuickCheckoff(false)}
        >
          <QuickCheckoffOverlay>
            <TouchableOpacity activeOpacity={1} onPress={(e: any) => e.stopPropagation()}>
              <QuickCheckoffCard>
                <QuickCheckoffHeader>
                  <ModalTitle>Today's Tasks & Goals</ModalTitle>
                  <TouchableOpacity onPress={() => setShowQuickCheckoff(false)}>
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </QuickCheckoffHeader>
                <ModalSubtitle>Quickly log completions for your daily checklist</ModalSubtitle>

                <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                  {habits.length === 0 ? (
                    <View style={{ alignItems: 'center', marginVertical: 40 }}>
                      <Sparkles size={40} color="#6B6280" style={{ marginBottom: 12 }} />
                      <Text style={{ color: '#8E8E93', fontSize: 14, fontWeight: 'bold' }}>No tasks created yet</Text>
                      <TouchableOpacity
                        onPress={() => { setShowQuickCheckoff(false); onNavigateToTab('habits'); }}
                        style={{ marginTop: 12, backgroundColor: '#FF7E47', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 }}
                      >
                        <Text style={{ color: '#08080C', fontWeight: 'bold', fontSize: 12 }}>Go to Habits tab</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    habits.map(habit => {
                      const isCompletedToday = habit.completions.includes(todayStr);
                      return (
                        <HabitCheckRow key={habit.id} completed={isCompletedToday}>
                          <HabitPressableArea onPress={() => handleToggleHabitCompletion(habit.id)}>
                            <CheckCircle completed={isCompletedToday} color={habit.color}>
                              {isCompletedToday && <Check size={14} color="#08080A" strokeWidth={3} />}
                            </CheckCircle>
                            <HabitTextInfo>
                              <HabitName completed={isCompletedToday}>{habit.name}</HabitName>
                              <HabitUnit>{habit.smallestUnit}</HabitUnit>
                            </HabitTextInfo>
                          </HabitPressableArea>
                          <HabitStreak>🔥 {habit.streakCount}d</HabitStreak>
                        </HabitCheckRow>
                      );
                    })
                  )}
                </ScrollView>

                <CloseQuickCheckoffButton onPress={() => setShowQuickCheckoff(false)}>
                  <CloseQuickCheckoffButtonText>Close Checklist</CloseQuickCheckoffButtonText>
                </CloseQuickCheckoffButton>
              </QuickCheckoffCard>
            </TouchableOpacity>
          </QuickCheckoffOverlay>
        </TouchableOpacity>
      </Modal>

      {/* ─── User Journey Mission Road Map Modal ─── */}
      <UserJourneyMapModal
        visible={showUserJourneyModal}
        onClose={() => setShowUserJourneyModal(false)}
      />

      {/* ─── Widget Simulator Modal ─── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showWidgetSimulator}
        onRequestClose={() => setShowWidgetSimulator(false)}
      >
        <SimulatorOverlay>
          <SimulatorCard>
            <SimulatorHeader>
              <ModalTitle>Interactive Widgets</ModalTitle>
              <TouchableOpacity onPress={() => setShowWidgetSimulator(false)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </SimulatorHeader>
            <ModalSubtitle>Simulate widgets on a physical home screen</ModalSubtitle>

            {/* Widget tab selectors */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ maxHeight: 42, marginBottom: 12 }}
              contentContainerStyle={{ paddingHorizontal: 12 }}
            >
              {[
                { id: 'companion', label: 'Companion' },
                { id: 'habits', label: 'Habits' },
                { id: 'timer', label: 'Timer' },
                { id: 'stats', label: 'Stats' },
                { id: 'soundscape', label: 'Mind Waves' },
                { id: 'circadian', label: 'Circadian' },
              ].map((tab) => (
                <WidgetTab
                  key={tab.id}
                  active={activeWidgetType === tab.id}
                  onPress={() => setActiveWidgetType(tab.id as any)}
                  style={{ marginRight: 8, paddingHorizontal: 14 }}
                >
                  <WidgetTabText active={activeWidgetType === tab.id}>{tab.label}</WidgetTabText>
                </WidgetTab>
              ))}
            </ScrollView>

            {/* Simulated Phone Shell */}
            <PhoneShell>
              <PhoneNotch />
              <PhoneStatusBar>
                <StatusTimeText>3:01 PM</StatusTimeText>
                <StatusIconsArea>
                  <Clock size={10} color="#8E8E93" style={{ marginRight: 4 }} />
                  <Star size={10} color="#FF7E47" fill="#FF7E47" />
                </StatusIconsArea>
              </PhoneStatusBar>

              <PhoneScreenContent style={{ backgroundColor: '#07070A' }}>
                <ScrollView 
                  style={{ flex: 1 }} 
                  contentContainerStyle={{ paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' }}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Category: Companion (Focus Ring) */}
                  {activeWidgetType === 'companion' && (
                    <>
                      <WidgetSizeLabel>Small (2x2)</WidgetSizeLabel>
                      <SmallWidget color="#00F2FE">
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Image
                            source={
                              activeCompanion === 'red_panda'
                                ? COMPANION_IMAGES.red_panda[getEmotionalState(fillProgress, companionState)]
                                : activeCompanion === 'brain'
                                  ? COMPANION_IMAGES.brain[getEmotionalState(fillProgress, companionState)]
                                  : COMPANION_IMAGES[activeCompanion]?.roster || COMPANION_IMAGES.red_panda.happy
                            }
                            style={{ width: 42, height: 42, borderRadius: 8, marginBottom: 4 }}
                            resizeMode="contain"
                          />
                          <Text style={{ color: '#00F2FE', fontSize: 10, fontWeight: '800' }}>
                            {Math.round(fillProgress * 100)}% Energy
                          </Text>
                        </View>
                      </SmallWidget>

                      <WidgetSizeLabel>Medium (4x2)</WidgetSizeLabel>
                      <MediumWidget color="#00F2FE">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <WidgetIconGlow style={{ backgroundColor: 'rgba(0, 242, 254, 0.1)' }}>
                            <Compass size={12} color="#00F2FE" />
                          </WidgetIconGlow>
                          <Text style={{ fontSize: 8, fontWeight: '800', color: '#08080C', backgroundColor: '#00F2FE', paddingVertical: 1, paddingHorizontal: 4, borderRadius: 4 }}>LIVE PROGRESS</Text>
                        </WidgetHeaderRow>
                        <WidgetContentBody style={{ paddingBottom: 0 }}>
                          <Image
                            source={
                              activeCompanion === 'red_panda'
                                ? COMPANION_IMAGES.red_panda[getEmotionalState(fillProgress, companionState)]
                                : activeCompanion === 'brain'
                                  ? COMPANION_IMAGES.brain[getEmotionalState(fillProgress, companionState)]
                                  : COMPANION_IMAGES[activeCompanion]?.roster || COMPANION_IMAGES.red_panda.happy
                            }
                            style={{ width: 40, height: 40, borderRadius: 8 }}
                            resizeMode="contain"
                          />
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={{ color: '#00F2FE', fontSize: 12, fontWeight: '800' }}>
                              {activeCompanion === 'red_panda' ? 'Panda Focus' : 'Companion'}
                            </Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, fontWeight: '600', marginTop: 1 }}>
                              {timerIsActive ? `${formatTimer(timerTimeLeft)} left` : 'Ready to start!'}
                            </Text>
                            <WidgetProgressTrack style={{ marginTop: 4, height: 3 }}>
                              <WidgetProgressFill style={{ width: `${progressPercent * 100}%`, backgroundColor: '#00F2FE' }} />
                            </WidgetProgressTrack>
                          </View>
                        </WidgetContentBody>
                      </MediumWidget>

                      <WidgetSizeLabel>Large (4x4)</WidgetSizeLabel>
                      <LargeWidget color="#00F2FE">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <Text style={{ color: '#00F2FE', fontSize: 11, fontWeight: '800' }}>Companion Vitality</Text>
                          <Star size={12} color="#00F2FE" fill="#00F2FE" />
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Image
                            source={
                              activeCompanion === 'red_panda'
                                ? COMPANION_IMAGES.red_panda[getEmotionalState(fillProgress, companionState)]
                                : activeCompanion === 'brain'
                                  ? COMPANION_IMAGES.brain[getEmotionalState(fillProgress, companionState)]
                                  : COMPANION_IMAGES[activeCompanion]?.roster || COMPANION_IMAGES.red_panda.happy
                            }
                            style={{ width: 44, height: 44, borderRadius: 8 }}
                            resizeMode="contain"
                          />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Status: {getEmotionalLabel(getEmotionalState(fillProgress, companionState))}</Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, marginTop: 1 }}>Energy sync: {Math.round(fillProgress * 100)}%</Text>
                          </View>
                        </View>
                        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 6 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={{ color: '#8E8E93', fontSize: 9 }}>Focus Power</Text>
                            <Text style={{ color: '#00F2FE', fontSize: 9, fontWeight: '800' }}>90%</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                            <Text style={{ color: '#8E8E93', fontSize: 9 }}>Calm Level</Text>
                            <Text style={{ color: '#4ECDC4', fontSize: 9, fontWeight: '800' }}>75%</Text>
                          </View>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#8E8E93', fontSize: 9 }}>Rest Index</Text>
                            <Text style={{ color: '#9B7EDE', fontSize: 9, fontWeight: '800' }}>80%</Text>
                          </View>
                        </View>
                      </LargeWidget>
                    </>
                  )}

                  {/* Category: Habits */}
                  {activeWidgetType === 'habits' && (
                    <>
                      <WidgetSizeLabel>Small (2x2)</WidgetSizeLabel>
                      <SmallWidget color="#FF7E47">
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Star size={16} color="#FF7E47" fill="#FF7E47" style={{ marginBottom: 4 }} />
                          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>{completedHabitsCount}/{habits.length}</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 8, fontWeight: '600', marginTop: 1 }}>Habits Done</Text>
                        </View>
                      </SmallWidget>

                      <WidgetSizeLabel>Medium (4x2)</WidgetSizeLabel>
                      <MediumWidget color="#FF7E47">
                        <WidgetHeaderRow style={{ marginBottom: 4 }}>
                          <Text style={{ color: '#FF7E47', fontSize: 11, fontWeight: '800' }}>Habits Checklist</Text>
                          <Check size={12} color="#FF7E47" />
                        </WidgetHeaderRow>
                        <WidgetChecklistContainer style={{ borderTopWidth: 0, paddingTop: 2, marginTop: 2 }}>
                          {habits.slice(0, 2).map(habit => {
                            const isCompleted = habit.completions.includes(todayStr);
                            return (
                              <WidgetCheckRow
                                key={habit.id}
                                onPress={() => handleToggleHabitCompletion(habit.id)}
                                style={{ paddingVertical: 4 }}
                              >
                                <WidgetCheckCircle completed={isCompleted} color={habit.color} style={{ width: 12, height: 12, borderRadius: 6 }}>
                                  {isCompleted && <Check size={6} color="#08080A" strokeWidth={4} />}
                                </WidgetCheckCircle>
                                <WidgetCheckText completed={isCompleted} style={{ fontSize: 10, marginLeft: 6 }}>{habit.name}</WidgetCheckText>
                              </WidgetCheckRow>
                            );
                          })}
                        </WidgetChecklistContainer>
                      </MediumWidget>

                      <WidgetSizeLabel>Large (4x4)</WidgetSizeLabel>
                      <LargeWidget color="#FF7E47">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <Text style={{ color: '#FF7E47', fontSize: 11, fontWeight: '800' }}>Daily Habits</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Streak: 5🔥</Text>
                        </WidgetHeaderRow>
                        <WidgetChecklistContainer style={{ borderTopWidth: 0, paddingTop: 2, marginTop: 2 }}>
                          {habits.slice(0, 3).map(habit => {
                            const isCompleted = habit.completions.includes(todayStr);
                            return (
                              <WidgetCheckRow
                                key={habit.id}
                                onPress={() => handleToggleHabitCompletion(habit.id)}
                                style={{ paddingVertical: 4 }}
                              >
                                <WidgetCheckCircle completed={isCompleted} color={habit.color} style={{ width: 12, height: 12, borderRadius: 6 }}>
                                  {isCompleted && <Check size={6} color="#08080A" strokeWidth={4} />}
                                </WidgetCheckCircle>
                                <WidgetCheckText completed={isCompleted} style={{ fontSize: 10, marginLeft: 6 }}>{habit.name}</WidgetCheckText>
                              </WidgetCheckRow>
                            );
                          })}
                        </WidgetChecklistContainer>
                        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Weekly Completion</Text>
                          <View style={{ flexDirection: 'row' }}>
                            {['M','T','W','T','F','S','S'].map((day, idx) => (
                              <View key={idx} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: idx < 5 ? '#FF7E47' : 'rgba(255,255,255,0.1)', marginLeft: 3 }} />
                            ))}
                          </View>
                        </View>
                      </LargeWidget>
                    </>
                  )}

                  {/* Category: Timer */}
                  {activeWidgetType === 'timer' && (
                    <>
                      <WidgetSizeLabel>Small (2x2)</WidgetSizeLabel>
                      <SmallWidget color="#FFB347">
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Clock size={16} color="#FFB347" style={{ marginBottom: 4 }} />
                          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                            {formatTimer(timerTimeLeft)}
                          </Text>
                          <Text style={{ color: '#8E8E93', fontSize: 8, fontWeight: '700', textTransform: 'uppercase', marginTop: 1 }}>
                            {timerIsActive ? 'Focus' : 'Paused'}
                          </Text>
                        </View>
                      </SmallWidget>

                      <WidgetSizeLabel>Medium (4x2)</WidgetSizeLabel>
                      <MediumWidget color="#FFB347">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <Text style={{ color: '#FFB347', fontSize: 11, fontWeight: '800' }}>Focus Pomodoro</Text>
                          <Text style={{ fontSize: 8, fontWeight: '800', color: '#08080C', backgroundColor: '#FFB347', paddingVertical: 1, paddingHorizontal: 4, borderRadius: 4 }}>TIMER</Text>
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <View>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>{formatTimer(timerTimeLeft)}</Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, marginTop: 1 }}>Phase: Focus State</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={handleStartTimer}
                            style={{ backgroundColor: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 }}
                          >
                            <Text style={{ color: '#08080C', fontSize: 9, fontWeight: '800' }}>{timerIsActive ? 'PAUSE' : 'START'}</Text>
                          </TouchableOpacity>
                        </View>
                      </MediumWidget>

                      <WidgetSizeLabel>Large (4x4)</WidgetSizeLabel>
                      <LargeWidget color="#FFB347">
                        <WidgetHeaderRow style={{ marginBottom: 8 }}>
                          <Text style={{ color: '#FFB347', fontSize: 11, fontWeight: '800' }}>Pomodoro Sessions</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Cycle 2 of 4</Text>
                        </WidgetHeaderRow>
                        <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900' }}>{formatTimer(timerTimeLeft)}</Text>
                          <Text style={{ color: '#FFB347', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginTop: 2, letterSpacing: 1 }}>Deep Focus Phase</Text>
                        </View>
                        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 8, flexDirection: 'row', justifyContent: 'space-around' }}>
                          <TouchableOpacity onPress={handleStartTimer} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Play size={10} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{timerIsActive ? 'Pause' : 'Resume'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => dispatch(stopTimer())} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <RotateCcw size={10} color="#8E8E93" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#8E8E93', fontSize: 10, fontWeight: '700' }}>Reset</Text>
                          </TouchableOpacity>
                        </View>
                      </LargeWidget>
                    </>
                  )}

                  {/* Category: Stats */}
                  {activeWidgetType === 'stats' && (
                    <>
                      <WidgetSizeLabel>Small (2x2)</WidgetSizeLabel>
                      <SmallWidget color="#38EF7D">
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <BarChart2 size={16} color="#38EF7D" style={{ marginBottom: 4 }} />
                          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900' }}>
                            {Math.round(totalFocusSeconds / 60)}m
                          </Text>
                          <Text style={{ color: '#8E8E93', fontSize: 8, fontWeight: '700', marginTop: 1 }}>Tracked Today</Text>
                        </View>
                      </SmallWidget>

                      <WidgetSizeLabel>Medium (4x2)</WidgetSizeLabel>
                      <MediumWidget color="#38EF7D">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <Text style={{ color: '#38EF7D', fontSize: 11, fontWeight: '800' }}>Focus Analytics</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Today</Text>
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <View>
                            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '900' }}>{Math.round(totalFocusSeconds / 60)} mins</Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, marginTop: 1 }}>Sessions: {completedPomodorosCount}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 35 }}>
                            {[10, 20, 15, 30, 25].map((h, i) => (
                              <View key={i} style={{ width: 4, height: h, backgroundColor: '#38EF7D', borderRadius: 2, marginLeft: 4 }} />
                            ))}
                          </View>
                        </View>
                      </MediumWidget>

                      <WidgetSizeLabel>Large (4x4)</WidgetSizeLabel>
                      <LargeWidget color="#38EF7D">
                        <WidgetHeaderRow style={{ marginBottom: 8 }}>
                          <Text style={{ color: '#38EF7D', fontSize: 11, fontWeight: '800' }}>Weekly Focus Activity</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Total: {Math.round(totalFocusSeconds / 60)}m</Text>
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 75, paddingHorizontal: 10, marginVertical: 6 }}>
                          {[
                            { day: 'M', val: 30 },
                            { day: 'T', val: 50 },
                            { day: 'W', val: 40 },
                            { day: 'T', val: 80 },
                            { day: 'F', val: 65 },
                            { day: 'S', val: 20 },
                            { day: 'S', val: 10 },
                          ].map((item, idx) => (
                            <View key={idx} style={{ alignItems: 'center' }}>
                              <View style={{ width: 8, height: item.val, backgroundColor: '#38EF7D', borderRadius: 4 }} />
                              <Text style={{ color: '#8E8E93', fontSize: 8, marginTop: 4, fontWeight: '700' }}>{item.day}</Text>
                            </View>
                          ))}
                        </View>
                        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Avg Focus Score</Text>
                          <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>85% (High)</Text>
                        </View>
                      </LargeWidget>
                    </>
                  )}

                  {/* Category: Mind Waves */}
                  {activeWidgetType === 'soundscape' && (
                    <>
                      <WidgetSizeLabel>Small (2x2)</WidgetSizeLabel>
                      <SmallWidget color="#9B7EDE">
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Music size={16} color="#9B7EDE" style={{ marginBottom: 4 }} />
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800', textAlign: 'center' }} numberOfLines={1}>
                            {activeSoundscape.toUpperCase()}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => dispatch(togglePlayback())}
                            style={{ marginTop: 6, backgroundColor: 'rgba(155, 126, 222, 0.15)', padding: 4, borderRadius: 10 }}
                          >
                            {isPlaying ? <Pause size={10} color="#9B7EDE" /> : <Play size={10} color="#9B7EDE" fill="#9B7EDE" />}
                          </TouchableOpacity>
                        </View>
                      </SmallWidget>

                      <WidgetSizeLabel>Medium (4x2)</WidgetSizeLabel>
                      <MediumWidget color="#9B7EDE">
                        <WidgetHeaderRow style={{ marginBottom: 4 }}>
                          <Text style={{ color: '#9B7EDE', fontSize: 11, fontWeight: '800' }}>Mind Waves Player</Text>
                          <Music size={12} color="#9B7EDE" />
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
                              {activeSoundscape.toUpperCase()}
                            </Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, marginTop: 1 }}>Binaural Beats active</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => dispatch(togglePlayback())}
                            style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}
                          >
                            {isPlaying ? <Pause size={10} color="#08080C" /> : <Play size={10} color="#08080C" fill="#08080C" style={{ marginLeft: 2 }} />}
                          </TouchableOpacity>
                        </View>
                      </MediumWidget>

                      <WidgetSizeLabel>Large (4x4)</WidgetSizeLabel>
                      <LargeWidget color="#9B7EDE">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <Text style={{ color: '#9B7EDE', fontSize: 11, fontWeight: '800' }}>Mind Waves Controller</Text>
                          <Volume2 size={12} color="#9B7EDE" />
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
                          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(155, 126, 222, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                            <Music size={14} color="#9B7EDE" />
                          </View>
                          <View style={{ marginLeft: 10, flex: 1 }}>
                            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}>{activeSoundscape.toUpperCase()}</Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, marginTop: 1 }}>Binaural audio layer active</Text>
                          </View>
                        </View>
                        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 8, marginTop: 8, flexDirection: 'row', justifyContent: 'space-around' }}>
                          <TouchableOpacity onPress={() => dispatch(togglePlayback())} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isPlaying ? <Pause size={12} color="#FFFFFF" style={{ marginRight: 4 }} /> : <Play size={12} color="#FFFFFF" style={{ marginRight: 4 }} />}
                            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{isPlaying ? 'Pause' : 'Play'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => dispatch(setSoundscape('focus'))} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Compass size={12} color="#8E8E93" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#8E8E93', fontSize: 10, fontWeight: '700' }}>Focus Beat</Text>
                          </TouchableOpacity>
                        </View>
                      </LargeWidget>
                    </>
                  )}

                  {/* Category: Circadian */}
                  {activeWidgetType === 'circadian' && (
                    <>
                      <WidgetSizeLabel>Small (2x2)</WidgetSizeLabel>
                      <SmallWidget color="#E91E63">
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Activity size={16} color="#E91E63" style={{ marginBottom: 4 }} />
                          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', textAlign: 'center' }}>HIGH ALERT</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 8, fontWeight: '700', marginTop: 1 }}>Circadian Sync</Text>
                        </View>
                      </SmallWidget>

                      <WidgetSizeLabel>Medium (4x2)</WidgetSizeLabel>
                      <MediumWidget color="#E91E63">
                        <WidgetHeaderRow style={{ marginBottom: 6 }}>
                          <Text style={{ color: '#E91E63', fontSize: 11, fontWeight: '800' }}>Circadian Status</Text>
                          <Activity size={12} color="#E91E63" />
                        </WidgetHeaderRow>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                          <View>
                            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>Energy Peak</Text>
                            <Text style={{ color: '#8E8E93', fontSize: 9, marginTop: 1 }}>High Alertness Period active</Text>
                          </View>
                          <Text style={{ color: '#E91E63', fontSize: 9, fontWeight: '800' }}>SYNCED</Text>
                        </View>
                      </MediumWidget>

                      <WidgetSizeLabel>Large (4x4)</WidgetSizeLabel>
                      <LargeWidget color="#E91E63">
                        <WidgetHeaderRow style={{ marginBottom: 8 }}>
                          <Text style={{ color: '#E91E63', fontSize: 11, fontWeight: '800' }}>Circadian Cycles</Text>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Peak: 3:00 PM</Text>
                        </WidgetHeaderRow>
                        <View style={{ height: 50, justifyContent: 'center', marginVertical: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', justifyContent: 'space-around' }}>
                            {[10, 25, 45, 60, 45, 25, 10, 15, 30].map((h, i) => (
                              <View key={i} style={{ width: 6, height: h, backgroundColor: i === 3 ? '#E91E63' : 'rgba(233, 30, 99, 0.2)', borderRadius: 3 }} />
                            ))}
                          </View>
                        </View>
                        <View style={{ borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 6, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#8E8E93', fontSize: 9 }}>Next Dip (Slump)</Text>
                          <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>In 2h 15m (5:15 PM)</Text>
                        </View>
                      </LargeWidget>
                    </>
                  )}

                  <PhoneHintText>All widget actions sync with your companion energy and settings in real-time!</PhoneHintText>
                </ScrollView>
              </PhoneScreenContent>
            </PhoneShell>

            <InstallButton onPress={() => setShowWidgetSimulator(false)}>
              <InstallButtonText>Done Testing</InstallButtonText>
            </InstallButton>
          </SimulatorCard>
        </SimulatorOverlay>
      </Modal>
      {confettiParticles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            top: p.y,
            left: p.x,
            width: 8,
            height: 8,
            backgroundColor: p.color,
            transform: [{ rotate: p.rotate }, { scale: p.scale }],
            zIndex: 9999,
          }}
        />
      ))}
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: transparent;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
`;

const LogoArea = styled.View`
  flex-direction: row;
  align-items: center;
`;

const LogoIconGlow = styled.View`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: #111116;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: #1E1E26;
`;

const LogoText = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-left: 8px;
`;

const HeaderActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

const PaywallBadge = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: #FF7E47;
  border-radius: 20px;
  padding: 4px 10px;
  background-color: rgba(255, 126, 71, 0.1);
  margin-right: 10px;
`;

const BadgeText = styled.Text`
  color: #FF7E47;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
`;

const ActionButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #111116;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: #1E1E26;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const SectionTitleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 10px;
  margin-bottom: 12px;
`;

const SectionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
  margin-top: 14px;
  margin-bottom: 8px;
`;

const SectionInfoText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 500;
`;

const ShowAllLink = styled.Text`
  color: #FF7E47;
  font-size: 13px;
  font-weight: 600;
`;

// Radial Pomodoro styling (Fintech Expenses ring)
const TimerDialCard = styled(GlassCard)`
  padding: 20px;
  margin-bottom: 16px;
`;

const DialRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SvgContainer = styled.View`
  position: relative;
  width: 144px;
  height: 144px;
  justify-content: center;
  align-items: center;
`;

const DialOverlayCenter = styled.View`
  position: absolute;
  justify-content: center;
  align-items: center;
  width: 100px;
  height: 100px;
`;

const DialCenterPercent = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 800;
`;

const DialCenterSubtext = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 2px;
`;

const DialControlsSection = styled.View`
  flex: 1;
  margin-left: 20px;
`;

const DialLabelText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
`;

const DialDescText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
  margin-bottom: 12px;
`;

const PresetSelectionRow = styled.View`
  flex-direction: row;
  margin-bottom: 14px;
`;

const PresetPill = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(0, 242, 254, 0.15)' : '#1A1A22'};
  border-width: 1px;
  border-color: ${props => props.active ? '#00F2FE' : '#1E1E26'};
  border-radius: 12px;
  padding: 6px 12px;
  margin-right: 6px;
`;

const PresetPillText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#00F2FE' : '#B8B0D0'};
  font-size: 11px;
  font-weight: bold;
`;

const ActionButtonsRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const OrangeGradientButton = styled.TouchableOpacity`
  background-color: #FF7E47;
  padding: 10px 20px;
  border-radius: 12px;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`;

const OrangeButtonText = styled.Text`
  color: #08080A;
  font-size: 13px;
  font-weight: bold;
`;

const CancelButton = styled.TouchableOpacity`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background-color: #1A1A22;
  border-width: 1px;
  border-color: #1E1E26;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`;

// HabitKit Activity Board card
const HabitKitGridCard = styled(GlassCard)`
  padding: 16px;
  margin-bottom: 20px;
`;

const GridCardHeader = styled.View`
  margin-bottom: 12px;
`;

const GridCardTitle = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
`;

const GridCardDesc = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
`;

// ADHD Simulated lock/homescreen widgets
const WidgetsHorizontalCarousel = styled.ScrollView`
  flex-direction: row;
  margin-bottom: 20px;
  padding: 4px 0;
`;

const WidgetMockCard = styled(GlassCard)`
  width: 130px;
  height: 140px;
  padding: 12px;
  margin-right: 12px;
  align-items: center;
  justify-content: space-between;
`;

const WidgetTitleRow = styled.View`
  width: 100%;
  align-items: flex-start;
`;

const WidgetPill = styled.Text`
  color: #6B6280;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.5px;
`;

const WidgetDialCenter = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
`;

const WidgetDialText = styled.Text`
  position: absolute;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: bold;
`;

const WidgetHabitsList = styled.View`
  width: 100%;
  justify-content: center;
  margin-vertical: 8px;
`;

const WidgetHabitRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const CheckWrapper = styled.View<{ completed: boolean; color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border-width: 1px;
  border-color: ${props => props.completed ? props.color : '#6B6280'};
  background-color: ${props => props.completed ? props.color : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-right: 6px;
`;

const WidgetHabitName = styled.Text<{ completed: boolean }>`
  color: ${props => props.completed ? '#FFFFFF' : '#6B6280'};
  font-size: 9px;
  font-weight: 500;
`;

const WidgetEnergyStatusColor = styled.View<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-vertical: 6px;
`;

const WidgetEnergyLabel = styled.Text`
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 600;
  text-align: center;
`;

const WidgetNameText = styled.Text`
  color: #B8B0D0;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  margin-top: 4px;
`;

// Micro  Habits & Goals checkoff layout
const HabitsRow = styled.View`
  margin-bottom: 20px;
`;

const HabitCheckRow = styled(GlassCard) <{ completed: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 8px;
  border-color: ${props => props.completed ? '#FF7E47' : '#1E1E26'};
  background-color: ${props => props.completed ? 'rgba(255, 126, 71, 0.05)' : 'rgba(18, 18, 23, 0.85)'};
`;

const HabitPressableArea = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const CheckCircle = styled.View<{ completed: boolean; color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border-width: 1.5px;
  border-color: ${props => props.completed ? '#FF7E47' : '#6B6280'};
  background-color: ${props => props.completed ? '#FF7E47' : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const HabitTextInfo = styled.View``;

const HabitName = styled.Text<{ completed: boolean }>`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
  text-decoration-line: none;
  opacity: ${props => props.completed ? 0.6 : 1.0};
`;

const HabitUnit = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 1px;
`;

const HabitStreak = styled.Text`
  color: #FF7E47;
  font-size: 12px;
  font-weight: bold;
`;

const ExtraSpacing = styled.View`
  height: 120px;
`;

// Focus Performance Stats styles
const FocusStatsWidgetCard = styled(GlassCard)`
  padding: 16px;
  margin-bottom: 20px;
`;

const WidgetStatsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const WidgetStatBox = styled.View`
  flex: 1;
  align-items: center;
`;

const WidgetStatLabel = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
`;

const WidgetStatValue = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 800;
  margin-top: 4px;
`;

const WidgetStatsSubtext = styled.Text`
  color: #6B6280;
  font-size: 10px;
  text-align: center;
  margin-top: 4px;
`;

// Phone simulation frame
const PhoneShell = styled.View`
  flex: 1;
  border-width: 8px;
  border-color: #1A1A22;
  border-radius: 40px;
  background-color: #0E0E14;
  overflow: hidden;
  position: relative;
`;

const PhoneNotch = styled.View`
  position: absolute;
  top: 0;
  left: 30%;
  right: 30%;
  height: 20px;
  background-color: #1A1A22;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  z-index: 100;
`;

const PhoneStatusBar = styled.View`
  height: 36px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background-color: transparent;
  z-index: 10;
  margin-top: 10px;
`;

const StatusTimeText = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: bold;
`;

const StatusIconsArea = styled.View`
  flex-direction: row;
  align-items: center;
`;

const PhoneScreenContent = styled.View`
  flex: 1;
  background-color: #0A0A0E;
`;

const PhoneHintText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  margin-top: 20px;
  line-height: 16px;
  padding: 0 16px;
`;

const WidgetContainer = styled(GlassCard)<{ color: string }>`
  background-color: rgba(14, 14, 18, 0.95);
  border-width: 1.2px;
  border-color: ${props => props.color};
  padding: 10px;
  margin-bottom: 12px;
  align-self: center;
  overflow: hidden;
`;

const SmallWidget = styled(WidgetContainer)`
  width: 110px;
  height: 110px;
`;

const MediumWidget = styled(WidgetContainer)`
  width: 220px;
  height: 110px;
`;

const LargeWidget = styled(WidgetContainer)`
  width: 220px;
  height: 200px;
`;

const WidgetSizeLabel = styled.Text`
  color: rgba(255, 255, 255, 0.45);
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 6px;
  margin-top: 4px;
  text-align: center;
`;

// Live widget box mockup
const LiveWidgetBox = styled(GlassCard) <{ color: string }>`
  width: 100%;
  padding: 16px;
  background-color: rgba(14, 14, 18, 0.95);
  border-color: ${props => props.color};
  border-width: 1.5px;
`;

const WidgetHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const WidgetIconGlow = styled.View`
  width: 26px;
  height: 26px;
  border-radius: 13px;
  justify-content: center;
  align-items: center;
`;

const WidgetContentBody = styled.View`
  flex-direction: row;
  align-items: center;
  padding-bottom: 10px;
`;

const WidgetCompanionImage = styled.Image`
  width: 56px;
  height: 56px;
  border-radius: 10px;
`;

const WidgetTextTitle = styled.Text`
  font-size: 15px;
  font-weight: 800;
`;

const WidgetTextSub = styled.Text`
  color: #8E8E93;
  font-size: 12px;
  font-weight: 600;
  margin-top: 2px;
`;

const WidgetProgressTrack = styled.View`
  height: 4px;
  background-color: rgba(255,255,255,0.06);
  border-radius: 2px;
  width: 100%;
  margin-top: 6px;
`;

const WidgetProgressFill = styled.View`
  height: 100%;
  border-radius: 2px;
`;

const WidgetInteractiveFooter = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 4px;
`;

const WidgetButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #FFFFFF;
  padding: 6px 12px;
  border-radius: 12px;
`;

const WidgetButtonText = styled.Text`
  color: #08080C;
  font-size: 9px;
  font-weight: 800;
`;

// Checklist inside widget
const WidgetChecklistContainer = styled.View`
  margin-top: 10px;
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.05);
  padding-top: 10px;
  width: 100%;
`;

const WidgetCheckRow = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  padding: 6px 0;
  width: 100%;
`;

const WidgetCheckCircle = styled.View<{ completed: boolean; color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 7px;
  border-width: 1.2px;
  border-color: ${props => props.completed ? props.color : '#6B6280'};
  background-color: ${props => props.completed ? props.color : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-right: 10px;
`;

const WidgetCheckText = styled.Text<{ completed: boolean }>`
  color: ${props => props.completed ? '#8E8E93' : '#FFFFFF'};
  font-size: 11px;
  font-weight: 600;
  text-decoration: ${props => props.completed ? 'line-through' : 'none'};
`;

const InstallButton = styled.TouchableOpacity`
  background-color: #FF7E47;
  padding: 14px 0;
  border-radius: 16px;
  align-items: center;
  margin-top: 18px;
`;

const InstallButtonText = styled.Text`
  color: #08080C;
  font-size: 14px;
  font-weight: bold;
`;



