import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, TouchableOpacity, View, Text, TextInput, Modal, ActivityIndicator, Dimensions, Animated, Switch, PanResponder, Platform } from 'react-native';
import styled from 'styled-components/native';
import { Calendar, MoreHorizontal, Bell, Moon, Sun, Play, Pause, ChevronRight, ChevronLeft, HelpCircle, X, Check, Activity, Sparkles, AlertCircle, Smartphone, Volume2, ShieldAlert } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppDispatch, useAppSelector } from '../store';
import { setSoundscape, togglePlayback } from '../store/audioSlice';
import Reanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Accelerometer } from 'expo-sensors';

interface AlarmItem {
  id: string;
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
  type: 'daily' | 'once';
  shakeDuration: number;
  isEnabled: boolean;
  isSmart: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Register notification handler for background notifications on mobile
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldVibrate: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    console.log('Notifications setup error (native module not linked yet):', err);
  }
}

// -------------------------------------------------------------
// Styled components declared at the top to prevent TDZ ReferenceErrors
// -------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: #08080A;
`;

const AbsoluteCanvas = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 0;
`;

const GlowOrb1 = styled.View`
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 130px;
  background-color: #FF7E47;
  opacity: 0.05;
  top: 150px;
  right: -60px;
  shadow-color: #FF7E47;
  shadow-opacity: 0.8;
  shadow-radius: 100px;
  elevation: 20;
`;

const GlowOrb2 = styled.View`
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 150px;
  background-color: #9B7EDE;
  opacity: 0.04;
  bottom: 120px;
  left: -80px;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.8;
  shadow-radius: 100px;
  elevation: 20;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 14px 20px;
  background-color: rgba(15, 15, 20, 0.7);
  border-bottom-width: 0.8px;
  border-bottom-color: rgba(255, 255, 255, 0.08);
  z-index: 10;
`;

const HeaderIconBox = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.04);
  justify-content: center;
  align-items: center;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const HeaderDateText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.2px;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 16px;
  z-index: 5;
`;

const SleepAidPillRow = styled.View`
  align-items: center;
  margin-top: 10px;
  margin-bottom: 24px;
`;

const SleepAidPill = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.12);
  padding: 10px 18px;
  border-radius: 20px;
  shadow-color: #000;
  shadow-opacity: 0.2;
  shadow-radius: 6px;
`;

const SleepAidPillText = styled.Text`
  color: #E6E6FA;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  margin-right: 8px;
`;

const SleepAidPillPlay = styled.TouchableOpacity`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  justify-content: center;
  align-items: center;
`;

const ControlCard = styled.View`
  background-color: rgba(255, 255, 255, 0.035);
  border-radius: 28px;
  padding: 24px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.09);
  align-items: center;
  margin-bottom: 24px;
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 10px;
`;

const CardHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
`;

const CardHeaderTitle = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const SmartTimePickerContainer = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 140px;
  margin-bottom: 20px;
`;

const PickerCol = styled.View`
  align-items: center;
  width: 60px;
`;

const PickerArrow = styled.TouchableOpacity`
  padding: 10px;
`;

const PickerDigit = styled.Text`
  color: rgba(255, 255, 255, 0.2);
  font-size: 16px;
  font-weight: 500;
`;

const PickerActiveDigitBox = styled.View`
  background-color: rgba(255, 255, 255, 0.06);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 6px 14px;
  margin-vertical: 4px;
  justify-content: center;
  align-items: center;
  min-width: 52px;
`;

const PickerActiveDigit = styled.Text`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 700;
`;

const PickerActiveInput = styled.TextInput`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  padding: 0;
  min-width: 36px;
`;

const ColonText = styled.Text`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: bold;
  margin-horizontal: 8px;
  margin-bottom: 4px;
`;

const InfoTextLine1 = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  margin-top: 10px;
`;

const InfoTextLine2 = styled.Text`
  color: #8E8E93;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  margin-top: 6px;
`;

const MainStartButton = styled.TouchableOpacity`
  background-color: #FFFFFF;
  padding-horizontal: 52px;
  padding-vertical: 14px;
  border-radius: 24px;
  margin-top: 24px;
  shadow-color: #FFFFFF;
  shadow-opacity: 0.15;
  shadow-radius: 12px;
`;

const MainStartButtonText = styled.Text`
  color: #08080C;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const PaginationDots = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const Dot = styled.TouchableOpacity<{ active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${props => props.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)'};
  margin-horizontal: 4px;
`;

const SectionTitle = styled.Text`
  color: #8E8E93;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.5px;
  margin-bottom: 12px;
  margin-top: 16px;
  text-transform: uppercase;
`;

const SettingsCard = styled.View`
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 24px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.09);
  padding: 6px 16px;
  margin-bottom: 24px;
`;

const SettingsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 14px;
  border-bottom-width: 0.8px;
  border-bottom-color: rgba(255, 255, 255, 0.05);
`;

const SettingsRowLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const SettingsIconBox = styled.View<{ color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: ${props => props.color + '15'};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const SettingsTextGroup = styled.View`
  flex: 1;
  padding-right: 8px;
`;

const SettingsLabel = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 500;
`;

const SettingsSub = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  margin-top: 2px;
`;

const ModeBadge = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: bold;
  margin-horizontal: 6px;
`;

const ExtraSpacing = styled.View`
  height: 100px;
`;

// -------------------------------------------------------------
// Sleep Goals & Weekly Insights (Sleep Cycle Style)
// -------------------------------------------------------------
const InsightsCard = styled.View`
  background-color: rgba(255, 255, 255, 0.035);
  border-radius: 28px;
  padding: 20px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.09);
  margin-bottom: 24px;
`;

const InsightsHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const InsightsMainVal = styled.Text`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 700;
`;

const InsightsSub = styled.Text`
  color: #8E8E93;
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
`;

const DayBarChart = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  height: 90px;
  padding-horizontal: 8px;
  margin-bottom: 24px;
  border-bottom-width: 0.8px;
  border-bottom-color: rgba(255, 255, 255, 0.05);
  padding-bottom: 8px;
`;

const BarCol = styled.View`
  align-items: center;
  flex: 1;
`;

const BarTrack = styled.View`
  width: 14px;
  height: 60px;
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 7px;
  overflow: hidden;
  justify-content: flex-end;
`;

const BarFill = styled.View<{ height: number; active: boolean }>`
  width: 100%;
  height: ${props => props.height}%;
  background-color: ${props => props.active ? '#4ECDC4' : '#FF7E47'};
  border-radius: 7px;
`;

const BarLabel = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: 600;
  margin-top: 6px;
`;

const GridRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const GridCol = styled.View`
  flex: 1;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 12px 6px;
  margin-horizontal: 4px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.04);
`;

const GridLabel = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GridValue = styled.Text<{ color: string }>`
  color: ${props => props.color};
  font-size: 16px;
  font-weight: 700;
  margin-top: 6px;
`;

const GridSub = styled.Text`
  color: #6B6280;
  font-size: 9px;
  margin-top: 2px;
`;

// -------------------------------------------------------------
// Interactive Full-Screen Overlays (Tracking and Alarm triggers)
// -------------------------------------------------------------
const FullscreenOverlayContainer = styled.View`
  flex: 1;
  background-color: #08080A;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 60px;
  padding-horizontal: 24px;
`;

const TrackingTimeText = styled.Text`
  color: #FFFFFF;
  font-size: 72px;
  font-weight: 300;
  letter-spacing: -2px;
  margin-top: 40px;
`;

const TrackingSubText = styled.Text`
  color: #8E8E93;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: 8px;
`;

const StarsGlowMoon = styled.View`
  align-items: center;
  justify-content: center;
  margin-vertical: 30px;
`;

const MoonGlowCircle = styled.View`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background-color: rgba(255, 255, 255, 0.02);
  justify-content: center;
  align-items: center;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const SlideStopContainer = styled.View`
  width: 100%;
  align-items: center;
  margin-bottom: 20px;
`;

const SlideStopTrack = styled.View`
  width: 220px;
  height: 54px;
  border-radius: 27px;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const SlideStopHandle = styled(Animated.View)`
  width: 46px;
  height: 46px;
  border-radius: 23px;
  background-color: #FFFFFF;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 4px;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
`;

const SlideStopText = styled.Text`
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  align-self: center;
  text-transform: uppercase;
`;

// Alarm Flashing Trigger Container
const AlarmFlashContainer = styled.View<{ activeColor: string }>`
  flex: 1;
  background-color: #08080A;
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const ShakeBox = styled.View`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 28px;
  padding: 32px 24px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.1);
  align-items: center;
  shadow-color: #000;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
`;

const ShakeTitle = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 12px;
`;

const ShakeTimeText = styled.Text`
  color: #FFFFFF;
  font-size: 58px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const ShakeCountText = styled.Text`
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const ShakeProgressBg = styled.View`
  width: 100%;
  height: 6px;
  background-color: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
  margin-vertical: 20px;
`;

const ShakeProgressFill = styled.View<{ percent: number }>`
  width: ${props => props.percent}%;
  height: 100%;
  background-color: #FF7E47;
  border-radius: 3px;
`;

const ShakeInstruction = styled.Text`
  color: #8E8E93;
  font-size: 12px;
  text-align: center;
  line-height: 18px;
  margin-bottom: 24px;
`;

const SimulateButton = styled.TouchableOpacity`
  background-color: #FFFFFF;
  padding-horizontal: 32px;
  padding-vertical: 12px;
  border-radius: 20px;
  align-items: center;
  width: 100%;
`;

const SimulateButtonText = styled.Text`
  color: #08080C;
  font-size: 13px;
  font-weight: 700;
`;

// Helper component for Star animations
const TwinklingStar: React.FC<{ size: number; x: number; y: number }> = ({ size, x, y }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500 + Math.random() * 1500 }),
        withTiming(0.2, { duration: 1500 + Math.random() * 1500 })
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

// -------------------------------------------------------------
// Calendar Modal Styled Components
// -------------------------------------------------------------
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(8, 8, 10, 0.96);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const CalendarModalCard = styled.View`
  width: 100%;
  max-width: 360px;
  background-color: rgba(25, 25, 30, 0.85);
  border-radius: 28px;
  padding: 22px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.12);
  shadow-color: #000;
  shadow-opacity: 0.5;
  shadow-radius: 16px;
`;

const ModalHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const MonthSelectorRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 6px 12px;
`;

const MonthLabel = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
`;

const MonthNavBtn = styled.TouchableOpacity`
  padding: 6px;
`;

const CalendarGrid = styled.View`
  width: 100%;
`;

const WeekdayRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 8px;
`;

const WeekdayLabel = styled.Text`
  color: rgba(255, 255, 255, 0.3);
  font-size: 10px;
  font-weight: bold;
  width: 36px;
  text-align: center;
`;

const DaysGridRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

const CalendarDayCell = styled.TouchableOpacity`
  width: 44px;
  height: 48px;
  justify-content: center;
  align-items: center;
  margin-vertical: 2px;
`;

const CalendarDayLabelContainer = styled.View<{ hasLog: boolean; isSelected: boolean; isToday: boolean }>`
  width: 38px;
  height: 42px;
  border-radius: 8px;
  justify-content: center;
  align-items: center;
  background-color: ${props =>
    props.isSelected
      ? '#FF7E47'
      : props.hasLog
        ? 'rgba(78, 205, 196, 0.18)'
        : 'transparent'};
  border-width: 0.8px;
  border-color: ${props =>
    props.isSelected
      ? '#FF7E47'
      : props.isToday
        ? '#FF7E47'
        : 'transparent'};
`;

const CalendarDayNumberText = styled.Text<{ isSelected: boolean; hasLog: boolean }>`
  color: ${props =>
    props.isSelected
      ? '#08080C'
      : props.hasLog
        ? '#4ECDC4'
        : '#FFFFFF'};
  font-size: 13px;
  font-weight: 600;
`;

const CalendarDayHoursText = styled.Text<{ isSelected: boolean }>`
  color: ${props => props.isSelected ? '#08080C' : '#8E8E93'};
  font-size: 8px;
  font-weight: bold;
  margin-top: 1px;
`;

const DetailPanel = styled.View`
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  padding: 14px;
  margin-top: 14px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.06);
`;

const DetailDateText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const DetailDataRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-vertical: 3px;
`;

const DetailLabel = styled.Text`
  color: #8E8E93;
  font-size: 11px;
`;

const DetailValue = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
`;

const CloseModalBtn = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.08);
  padding: 12px;
  border-radius: 16px;
  align-items: center;
  margin-top: 14px;
`;

const CloseModalBtnText = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: bold;
`;

const AddLogBtn = styled.TouchableOpacity`
  background-color: #4ECDC4;
  padding: 10px;
  border-radius: 12px;
  align-items: center;
  margin-top: 10px;
`;

const AddLogBtnText = styled.Text`
  color: #08080C;
  font-size: 11px;
  font-weight: bold;
`;

// -------------------------------------------------------------
// Component Props and implementation
// -------------------------------------------------------------
interface SleepDashboardProps {
  onOpenPlayer: () => void;
  onOpenPaywall: () => void;
  onOpenScenarios: () => void;
}

export const SleepDashboard: React.FC<SleepDashboardProps> = ({
  onOpenPlayer,
  onOpenPaywall,
  onOpenScenarios
}) => {
  const dispatch = useAppDispatch();
  const { isPlaying, activeSoundscape } = useAppSelector((state) => state.audio);

  // Time picker states
  const [alarmHour, setAlarmHour] = useState(7);
  const [alarmMinute, setAlarmMinute] = useState(30);
  const [alarmPeriod, setAlarmPeriod] = useState<'AM' | 'PM'>('AM');

  // Sleepy tab mode index: 0 = No alarm, 1 = Fixed Alarm, 2 = Smart Alarm
  const [activeModeIdx, setActiveModeIdx] = useState(2);

  // Settings
  const [forcedWakeup, setForcedWakeup] = useState(true);
  const [shakeDuration, setShakeDuration] = useState(30); // Adjustable via + / -
  const [microphoneLogging, setMicrophoneLogging] = useState(false);
  const [windowSize, setWindowSize] = useState(30); // Adjustable via + / -

  // Persistent Sleep Logs (Calender view & history)
  const [sleepCalendarLogs, setSleepCalendarLogs] = useState<Record<string, any>>({});

  // Calendar Modal States
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);

  // Simulation states
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false);

  // Current live clock in full-screen tracking
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Shake mission progress
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [shakeCount, setShakeCount] = useState(0);

  // Slide to stop swipe position animated reference
  const slideX = useRef(new Animated.Value(0)).current;
  const startTimeRef = useRef<number | null>(null);

  // Alarms List State
  const [alarmsList, setAlarmsList] = useState<AlarmItem[]>([
    { id: '1', hour: 7, minute: 30, period: 'AM', type: 'daily', shakeDuration: 30, isEnabled: true, isSmart: true },
    { id: '2', hour: 8, minute: 45, period: 'AM', type: 'once', shakeDuration: 15, isEnabled: false, isSmart: false }
  ]);

  // Snooze States
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [snoozedTime, setSnoozedTime] = useState<Date | null>(null);

  // Edit Alarm Modal States
  const [showEditAlarmModal, setShowEditAlarmModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);
  const [editHour, setEditHour] = useState(7);
  const [editMinute, setEditMinute] = useState(30);
  const [editPeriod, setEditPeriod] = useState<'AM' | 'PM'>('AM');
  const [editType, setEditType] = useState<'daily' | 'once'>('daily');
  const [editShakeDuration, setEditShakeDuration] = useState(30);
  const [editIsSmart, setEditIsSmart] = useState(true);

  // Manual string typing states for pickers
  const [hourInputStr, setHourInputStr] = useState('7');
  const [minuteInputStr, setMinuteInputStr] = useState('30');
  const [editHourInputStr, setEditHourInputStr] = useState('7');
  const [editMinuteInputStr, setEditMinuteInputStr] = useState('30');

  // Initialize picker inputs on mount
  useEffect(() => {
    setHourInputStr(alarmHour.toString());
    setMinuteInputStr(alarmMinute < 10 ? `0${alarmMinute}` : alarmMinute.toString());
  }, []);

  const scheduleNextAlarmNotification = async (list: AlarmItem[]) => {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const soonest = getSoonestAlarm(list);
      if (soonest) {
        console.log(`[AlarmEngine] Scheduling background notification in ${soonest.triggerSeconds} seconds (Alarm ID: ${soonest.alarm.id}).`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: soonest.alarm.isSmart ? '🌅 Smart Cycle Wakeup' : '🔔 Fixed Alarm',
            body: 'Open Dopamind to complete the Forced Shake challenge and conquer your day!',
            sound: true,
            vibrate: [0, 500, 200, 500],
            data: { alarmId: soonest.alarm.id }
          } as any,
          trigger: {
            seconds: soonest.triggerSeconds,
            type: 'timeInterval',
          } as any,
        });
      }
    } catch (err) {
      console.log('Error scheduling local notification:', err);
    }
  };

  // Load custom alarms from AsyncStorage on mount
  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const stored = await AsyncStorage.getItem('iMaxx_user_alarms');
        if (stored) {
          const parsed = JSON.parse(stored);
          setAlarmsList(parsed);
          scheduleNextAlarmNotification(parsed);
        } else {
          scheduleNextAlarmNotification(alarmsList);
        }
      } catch (e) {
        console.log('Error loading alarms:', e);
      }
    };
    loadAlarms();
  }, []);

  const saveAlarms = async (list: AlarmItem[]) => {
    try {
      await AsyncStorage.setItem('iMaxx_user_alarms', JSON.stringify(list));
      scheduleNextAlarmNotification(list);
    } catch (e) {
      console.log('Error saving alarms:', e);
    }
  };

  const getSoonestAlarm = (list: AlarmItem[]): { alarm: AlarmItem; triggerSeconds: number } | null => {
    const enabledAlarms = list.filter(a => a.isEnabled);
    if (enabledAlarms.length === 0) return null;

    let soonestAlarm: AlarmItem | null = null;
    let soonestDiffMs = Infinity;
    const now = new Date();

    enabledAlarms.forEach(alarm => {
      const target = new Date();
      let targetHour = alarm.hour;
      if (alarm.period === 'PM' && alarm.hour !== 12) targetHour += 12;
      if (alarm.period === 'AM' && alarm.hour === 12) targetHour = 0;

      target.setHours(targetHour, alarm.minute, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      if (diff < soonestDiffMs) {
        soonestDiffMs = diff;
        soonestAlarm = alarm;
      }
    });

    return soonestAlarm ? { alarm: soonestAlarm, triggerSeconds: Math.max(1, Math.floor(soonestDiffMs / 1000)) } : null;
  };

  const handleOpenEdit = (alarm: AlarmItem) => {
    setEditingAlarm(alarm);
    setEditHour(alarm.hour);
    setEditMinute(alarm.minute);
    setEditPeriod(alarm.period);
    setEditType(alarm.type);
    setEditShakeDuration(alarm.shakeDuration);
    setEditIsSmart(alarm.isSmart);
    setEditHourInputStr(alarm.hour.toString());
    setEditMinuteInputStr(alarm.minute < 10 ? `0${alarm.minute}` : alarm.minute.toString());
    setShowEditAlarmModal(true);
  };

  const handleOpenAdd = () => {
    setEditingAlarm(null);
    setEditHour(7);
    setEditMinute(30);
    setEditPeriod('AM');
    setEditType('daily');
    setEditShakeDuration(30);
    setEditIsSmart(true);
    setEditHourInputStr('7');
    setEditMinuteInputStr('30');
    setShowEditAlarmModal(true);
  };

  const handleSaveAlarm = () => {
    let newList = [...alarmsList];
    if (editingAlarm) {
      newList = alarmsList.map(a => a.id === editingAlarm.id ? {
        ...a,
        hour: editHour,
        minute: editMinute,
        period: editPeriod,
        type: editType,
        shakeDuration: editShakeDuration,
        isSmart: editIsSmart
      } : a);
    } else {
      const newAlarm: AlarmItem = {
        id: Date.now().toString(),
        hour: editHour,
        minute: editMinute,
        period: editPeriod,
        type: editType,
        shakeDuration: editShakeDuration,
        isEnabled: true,
        isSmart: editIsSmart
      };
      newList.push(newAlarm);
    }
    setAlarmsList(newList);
    saveAlarms(newList);
    setShowEditAlarmModal(false);
  };

  const handleDeleteAlarm = (alarmId: string) => {
    const newList = alarmsList.filter(a => a.id !== alarmId);
    setAlarmsList(newList);
    saveAlarms(newList);
  };

  const handleToggleAlarm = (alarmId: string, val: boolean) => {
    const newList = alarmsList.map(a => a.id === alarmId ? { ...a, isEnabled: val } : a);
    setAlarmsList(newList);
    saveAlarms(newList);
  };

  const handleSnooze = async () => {
    if (snoozeCount >= 1) return;
    setSnoozeCount(prev => prev + 1);
    setIsAlarmTriggered(false);
    const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);
    setSnoozedTime(snoozeDate);

    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 Alarm Snoozed',
            body: 'Wake up! Snooze period elapsed.',
            sound: true,
            vibrate: [0, 500, 200, 500],
          } as any,
          trigger: {
            seconds: 300,
            type: 'timeInterval',
          } as any,
        });
      } catch (e) {
        console.log('Snooze notification error:', e);
      }
    }
    console.log('Alarm snoozed for 5 minutes.');
  };

  // Register push notifications permission on mount
  useEffect(() => {
    const getPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Push notification permissions denied');
        }
      }
    };
    getPermissions();

    // Listen to notification clicks received in foreground or when tapping background alerts
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      setIsTrackingActive(true);
      setIsAlarmTriggered(true);
      const soonest = getSoonestAlarm(alarmsList);
      setRemainingSeconds(soonest ? soonest.alarm.shakeDuration : shakeDuration);
      setShakeCount(0);
      startTimeRef.current = Date.now();
    });
    return () => subscription.remove();
  }, [shakeDuration, alarmsList]);

  // Load calendar sleep logs from AsyncStorage
  useEffect(() => {
    const loadSleepLogs = async () => {
      try {
        const raw = await AsyncStorage.getItem('iMaxx_sleep_calendar_logs');
        if (raw) {
          setSleepCalendarLogs(JSON.parse(raw));
        } else {
          // Initialize baseline mock history mapping for the last 14 days
          const baseline: Record<string, any> = {};
          const today = new Date();
          for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            baseline[dateStr] = {
              hours: Number((6.2 + Math.random() * 2.3).toFixed(1)),
              quality: Math.floor(75 + Math.random() * 20),
              snoring: Math.floor(4 + Math.random() * 16),
              bedtime: `10:${10 + Math.floor(Math.random() * 35)} PM`
            };
          }
          setSleepCalendarLogs(baseline);
          await AsyncStorage.setItem('iMaxx_sleep_calendar_logs', JSON.stringify(baseline));
        }
      } catch (err) {
        console.log(err);
      }
    };
    loadSleepLogs();
  }, []);

  // Log a new sleep session
  const recordSleepSession = async (hours: number) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const newSession = {
        hours: Number(hours.toFixed(1)),
        quality: Math.floor(76 + Math.random() * 21),
        snoring: Math.floor(4 + Math.random() * 14),
        bedtime: `${alarmHour}:${alarmMinute < 10 ? '0' : ''}${alarmMinute} ${alarmPeriod}`
      };
      const updated = { ...sleepCalendarLogs, [todayStr]: newSession };
      setSleepCalendarLogs(updated);
      await AsyncStorage.setItem('iMaxx_sleep_calendar_logs', JSON.stringify(updated));
    } catch (err) {
      console.log('Error writing sleep session:', err);
    }
  };

  // Soundscape track mapping helper
  const getActiveTrackName = () => {
    if (!activeSoundscape) return 'Sleep Aid';
    switch (activeSoundscape) {
      case 'focus': return 'ADHD Focus Beat';
      case 'relax': return 'Somatic Calm Resonator';
      case 'sleep': return 'Night Energy Fade';
      case 'move': return 'Ultradian Heartbeat';
      case 'uplift': return 'Peak Serotonin';
      default: return activeSoundscape.charAt(0).toUpperCase() + activeSoundscape.slice(1);
    }
  };

  const getSmartAlarmWindow = (h: number, m: number, p: 'AM' | 'PM', size = 30) => {
    let totalMinutes = h * 60 + m;
    if (p === 'PM' && h !== 12) totalMinutes += 12 * 60;
    if (p === 'AM' && h === 12) totalMinutes -= 12 * 60;

    let startMinutes = totalMinutes - size;
    if (startMinutes < 0) startMinutes += 24 * 60;

    let startH = Math.floor(startMinutes / 60);
    const startM = startMinutes % 60;
    let startP: 'AM' | 'PM' = 'AM';

    if (startH >= 12) {
      startP = 'PM';
      if (startH > 12) startH -= 12;
    } else {
      if (startH === 0) startH = 12;
    }

    const padM = startM < 10 ? '0' : '';
    const padAlarmM = m < 10 ? '0' : '';

    return `Wake up easy between\n${startH}:${padM}${startM} ${startP} - ${h}:${padAlarmM}${m} ${p}`;
  };

  // Adjust picker time handlers
  const incrementHour = () => setAlarmHour((prev) => {
    const next = prev === 12 ? 1 : prev + 1;
    setHourInputStr(next.toString());
    return next;
  });
  const decrementHour = () => setAlarmHour((prev) => {
    const next = prev === 1 ? 12 : prev - 1;
    setHourInputStr(next.toString());
    return next;
  });
  const incrementMinute = () => setAlarmMinute((prev) => {
    const next = prev === 55 ? 0 : prev + 5;
    setMinuteInputStr(next < 10 ? `0${next}` : next.toString());
    return next;
  });
  const decrementMinute = () => setAlarmMinute((prev) => {
    const next = prev === 0 ? 55 : prev - 5;
    setMinuteInputStr(next < 10 ? `0${next}` : next.toString());
    return next;
  });

  const prevHour = alarmHour === 1 ? 12 : alarmHour - 1;
  const nextHour = alarmHour === 12 ? 1 : alarmHour + 1;
  const prevMinute = alarmMinute === 0 ? 55 : alarmMinute - 5;
  const nextMinute = alarmMinute === 55 ? 0 : alarmMinute + 5;

  // -------------------------------------------------------------
  // PanResponders for dragging wheels and swiping control box
  // -------------------------------------------------------------
  const paginatorPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 40) {
          // Swipe right: previous mode
          setActiveModeIdx((prev) => (prev === 0 ? 2 : prev - 1));
        } else if (gestureState.dx < -40) {
          // Swipe left: next mode
          setActiveModeIdx((prev) => (prev === 2 ? 0 : prev + 1));
        }
      }
    })
  ).current;

  const lastDYHour = useRef(0);
  const hourPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDYHour.current = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const diff = gestureState.dy - lastDYHour.current;
        if (diff < -20) {
          incrementHour();
          lastDYHour.current = gestureState.dy;
        } else if (diff > 20) {
          decrementHour();
          lastDYHour.current = gestureState.dy;
        }
      }
    })
  ).current;

  const lastDYMinute = useRef(0);
  const minutePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDYMinute.current = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const diff = gestureState.dy - lastDYMinute.current;
        if (diff < -20) {
          incrementMinute();
          lastDYMinute.current = gestureState.dy;
        } else if (diff > 20) {
          decrementMinute();
          lastDYMinute.current = gestureState.dy;
        }
      }
    })
  ).current;

  const lastDYPeriod = useRef(0);
  const periodPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDYPeriod.current = 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const diff = gestureState.dy - lastDYPeriod.current;
        if (Math.abs(diff) > 20) {
          setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
          lastDYPeriod.current = gestureState.dy;
        }
      }
    })
  ).current;

  // Slide tracking start
  const handleStartTracking = async () => {
    setIsTrackingActive(true);
    setRemainingSeconds(shakeDuration);
    setShakeCount(0);
    slideX.setValue(0);
    startTimeRef.current = Date.now();

    // If sleep soundscape is not playing, auto start it
    if (!isPlaying) {
      dispatch(setSoundscape('sleep'));
      dispatch(togglePlayback());
    }

    // Schedule background native alarm notification (rings even when closed/music stopped!)
    if (activeModeIdx !== 0 && Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        const soonest = getSoonestAlarm(alarmsList);
        if (soonest) {
          console.log(`Alarm scheduled natively in ${soonest.triggerSeconds} seconds (Alarm ID: ${soonest.alarm.id}).`);
          await Notifications.scheduleNotificationAsync({
            content: {
              title: soonest.alarm.isSmart ? '🌅 Smart Cycle Wakeup' : '🔔 Fixed Alarm',
              body: 'Open Dopamind to complete the Forced Shake challenge and conquer your day!',
              sound: true,
              vibrate: [0, 500, 200, 500],
              data: { alarmId: soonest.alarm.id }
            } as any,
            trigger: {
              seconds: soonest.triggerSeconds,
              type: 'timeInterval',
            } as any,
          });
        }
      } catch (err) {
        console.log('Error scheduling local notification:', err);
      }
    }
  };

  // Swipe gesture for slide to stop tracking
  const stopPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const dx = gestureState.dx;
        if (dx > 0) {
          const clampedX = Math.min(dx, 166);
          slideX.setValue(clampedX);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dx = gestureState.dx;
        if (dx >= 150) {
          handleStopTracking();
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true, tension: 40 }).start();
        }
      }
    })
  ).current;

  const handleStopTracking = async () => {
    setIsTrackingActive(false);
    setIsAlarmTriggered(false);
    setShakeCount(0);
    setRemainingSeconds(0);
    setSnoozeCount(0);
    setSnoozedTime(null);
    if (isPlaying) {
      dispatch(togglePlayback());
    }

    // Cancel native notifications
    if (Platform.OS !== 'web') {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (e) {
        // Silently fail
      }
    }

    // Calculate and log real duration
    if (startTimeRef.current) {
      const elapsedMs = Date.now() - startTimeRef.current;
      const elapsedHours = elapsedMs / 3600000;
      const finalHours = elapsedHours < 0.01 ? (7.0 + Math.random() * 1.5) : elapsedHours;
      recordSleepSession(finalHours);
      startTimeRef.current = null;
    }
  };

  // Foreground clock ticker and alarm checker - checks alarms continuously in the foreground!
  useEffect(() => {
    let clockInterval: any;
    if (!isAlarmTriggered) {
      const checkAlarms = () => {
        const d = new Date();
        const currentHour24 = d.getHours();
        const currentMinute = d.getMinutes();
        const currentSecond = d.getSeconds();

        // Check snoozed alarm trigger first
        if (snoozedTime && d.getTime() >= snoozedTime.getTime()) {
          console.log('[AlarmEngine] Snooze elapsed, triggering alarm!');
          setSnoozedTime(null);
          setIsAlarmTriggered(true);
          setIsTrackingActive(true);
          const soonest = getSoonestAlarm(alarmsList);
          setRemainingSeconds(soonest ? soonest.alarm.shakeDuration : shakeDuration);
          setShakeCount(0);
          return;
        }

        // Trigger check at the start of a minute (seconds === 0)
        if (currentSecond === 0) {
          const enabledAlarms = alarmsList.filter(a => a.isEnabled);
          enabledAlarms.forEach(alarm => {
            let alarmHour24 = alarm.hour;
            if (alarm.period === 'PM' && alarm.hour !== 12) alarmHour24 += 12;
            if (alarm.period === 'AM' && alarm.hour === 12) alarmHour24 = 0;

            if (currentHour24 === alarmHour24 && currentMinute === alarm.minute) {
              console.log(`[AlarmEngine] Active alarm triggered: ${alarm.hour}:${alarm.minute} ${alarm.period}`);
              setIsAlarmTriggered(true);
              setIsTrackingActive(true); // Automatically activate tracking screen!
              setRemainingSeconds(alarm.shakeDuration);
              setShakeCount(0);
            }
          });
        }

        let hours = d.getHours();
        const mins = d.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const padM = mins < 10 ? '0' : '';
        setCurrentTimeStr(`${hours}:${padM}${mins} ${period}`);
      };

      checkAlarms();
      clockInterval = setInterval(checkAlarms, 1000);
    }
    return () => clearInterval(clockInterval);
  }, [isAlarmTriggered, alarmsList, snoozedTime]);

  // Subscribe to Accelerometer sensor for physical device shake detection
  useEffect(() => {
    let subscription: any = null;
    if (isAlarmTriggered && forcedWakeup && Platform.OS !== 'web') {
      let lastUpdate = 0;
      subscription = Accelerometer.addListener(accelerometerData => {
        const now = Date.now();
        // Limit calculation frequency for stability
        if (now - lastUpdate > 100) {
          const { x, y, z } = accelerometerData;
          const force = Math.sqrt(x * x + y * y + z * z);
          // Standard shake threshold is 1.8G (normal environment gravity is 1.0G)
          if (force > 1.8) {
            setShakeCount(prev => {
              const next = prev + 1;
              if (next >= shakeDuration) {
                handleStopTracking();
              }
              return next;
            });
          }
          lastUpdate = now;
        }
      });
      Accelerometer.setUpdateInterval(100);
    }
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isAlarmTriggered, forcedWakeup, shakeDuration]);

  // Shake challenge manual simulation
  const handleSimulateShake = async () => {
    if (remainingSeconds > 1) {
      setRemainingSeconds(prev => prev - 1);
      setShakeCount(prev => {
        const next = prev + 1;
        if (next >= shakeDuration) {
          handleStopTracking();
        }
        return next;
      });
    } else {
      handleStopTracking();
    }
  };

  // Soundscape pill play toggle
  const handleTogglePillPlay = (e: any) => {
    e.stopPropagation();
    dispatch(togglePlayback());
  };

  // Weekly bar stats mapping helper
  const getWeeklyStats = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = days[d.getDay()];

      if (sleepCalendarLogs[dateStr]) {
        result.push({
          day: dayLabel,
          hours: sleepCalendarLogs[dateStr].hours,
          quality: sleepCalendarLogs[dateStr].quality,
          snoring: sleepCalendarLogs[dateStr].snoring,
          bedtime: sleepCalendarLogs[dateStr].bedtime,
          dateStr
        });
      } else {
        result.push({
          day: dayLabel,
          hours: 0,
          quality: 0,
          snoring: 0,
          bedtime: '-',
          dateStr
        });
      }
    }
    return result;
  };

  const weeklyStats = getWeeklyStats();
  const activeSessions = weeklyStats.filter(s => s.hours > 0);
  const totalH = activeSessions.reduce((acc, s) => acc + s.hours, 0);
  const avgHoursNum = activeSessions.length ? totalH / activeSessions.length : 7.2;
  const avgH = Math.floor(avgHoursNum);
  const avgM = Math.round((avgHoursNum - avgH) * 60);
  const avgHoursStr = `${avgH}h ${avgM < 10 ? '0' : ''}${avgM}m`;

  const avgSnore = activeSessions.length ? Math.round(activeSessions.reduce((acc, s) => acc + s.snoring, 0) / activeSessions.length) : 12;
  const avgQuality = activeSessions.length ? Math.round(activeSessions.reduce((acc, s) => acc + s.quality, 0) / activeSessions.length) : 85;

  // Calendar rendering helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const handleLogSimulatedSession = async () => {
    const newSession = {
      hours: Number((6.5 + Math.random() * 2).toFixed(1)),
      quality: Math.floor(75 + Math.random() * 20),
      snoring: Math.floor(5 + Math.random() * 15),
      bedtime: '10:30 PM'
    };
    const updated = { ...sleepCalendarLogs, [selectedCalendarDate]: newSession };
    setSleepCalendarLogs(updated);
    await AsyncStorage.setItem('iMaxx_sleep_calendar_logs', JSON.stringify(updated));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const startOffset = getFirstDayIndex(currentYear, currentMonth);
    const totalSlots = Math.ceil((daysInMonth + startOffset) / 7) * 7;

    const days = [];
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - startOffset + 1;
      const isValidDay = dayNum > 0 && dayNum <= daysInMonth;

      const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      const log = sleepCalendarLogs[dateStr];
      const hasSleepLog = isValidDay && !!log;
      const isSelected = isValidDay && selectedCalendarDate === dateStr;
      const isToday = isValidDay && new Date().toISOString().split('T')[0] === dateStr;

      days.push(
        <CalendarDayCell
          key={i}
          activeOpacity={0.7}
          disabled={!isValidDay}
          onPress={() => {
            if (isValidDay) {
              setSelectedCalendarDate(dateStr);
            }
          }}
        >
          {isValidDay && (
            <CalendarDayLabelContainer
              hasLog={hasSleepLog}
              isSelected={isSelected}
              isToday={isToday}
            >
              <CalendarDayNumberText isSelected={isSelected} hasLog={hasSleepLog}>
                {dayNum}
              </CalendarDayNumberText>
              {hasSleepLog && (
                <CalendarDayHoursText isSelected={isSelected}>
                  {log.hours}h
                </CalendarDayHoursText>
              )}
            </CalendarDayLabelContainer>
          )}
        </CalendarDayCell>
      );
    }

    return (
      <CalendarGrid>
        <WeekdayRow>
          {weekdays.map((w, idx) => (
            <WeekdayLabel key={idx}>{w}</WeekdayLabel>
          ))}
        </WeekdayRow>
        <DaysGridRow>{days}</DaysGridRow>
      </CalendarGrid>
    );
  };

  const selectedLog = sleepCalendarLogs[selectedCalendarDate];
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Container>
      {/* Background Constellation Elements & Glass Glow Orbs */}
      <AbsoluteCanvas pointerEvents="none">
        <GlowOrb1 />
        <GlowOrb2 />
        <TwinklingStar size={2} x={SCREEN_WIDTH * 0.1} y={120} />
        <TwinklingStar size={3} x={SCREEN_WIDTH * 0.85} y={150} />
        <TwinklingStar size={1.8} x={SCREEN_WIDTH * 0.25} y={300} />
        <TwinklingStar size={2.5} x={SCREEN_WIDTH * 0.75} y={320} />
      </AbsoluteCanvas>

      {/* Main setup interface */}
      {!isTrackingActive && (
        <View style={{ flex: 1 }}>
          <HeaderBar>
            <HeaderIconBox onPress={() => setShowCalendarModal(true)}>
              <Calendar size={18} color="#FFFFFF" />
            </HeaderIconBox>
            <HeaderDateText>SleepMaxxing</HeaderDateText>
            <HeaderIconBox onPress={onOpenPlayer}>
              <MoreHorizontal size={18} color="#FFFFFF" />
            </HeaderIconBox>
          </HeaderBar>

          <ScrollContent showsVerticalScrollIndicator={false}>
            {/* Top Pill background selector (Sleep Aid) */}
            <SleepAidPillRow>
              <SleepAidPill onPress={onOpenScenarios}>
                <SleepAidPillText>
                  🎵 {getActiveTrackName()}
                </SleepAidPillText>
                <SleepAidPillPlay onPress={handleTogglePillPlay}>
                  {isPlaying && activeSoundscape === 'sleep' ? (
                    <Pause size={10} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={10} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
                  )}
                </SleepAidPillPlay>
              </SleepAidPill>
            </SleepAidPillRow>

            {/* Smart Paginator Card in Center (Fully Swipeable!) */}
            <ControlCard {...paginatorPanResponder.panHandlers}>
              <CardHeaderRow>
                <TouchableOpacity onPress={() => setActiveModeIdx((prev) => (prev === 0 ? 2 : prev - 1))}>
                  <ChevronLeft size={20} color="#8E8E93" />
                </TouchableOpacity>
                <CardHeaderTitle>
                  {activeModeIdx === 0 && 'No Alarm'}
                  {activeModeIdx === 1 && 'Fixed Alarm'}
                  {activeModeIdx === 2 && 'Smart Cycle Alarm'}
                </CardHeaderTitle>
                <TouchableOpacity onPress={() => setActiveModeIdx((prev) => (prev === 2 ? 0 : prev + 1))}>
                  <ChevronRight size={20} color="#8E8E93" />
                </TouchableOpacity>
              </CardHeaderRow>

              {/* iOS glass time picker columns (Swipeable / Draggable vertically!) */}
              {activeModeIdx !== 0 ? (
                <SmartTimePickerContainer>
                  {/* Hours */}
                  <PickerCol {...hourPanResponder.panHandlers}>
                    <PickerArrow onPress={incrementHour}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }}>▲</Text>
                    </PickerArrow>
                    <PickerDigit>{nextHour}</PickerDigit>
                    <PickerActiveDigitBox>
                      <PickerActiveInput
                        keyboardType="number-pad"
                        maxLength={2}
                        value={hourInputStr}
                        onChangeText={(text) => {
                          const clean = text.replace(/[^0-9]/g, '');
                          setHourInputStr(clean);
                          if (clean !== '') {
                            const val = parseInt(clean, 10);
                            if (val >= 1 && val <= 12) {
                              setAlarmHour(val);
                            }
                          }
                        }}
                        onBlur={() => {
                          if (hourInputStr === '' || parseInt(hourInputStr, 10) < 1 || parseInt(hourInputStr, 10) > 12) {
                            setAlarmHour(7);
                            setHourInputStr('7');
                          } else {
                            setAlarmHour(parseInt(hourInputStr, 10));
                          }
                        }}
                      />
                    </PickerActiveDigitBox>
                    <PickerDigit>{prevHour}</PickerDigit>
                    <PickerArrow onPress={decrementHour}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }}>▼</Text>
                    </PickerArrow>
                  </PickerCol>

                  <ColonText>:</ColonText>

                  {/* Minutes */}
                  <PickerCol {...minutePanResponder.panHandlers}>
                    <PickerArrow onPress={incrementMinute}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }}>▲</Text>
                    </PickerArrow>
                    <PickerDigit>{nextMinute < 10 ? '0' : ''}{nextMinute}</PickerDigit>
                    <PickerActiveDigitBox>
                      <PickerActiveInput
                        keyboardType="number-pad"
                        maxLength={2}
                        value={minuteInputStr}
                        onChangeText={(text) => {
                          const clean = text.replace(/[^0-9]/g, '');
                          setMinuteInputStr(clean);
                          if (clean !== '') {
                            const val = parseInt(clean, 10);
                            if (val >= 0 && val <= 59) {
                              setAlarmMinute(val);
                            }
                          }
                        }}
                        onBlur={() => {
                          if (minuteInputStr === '' || parseInt(minuteInputStr, 10) < 0 || parseInt(minuteInputStr, 10) > 59) {
                            setAlarmMinute(30);
                            setMinuteInputStr('30');
                          } else {
                            const val = parseInt(minuteInputStr, 10);
                            setAlarmMinute(val);
                            setMinuteInputStr(val < 10 ? `0${val}` : val.toString());
                          }
                        }}
                      />
                    </PickerActiveDigitBox>
                    <PickerDigit>{prevMinute < 10 ? '0' : ''}{prevMinute}</PickerDigit>
                    <PickerArrow onPress={decrementMinute}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }}>▼</Text>
                    </PickerArrow>
                  </PickerCol>

                  {/* AM/PM */}
                  <PickerCol style={{ marginLeft: 12 }} {...periodPanResponder.panHandlers}>
                    <PickerArrow onPress={() => setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM')}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }}>▲</Text>
                    </PickerArrow>
                    <PickerDigit style={{ opacity: 0.1 }}>{alarmPeriod === 'AM' ? 'PM' : 'AM'}</PickerDigit>
                    <PickerActiveDigitBox>
                      <PickerActiveDigit>{alarmPeriod}</PickerActiveDigit>
                    </PickerActiveDigitBox>
                    <PickerDigit style={{ opacity: 0.1 }}>{alarmPeriod === 'AM' ? 'PM' : 'AM'}</PickerDigit>
                    <PickerArrow onPress={() => setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM')}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 24 }}>▼</Text>
                    </PickerArrow>
                  </PickerCol>
                </SmartTimePickerContainer>
              ) : (
                <View style={{ height: 140, justifyContent: 'center', alignItems: 'center' }}>
                  <Moon size={58} color="rgba(255, 255, 255, 0.12)" />
                </View>
              )}

              {/* Wake window information labels */}
              {activeModeIdx === 0 && (
                <View style={{ alignItems: 'center' }}>
                  <InfoTextLine1>Only sleep analyzed</InfoTextLine1>
                  <InfoTextLine2>No alarm will go off in the morning</InfoTextLine2>
                </View>
              )}

              {activeModeIdx === 1 && (
                <View style={{ alignItems: 'center' }}>
                  <InfoTextLine1>No wake up window</InfoTextLine1>
                  <InfoTextLine2>Alarm will go off exactly at {alarmHour}:{alarmMinute < 10 ? '0' : ''}{alarmMinute} {alarmPeriod}</InfoTextLine2>
                </View>
              )}

              {activeModeIdx === 2 && (
                <View style={{ alignItems: 'center' }}>
                  <InfoTextLine1>Wake up easy window</InfoTextLine1>
                  <InfoTextLine2 style={{ lineHeight: 16, textAlign: 'center' }}>
                    {getSmartAlarmWindow(alarmHour, alarmMinute, alarmPeriod, windowSize)}
                  </InfoTextLine2>
                </View>
              )}

              {/* Tracking activation Start button */}
              <MainStartButton activeOpacity={0.8} onPress={handleStartTracking}>
                <MainStartButtonText>Start</MainStartButtonText>
              </MainStartButton>

              {/* Indicator dots for paginated setup */}
              <PaginationDots>
                {[0, 1, 2].map((idx) => (
                  <Dot key={idx} active={activeModeIdx === idx} onPress={() => setActiveModeIdx(idx)} />
                ))}
              </PaginationDots>
            </ControlCard>

            {/* Subsection: Upcoming Alarms list */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 10 }}>
              <SectionTitle style={{ marginTop: 0 }}>Upcoming Alarms</SectionTitle>
              <TouchableOpacity
                onPress={handleOpenAdd}
                style={{
                  backgroundColor: 'rgba(78,205,196,0.1)',
                  borderColor: 'rgba(78,205,196,0.3)',
                  borderWidth: 0.8,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginRight: 10
                }}
              >
                <Text style={{ color: '#4ECDC4', fontSize: 12, fontWeight: '700' }}>+ Add</Text>
              </TouchableOpacity>
            </View>

            <SettingsCard style={{ marginBottom: 25 }}>
              {alarmsList.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#8E8E93', fontSize: 13 }}>No active alarms set</Text>
                </View>
              ) : (
                alarmsList.map((alarm) => (
                  <View
                    key={alarm.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      borderBottomWidth: 0.5,
                      borderBottomColor: 'rgba(255,255,255,0.06)'
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700' }}>
                          {alarm.hour}:{alarm.minute < 10 ? '0' : ''}{alarm.minute} {alarm.period}
                        </Text>
                        <View style={{ backgroundColor: alarm.isSmart ? 'rgba(78,205,196,0.15)' : 'rgba(255,126,71,0.15)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: alarm.isSmart ? '#4ECDC4' : '#FF7E47', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                            {alarm.isSmart ? 'smart' : 'fixed'}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: '#8E8E93', fontSize: 11, marginTop: 4 }}>
                        {alarm.type === 'daily' ? 'Daily' : 'Once'} • {alarm.shakeDuration}s shake challenge
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => handleOpenEdit(alarm)}
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6
                        }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>Edit</Text>
                      </TouchableOpacity>
                      <Switch
                        value={alarm.isEnabled}
                        onValueChange={(val) => handleToggleAlarm(alarm.id, val)}
                        trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#FF7E47' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  </View>
                ))
              )}
            </SettingsCard>

            {/* Smart features & Dismiss Settings list */}
            <SectionTitle>Alarm & Sensor Settings</SectionTitle>
            <SettingsCard>
              <SettingsRow>
                <SettingsRowLeft>
                  <SettingsIconBox color="#FF7E47">
                    <Smartphone size={16} color="#FF7E47" />
                  </SettingsIconBox>
                  <SettingsTextGroup>
                    <SettingsLabel>Forced Wakeup Mission</SettingsLabel>
                    <SettingsSub>Requires shaking phone for {shakeDuration}s to dismiss alarm</SettingsSub>
                  </SettingsTextGroup>
                </SettingsRowLeft>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {forcedWakeup && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                      <TouchableOpacity
                        onPress={() => setShakeDuration(prev => Math.max(5, prev - 5))}
                        style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, marginRight: 6 }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>−</Text>
                      </TouchableOpacity>
                      <ModeBadge style={{ marginRight: 6 }}>{shakeDuration}s</ModeBadge>
                      <TouchableOpacity
                        onPress={() => setShakeDuration(prev => Math.min(60, prev + 5))}
                        style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6 }}
                      >
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Switch
                    value={forcedWakeup}
                    onValueChange={setForcedWakeup}
                    trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#FF7E47' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </SettingsRow>

              <SettingsRow>
                <SettingsRowLeft>
                  <SettingsIconBox color="#4ECDC4">
                    <Activity size={16} color="#4ECDC4" />
                  </SettingsIconBox>
                  <SettingsTextGroup>
                    <SettingsLabel>Smart Window Size</SettingsLabel>
                    <SettingsSub>Cycle window size prior to alarm</SettingsSub>
                  </SettingsTextGroup>
                </SettingsRowLeft>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setWindowSize(prev => Math.max(15, prev - 15))}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, marginRight: 6 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>−</Text>
                  </TouchableOpacity>
                  <ModeBadge style={{ marginRight: 6 }}>{windowSize}m</ModeBadge>
                  <TouchableOpacity
                    onPress={() => setWindowSize(prev => Math.min(60, prev + 15))}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </SettingsRow>

              <SettingsRow>
                <SettingsRowLeft>
                  <SettingsIconBox color="#9B7EDE">
                    <Volume2 size={16} color="#9B7EDE" />
                  </SettingsIconBox>
                  <SettingsTextGroup>
                    <SettingsLabel>Snore Sound analysis</SettingsLabel>
                    <SettingsSub>Monitor snoring sounds dynamically</SettingsSub>
                  </SettingsTextGroup>
                </SettingsRowLeft>
                <Switch
                  value={microphoneLogging}
                  onValueChange={setMicrophoneLogging}
                  trackColor={{ false: 'rgba(255,255,255,0.08)', true: '#9B7EDE' }}
                  thumbColor="#FFFFFF"
                />
              </SettingsRow>
            </SettingsCard>

            {/* Sleep Goals & Weekly Insights Section (Sleep Cycle Style) */}
            <SectionTitle>Sleep Goal & Regularity</SectionTitle>
            <InsightsCard>
              <InsightsHeaderRow>
                <View style={{ flex: 1 }}>
                  <InsightsMainVal>{avgHoursStr}</InsightsMainVal>
                  <InsightsSub>Average sleep duration (Last 7 days)</InsightsSub>
                </View>
                <SettingsIconBox color="#4ECDC4">
                  <Activity size={18} color="#4ECDC4" />
                </SettingsIconBox>
              </InsightsHeaderRow>

              {/* Weekly bar chart mapped from real AsyncStorage records */}
              <DayBarChart>
                {weeklyStats.map((item, idx) => (
                  <BarCol key={idx}>
                    <BarTrack>
                      <BarFill height={(item.hours / 9) * 100} active={item.hours >= 7} />
                    </BarTrack>
                    <BarLabel>{item.day}</BarLabel>
                  </BarCol>
                ))}
              </DayBarChart>

              {/* Bottom statistics grid */}
              <GridRow>
                <GridCol>
                  <GridLabel>Snoring</GridLabel>
                  <GridValue color="#FFD166">{avgSnore}m</GridValue>
                  <GridSub>Low detection</GridSub>
                </GridCol>
                <GridCol>
                  <GridLabel>Regularity</GridLabel>
                  <GridValue color="#4ECDC4">{avgQuality}%</GridValue>
                  <GridSub>Optimal rhythm</GridSub>
                </GridCol>
                <GridCol>
                  <GridLabel>Bedtime</GridLabel>
                  <GridValue color="#FF7E47">10:15</GridValue>
                  <GridSub>Goal: 10:30 PM</GridSub>
                </GridCol>
              </GridRow>
            </InsightsCard>

            {/* Manual test simulation options */}
            <SectionTitle>Simulation Tools</SectionTitle>
            <TouchableOpacity
              onPress={() => {
                const soonest = getSoonestAlarm(alarmsList);
                const targetShake = soonest ? soonest.alarm.shakeDuration : shakeDuration;
                setIsTrackingActive(true);
                setIsAlarmTriggered(true);
                setRemainingSeconds(targetShake);
                setShakeCount(0);
                startTimeRef.current = Date.now();
              }}
              style={{
                backgroundColor: 'rgba(255,126,71,0.08)',
                borderWidth: 0.8,
                borderColor: 'rgba(255,126,71,0.2)',
                borderRadius: 16,
                padding: 14,
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              <Text style={{ color: '#FF7E47', fontSize: 13, fontWeight: '700' }}>⚠️ Simulate Alarm Wakeup Trigger</Text>
            </TouchableOpacity>

            <ExtraSpacing />
          </ScrollContent>
        </View>
      )}

      {/* -----------------------------------------------------------
          Fullscreen overlay: Tracking active view (Sleep Cycle style)
          ----------------------------------------------------------- */}
      {isTrackingActive && !isAlarmTriggered && (
        <FullscreenOverlayContainer>
          {/* Top Sound Track selection indication pill */}
          <SleepAidPill onPress={onOpenScenarios}>
            <SleepAidPillText>
              🎵 {getActiveTrackName()}
            </SleepAidPillText>
            <SleepAidPillPlay onPress={handleTogglePillPlay}>
              {isPlaying ? (
                <Pause size={10} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={10} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 1 }} />
              )}
            </SleepAidPillPlay>
          </SleepAidPill>

          {/* Central space artwork with glowing moon and star components */}
          <StarsGlowMoon>
            <AbsoluteCanvas pointerEvents="none" style={{ width: 300, height: 300, alignSelf: 'center' }}>
              <TwinklingStar size={2} x={60} y={50} />
              <TwinklingStar size={3} x={240} y={80} />
              <TwinklingStar size={1.5} x={40} y={180} />
              <TwinklingStar size={2.5} x={260} y={220} />
            </AbsoluteCanvas>
            <MoonGlowCircle>
              <Moon size={54} color="#E6E6FA" style={{ opacity: 0.8 }} />
            </MoonGlowCircle>
          </StarsGlowMoon>

          {/* Live tracking clock */}
          <View style={{ alignItems: 'center' }}>
            <TrackingTimeText>{currentTimeStr || '12:00 AM'}</TrackingTimeText>
            <TrackingSubText>
              {activeModeIdx === 0
                ? 'Only sleep analyzed'
                : `Alarm ${alarmHour}:${alarmMinute < 10 ? '0' : ''}${alarmMinute} ${alarmPeriod}`}
            </TrackingSubText>
          </View>

          {/* Draggable Slide to stop handle at bottom */}
          <SlideStopContainer>
            <SlideStopTrack>
              <SlideStopText>Slide to stop</SlideStopText>
              <SlideStopHandle
                style={{ transform: [{ translateX: slideX }] }}
                {...stopPanResponder.panHandlers}
              >
                <ChevronRight size={20} color="#08080C" />
              </SlideStopHandle>
            </SlideStopTrack>
          </SlideStopContainer>
        </FullscreenOverlayContainer>
      )}

      {/* -----------------------------------------------------------
          Fullscreen overlay: Flashing Alarm triggered challenge screen
          ----------------------------------------------------------- */}
      {isTrackingActive && isAlarmTriggered && (
        <AlarmFlashContainer activeColor="#FF7E47">
          <Moon size={64} color="#FFFFFF" style={{ marginBottom: 24, opacity: 0.9 }} />

          <ShakeBox>
            <ShakeTitle>WAKE UP MISSION</ShakeTitle>

            {forcedWakeup ? (
              <>
                <ShakeTimeText>{remainingSeconds}s</ShakeTimeText>
                <ShakeCountText>Shakes: {shakeCount} / {shakeDuration}</ShakeCountText>

                <ShakeProgressBg>
                  <ShakeProgressFill percent={(shakeCount / shakeDuration) * 100} />
                </ShakeProgressBg>

                <ShakeInstruction>
                  Forced Wakeup Enabled! Shake the phone continuously for {shakeDuration} seconds to dismiss the alarm.
                </ShakeInstruction>

                <SimulateButton onPress={handleSimulateShake}>
                  <SimulateButtonText>Simulate Shake 👋</SimulateButtonText>
                </SimulateButton>

                {snoozeCount < 1 && (
                  <TouchableOpacity
                    onPress={handleSnooze}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 0.8,
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      alignItems: 'center',
                      marginTop: 10,
                      width: '100%'
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                      Snooze Alarm (5 min) ⏳
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleStopTracking}
                  style={{
                    backgroundColor: 'rgba(78,205,196,0.12)',
                    borderWidth: 0.8,
                    borderColor: 'rgba(78,205,196,0.3)',
                    borderRadius: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    alignItems: 'center',
                    marginTop: 10,
                    width: '100%'
                  }}
                >
                  <Text style={{ color: '#4ECDC4', fontWeight: '700', fontSize: 13 }}>
                    Instantly Complete Mission (Testing) ⚡
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <ShakeTimeText style={{ fontSize: 44, marginVertical: 14 }}>
                  {alarmHour}:{alarmMinute < 10 ? '0' : ''}{alarmMinute} {alarmPeriod}
                </ShakeTimeText>
                <ShakeInstruction>
                  Smart wakeup triggered! Wake up easy now.
                </ShakeInstruction>

                <SimulateButton onPress={handleStopTracking}>
                  <SimulateButtonText>Dismiss Alarm 🔔</SimulateButtonText>
                </SimulateButton>

                {snoozeCount < 1 && (
                  <TouchableOpacity
                    onPress={handleSnooze}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderWidth: 0.8,
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 12,
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      alignItems: 'center',
                      marginTop: 10,
                      width: '100%'
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                      Snooze Alarm (5 min) ⏳
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ShakeBox>
        </AlarmFlashContainer>
      )}

      {/* -----------------------------------------------------------
          Modal: Edit Alarm Settings
          ----------------------------------------------------------- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditAlarmModal}
        onRequestClose={() => setShowEditAlarmModal(false)}
      >
        <ModalOverlay>
          <CalendarModalCard style={{ maxHeight: '80%' }}>
            <ModalHeaderRow>
              <ModalTitle>{editingAlarm ? 'Edit Alarm' : 'Add New Alarm'}</ModalTitle>
              <TouchableOpacity onPress={() => setShowEditAlarmModal(false)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </ModalHeaderRow>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Hour, Minute, Period Pickers */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
                {/* Hour */}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>HOUR</Text>
                  <TouchableOpacity onPress={() => setEditHour(h => { const next = h === 12 ? 1 : h + 1; setEditHourInputStr(next.toString()); return next; })} style={{ padding: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 32 }}>▲</Text>
                  </TouchableOpacity>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={2}
                    value={editHourInputStr}
                    onChangeText={(text) => {
                      const clean = text.replace(/[^0-9]/g, '');
                      setEditHourInputStr(clean);
                      if (clean !== '') {
                        const val = parseInt(clean, 10);
                        if (val >= 1 && val <= 12) {
                          setEditHour(val);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (editHourInputStr === '' || parseInt(editHourInputStr, 10) < 1 || parseInt(editHourInputStr, 10) > 12) {
                        setEditHour(7);
                        setEditHourInputStr('7');
                      } else {
                        setEditHour(parseInt(editHourInputStr, 10));
                      }
                    }}
                    style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700', textAlign: 'center', width: 60, padding: 4 }}
                  />
                  <TouchableOpacity onPress={() => setEditHour(h => { const next = h === 1 ? 12 : h - 1; setEditHourInputStr(next.toString()); return next; })} style={{ padding: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 32 }}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Minute */}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>MINUTE</Text>
                  <TouchableOpacity onPress={() => setEditMinute(m => { const next = m >= 55 ? 0 : m + 5; setEditMinuteInputStr(next < 10 ? '0' + next : next.toString()); return next; })} style={{ padding: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 32 }}>▲</Text>
                  </TouchableOpacity>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={2}
                    value={editMinuteInputStr}
                    onChangeText={(text) => {
                      const clean = text.replace(/[^0-9]/g, '');
                      setEditMinuteInputStr(clean);
                      if (clean !== '') {
                        const val = parseInt(clean, 10);
                        if (val >= 0 && val <= 59) {
                          setEditMinute(val);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (editMinuteInputStr === '' || parseInt(editMinuteInputStr, 10) < 0 || parseInt(editMinuteInputStr, 10) > 59) {
                        setEditMinute(30);
                        setEditMinuteInputStr('30');
                      } else {
                        const val = parseInt(editMinuteInputStr, 10);
                        setEditMinute(val);
                        setEditMinuteInputStr(val < 10 ? `0${val}` : val.toString());
                      }
                    }}
                    style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '700', textAlign: 'center', width: 60, padding: 4 }}
                  />
                  <TouchableOpacity onPress={() => setEditMinute(m => { const next = m <= 0 ? 55 : m - 5; setEditMinuteInputStr(next < 10 ? '0' + next : next.toString()); return next; })} style={{ padding: 12 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 32 }}>▼</Text>
                  </TouchableOpacity>
                </View>

                {/* Period */}
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#8E8E93', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>PERIOD</Text>
                  <TouchableOpacity onPress={() => setEditPeriod(p => p === 'AM' ? 'PM' : 'AM')} style={{ paddingVertical: 12 }}>
                    <Text style={{ color: '#FF7E47', fontSize: 24, fontWeight: '700' }}>{editPeriod}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alarm Type: Daily / Once */}
              <View style={{ marginVertical: 10 }}>
                <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: '700', marginBottom: 10 }}>REPETITION</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setEditType('daily')}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: editType === 'daily' ? '#FF7E47' : 'rgba(255,255,255,0.06)',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: editType === 'daily' ? '#08080C' : '#FFFFFF', fontWeight: '700' }}>Daily</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditType('once')}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: editType === 'once' ? '#FF7E47' : 'rgba(255,255,255,0.06)',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: editType === 'once' ? '#08080C' : '#FFFFFF', fontWeight: '700' }}>Once</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Alarm Mode: Smart / Fixed */}
              <View style={{ marginVertical: 10 }}>
                <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: '700', marginBottom: 10 }}>ALARM MODE</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setEditIsSmart(true)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: editIsSmart ? '#4ECDC4' : 'rgba(255,255,255,0.06)',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: editIsSmart ? '#08080C' : '#FFFFFF', fontWeight: '700' }}>Smart Wakeup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditIsSmart(false)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: !editIsSmart ? '#4ECDC4' : 'rgba(255,255,255,0.06)',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: !editIsSmart ? '#08080C' : '#FFFFFF', fontWeight: '700' }}>Fixed</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Shake seconds slider adjustment */}
              <View style={{ marginVertical: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ color: '#8E8E93', fontSize: 12, fontWeight: '700' }}>SHAKE CHALLENGE DURATION</Text>
                  <Text style={{ color: '#FF7E47', fontSize: 13, fontWeight: '700' }}>{editShakeDuration}s</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setEditShakeDuration(s => Math.max(5, s - 5))}
                    style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>−</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginHorizontal: 15, overflow: 'hidden' }}>
                    <View style={{ width: `${(editShakeDuration / 60) * 100}%`, height: '100%', backgroundColor: '#FF7E47' }} />
                  </View>
                  <TouchableOpacity
                    onPress={() => setEditShakeDuration(s => Math.min(60, s + 5))}
                    style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 }}>
              {editingAlarm && (
                <TouchableOpacity
                  onPress={() => {
                    handleDeleteAlarm(editingAlarm.id);
                    setShowEditAlarmModal(false);
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,78,78,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1
                  }}
                >
                  <Text style={{ color: '#FF4E4E', fontWeight: '700' }}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSaveAlarm}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: '#FF7E47',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 2
                }}
              >
                <Text style={{ color: '#08080C', fontWeight: '700' }}>Save Alarm</Text>
              </TouchableOpacity>
            </View>
          </CalendarModalCard>
        </ModalOverlay>
      </Modal>

      {/* -----------------------------------------------------------
          Calendar Day-by-Day Stats Modal (Top Left Button)
          ----------------------------------------------------------- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCalendarModal}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <ModalOverlay>
          <CalendarModalCard>
            <ModalHeaderRow>
              <ModalTitle>Sleep Calendar Logs</ModalTitle>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </ModalHeaderRow>

            {/* Month switcher header */}
            <MonthSelectorRow>
              <MonthNavBtn onPress={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(prev => prev - 1);
                } else {
                  setCurrentMonth(prev => prev - 1);
                }
              }}>
                <ChevronLeft size={16} color="#FFFFFF" />
              </MonthNavBtn>
              <MonthLabel>{monthsList[currentMonth]} {currentYear}</MonthLabel>
              <MonthNavBtn onPress={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(prev => prev + 1);
                } else {
                  setCurrentMonth(prev => prev + 1);
                }
              }}>
                <ChevronRight size={16} color="#FFFFFF" />
              </MonthNavBtn>
            </MonthSelectorRow>

            {/* Calendar Grid */}
            {renderCalendarDays()}

            {/* Detail panel of selected date */}
            <DetailPanel>
              <DetailDateText>Date: {selectedCalendarDate}</DetailDateText>
              {selectedLog ? (
                <>
                  <DetailDataRow>
                    <DetailLabel>Tracked Sleep Time:</DetailLabel>
                    <DetailValue>{selectedLog.hours} hours</DetailValue>
                  </DetailDataRow>
                  <DetailDataRow>
                    <DetailLabel>Rhythm Regularity:</DetailLabel>
                    <DetailValue>{selectedLog.quality}%</DetailValue>
                  </DetailDataRow>
                  <DetailDataRow>
                    <DetailLabel>Snore Duration:</DetailLabel>
                    <DetailValue>{selectedLog.snoring} mins</DetailValue>
                  </DetailDataRow>
                  <DetailDataRow>
                    <DetailLabel>Bedtime Logged:</DetailLabel>
                    <DetailValue>{selectedLog.bedtime}</DetailValue>
                  </DetailDataRow>
                </>
              ) : (
                <View>
                  <DetailLabel style={{ fontStyle: 'italic', marginBottom: 4 }}>No sleep logs tracked for this day.</DetailLabel>
                  <AddLogBtn onPress={handleLogSimulatedSession}>
                    <AddLogBtnText>+ Log Simulated Sleep Session</AddLogBtnText>
                  </AddLogBtn>
                </View>
              )}
            </DetailPanel>

            <CloseModalBtn onPress={() => setShowCalendarModal(false)}>
              <CloseModalBtnText>Close</CloseModalBtnText>
            </CloseModalBtn>
          </CalendarModalCard>
        </ModalOverlay>
      </Modal>

    </Container>
  );
};
