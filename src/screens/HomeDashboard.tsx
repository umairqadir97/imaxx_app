import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Compass, Gift, User, Plus, Lock, Play, Pause, X, Star, Sparkles, Check, ChevronRight, Grid, Calendar, Clock, Settings as SettingsIcon } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../store';
import { setSoundscape, startTimer, togglePlayback, stopTimer } from '../store/audioSlice';
import { toggleHabitCompletion } from '../store/habitSlice';
import { GlassCard } from '../components/GlassCard';
import { HabitGrid } from '../components/HabitGrid';
import { theme } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HomeDashboardProps {
  onOpenPlayer: () => void;
  onOpenTimer: () => void;
  onOpenPaywall: () => void;
  onNavigateToTab: (tabName: string) => void;
  onOpenSettings: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onOpenPlayer,
  onOpenTimer,
  onOpenPaywall,
  onNavigateToTab,
  onOpenSettings,
}) => {
  const dispatch = useAppDispatch();

  // Redux store states
  const habits = useAppSelector((state) => state.habits.habits);
  const { isPlaying, timerIsActive, timerTimeLeft, timerDuration, activeSoundscape, completedPomodorosCount, totalFocusSeconds } = useAppSelector((state) => state.audio);

  const [selectedDuration, setSelectedDuration] = useState(1500); // Default 25 min

  // Merge completions from all habits to show a combined HabitKit activity board
  const getMergedCompletions = () => {
    const allCompletions = new Set<string>();
    habits.forEach(habit => {
      habit.completions.forEach(c => allCompletions.add(c));
    });
    return Array.from(allCompletions);
  };

  const mergedCompletions = getMergedCompletions();
  const todayStr = new Date().toISOString().split('T')[0];

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
    if (timerIsActive) {
      dispatch(togglePlayback());
    } else {
      dispatch(startTimer(selectedDuration));
    }
  };

  const handleCancelTimer = () => {
    dispatch(stopTimer());
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
            <Star size={10} color="#FF7E47" fill="#FF7E47" style={{ marginRight: 4 }} />
            <BadgeText>PRO</BadgeText>
          </PaywallBadge>
          <ActionButton onPress={() => onNavigateToTab('profile')}>
            <User size={18} color="#FFFFFF" />
          </ActionButton>
        </HeaderActions>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false}>

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

        {/* Unified HabitKit Contributions Board (from HabitKit) */}
        <SectionTitleRow>
          <SectionTitle>Consistency Counter</SectionTitle>
          <ShowAllLink onPress={() => onNavigateToTab('habits')}>Manage Garden →</ShowAllLink>
        </SectionTitleRow>

        <HabitKitGridCard>
          <GridCardHeader>
            <GridCardTitle>Habits Practice Board</GridCardTitle>
            <GridCardDesc>Overall consistency across last 13 weeks</GridCardDesc>
          </GridCardHeader>
          <HabitGrid completions={mergedCompletions} color="#FF7E47" />
        </HabitKitGridCard>

        {/* ADHD Homescreen & Lockscreen Widgets Section */}
        <SectionTitleRow>
          <SectionTitle>Interactive Widgets</SectionTitle>
          <SectionInfoText>Tap to preview on lockscreen</SectionInfoText>
        </SectionTitleRow>

        <WidgetsHorizontalCarousel horizontal showsHorizontalScrollIndicator={false}>
          {/* Widget 1: Pomodoro Lockscreen circle */}
          <WidgetMockCard onPress={onOpenPlayer}>
            <WidgetTitleRow>
              <WidgetPill>LOCKSCREEN</WidgetPill>
            </WidgetTitleRow>
            <WidgetDialCenter>
              <Svg width={40} height={40}>
                <Circle cx={20} cy={20} r={16} stroke="#1E1E26" strokeWidth={3} fill="none" />
                <Circle cx={20} cy={20} r={16} stroke="#00F2FE" strokeWidth={3} strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * 0.4} fill="none" />
              </Svg>
              <WidgetDialText>15m</WidgetDialText>
            </WidgetDialCenter>
            <WidgetNameText>Focus Progress</WidgetNameText>
          </WidgetMockCard>

          {/* Widget 2: Micro-habit checker */}
          <WidgetMockCard onPress={() => onNavigateToTab('habits')}>
            <WidgetTitleRow>
              <WidgetPill>HOMESCREEN</WidgetPill>
            </WidgetTitleRow>
            <WidgetHabitsList>
              <WidgetHabitRow>
                <CheckWrapper completed={true} color="#FF7E47">
                  <Check size={10} color="#08080A" strokeWidth={3} />
                </CheckWrapper>
                <WidgetHabitName completed={true}>Mindfulness</WidgetHabitName>
              </WidgetHabitRow>
              <WidgetHabitRow style={{ marginTop: 6 }}>
                <CheckWrapper completed={false} color="#00F2FE" />
                <WidgetHabitName completed={false}>Drink Water</WidgetHabitName>
              </WidgetHabitRow>
            </WidgetHabitsList>
            <WidgetNameText>Focus Checklist</WidgetNameText>
          </WidgetMockCard>

          {/* Widget 3: Circadian Indicator */}
          <WidgetMockCard onPress={() => onNavigateToTab('profile')}>
            <WidgetTitleRow>
              <WidgetPill>DYNAMIC STATUS</WidgetPill>
            </WidgetTitleRow>
            <WidgetEnergyStatusColor color="#FFB347">
              <Clock size={16} color="#08080A" />
            </WidgetEnergyStatusColor>
            <WidgetEnergyLabel>High Peak Energy</WidgetEnergyLabel>
            <WidgetNameText>Circadian Sync</WidgetNameText>
          </WidgetMockCard>
        </WidgetsHorizontalCarousel>

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
              <WidgetStatValue>6h 12m</WidgetStatValue>
            </WidgetStatBox>
          </WidgetStatsRow>
          <WidgetStatsSubtext>🔥 Active focus sessions sync in real-time.</WidgetStatsSubtext>
        </FocusStatsWidgetCard>

        {/* Quick Micro-Habits Checker */}
        <SectionTitleRow>
          <SectionTitle>Micro Habits & Goals</SectionTitle>
        </SectionTitleRow>

        <HabitsRow>
          {habits.map(habit => {
            const isCompletedToday = habit.completions.includes(todayStr);
            return (
              <HabitCheckRow key={habit.id} completed={isCompletedToday}>
                <HabitPressableArea onPress={() => dispatch(toggleHabitCompletion({ habitId: habit.id, date: todayStr }))}>
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
          })}
        </HabitsRow>

        <ExtraSpacing />
      </ScrollContent>
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

