import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated as RNAnimated, Dimensions, ScrollView, TouchableOpacity, View, Text, Pressable, PanResponder, Platform, Vibration } from 'react-native';
import styled from 'styled-components/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { Play, Pause, RotateCcw, Clock, PieChart, BarChart2, Star, Briefcase, Book, Sparkles, Dumbbell, Code, Smile, Settings, Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import {
  setTimerMode,
  setAnimationStyle,
  setActiveSubScreen,
  startTimer,
  startSession,
  togglePlayback,
  stopTimer,
  stopSession,
  resumeSession,
  advancePhase,
  setFocusType,
  setPomoFocusDuration,
  setPomoBreakDuration,
  setAlertPreference,
  setFocusCategory,
  setSessionTotalSeconds,
} from '../store/audioSlice';
import { GlassCard } from '../components/GlassCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// PHASE-CHANGE NOTIFICATION: vibration + audio beep
// ---------------------------------------------------------------------------
let _audioBeep: any = null;
const triggerPhaseNotification = async () => {
  try {
    // Web vibration
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    // React Native vibration
    Vibration.vibrate([200, 100, 200]);
    // Audio beep via expo-av
    const { Audio } = require('expo-av');
    if (!_audioBeep) {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' },
        { shouldPlay: false, volume: 0.6 }
      );
      _audioBeep = sound;
    }
    await _audioBeep.replayAsync();
  } catch (e) {
    // Silently fail if audio isn't available
  }
};

const CATEGORY_ITEMS = [
  { id: 'Work', label: 'Work 💻' },
  { id: 'Study', label: 'Study 📚' },
  { id: 'Meditate', label: 'Meditate 🧘' },
  { id: 'Fitness', label: 'Fitness 🏃' },
  { id: 'Code', label: 'Code ⚡' },
  { id: 'Relax', label: 'Relax 🍃' }
];

// -------------------------------------------------------------
// STANDALONE AMBIENT ANIMATION COMPONENTS
// -------------------------------------------------------------

const FloatingBubble: React.FC<{ size: number; color: string; startX: number; startY: number }> = ({ size, color, startX, startY }) => {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);

  useEffect(() => {
    transX.value = withRepeat(
      withTiming(Math.random() * 60 - 30, { duration: 6000 + Math.random() * 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transY.value = withRepeat(
      withTiming(Math.random() * 100 - 50, { duration: 7000 + Math.random() * 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: transX.value }, { translateY: transY.value }],
  }));

  return (
    <AnimatedBubble
      style={[
        animStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          top: startY,
        },
      ]}
    />
  );
};

export const AmbientFloatingOrbs: React.FC = () => {
  return (
    <AbsoluteCanvas pointerEvents="none">
      <FloatingBubble size={160} color="rgba(255, 126, 71, 0.06)" startX={SCREEN_WIDTH * 0.1} startY={SCREEN_HEIGHT * 0.25} />
      <FloatingBubble size={200} color="rgba(0, 242, 254, 0.04)" startX={SCREEN_WIDTH * 0.55} startY={SCREEN_HEIGHT * 0.35} />
      <FloatingBubble size={120} color="rgba(255, 208, 67, 0.05)" startX={SCREEN_WIDTH * 0.2} startY={SCREEN_HEIGHT * 0.6} />
      <FloatingBubble size={180} color="rgba(78, 205, 196, 0.03)" startX={SCREEN_WIDTH * 0.6} startY={SCREEN_HEIGHT * 0.15} />
    </AbsoluteCanvas>
  );
};

const PulsingRing: React.FC<{ maxScale: number }> = ({ maxScale }) => {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(maxScale, { duration: 4000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 4000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <AnimatedRing style={[animStyle]} />;
};

export const RadarWaveBackground: React.FC = () => {
  return (
    <AbsoluteCanvas pointerEvents="none" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <PulsingRing maxScale={1.8} />
      <PulsingRing maxScale={2.4} />
      <PulsingRing maxScale={3.0} />
    </AbsoluteCanvas>
  );
};

// -------------------------------------------------------------
// STANDALONE AMBIENT FLIP CARD DIGITS
// Uses React Native Animated (not Reanimated) with scaleY for
// reliable web+native flip without overflow:hidden clipping bugs
// -------------------------------------------------------------

interface FlipCardDigitsProps {
  digits: string;
  triggerVal: any;
  label: string;
  interactive: boolean;
  showGear: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

const FlipCardDigits = React.memo<FlipCardDigitsProps>(
  ({ digits, triggerVal, label, interactive, showGear, onIncrement, onDecrement }) => {
    const [displayTop, setDisplayTop] = useState(digits);
    const [displayBottom, setDisplayBottom] = useState(digits);
    const [nextDigit, setNextDigit] = useState(digits);
    const isFirstRender = useRef(true);
    const animTop = useRef(new RNAnimated.Value(1)).current;
    const animBottom = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      // Capture current shown value as prev before updating
      const prev = displayTop;
      setNextDigit(digits);

      // Phase 1: fold the top flap down (prev digit disappears from top)
      animTop.setValue(1);
      RNAnimated.timing(animTop, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start(() => {
        // Mid-point: swap top background and bottom flap to new digit
        setDisplayTop(digits);
        setDisplayBottom(digits);
        // Phase 2: unfold the bottom flap (new digit appears from bottom)
        animBottom.setValue(0);
        RNAnimated.timing(animBottom, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();
      });
    }, [triggerVal]);

    // Top flap: pivots from bottom edge. translateY(+H/2) scale translateY(-H/2)
    // H = 55 (half card). Center = 27.5
    const topFlapStyle = {
      transform: [
        { translateY: 27.5 },
        { scaleY: animTop },
        { translateY: -27.5 },
      ],
    };

    // Bottom flap: pivots from top edge. translateY(-H/2) scale translateY(+H/2)
    const bottomFlapStyle = {
      transform: [
        { translateY: -27.5 },
        { scaleY: animBottom },
        { translateY: 27.5 },
      ],
    };

    return (
      <CardOuterContainer>
        <SplitCardContainer>
          {/* Static background top — shows current digit top half */}
          <CardHalfTop>
            <FlipNumberText numberOfLines={1}>{displayTop}</FlipNumberText>
          </CardHalfTop>

          {/* Static background bottom — shows current digit bottom half */}
          <CardHalfBottom>
            <FlipNumberText numberOfLines={1} style={{ top: -55 }}>{displayBottom}</FlipNumberText>
          </CardHalfBottom>

          {/* Animated top flap — folds away (shows prev digit top half) */}
          <RNAnimated.View style={[{ position: 'absolute', top: 0, left: 0, width: 90, height: 55, overflow: 'hidden', zIndex: 3,
            borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: '#121217',
            borderWidth: 1.5, borderColor: '#1E1E26', borderBottomWidth: 0 }, topFlapStyle]}>
            <FlipNumberText numberOfLines={1}>{displayTop}</FlipNumberText>
          </RNAnimated.View>

          {/* Animated bottom flap — unfolds in (shows new digit bottom half) */}
          <RNAnimated.View style={[{ position: 'absolute', bottom: 0, left: 0, width: 90, height: 55, overflow: 'hidden', zIndex: 3,
            borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: '#121217',
            borderWidth: 1.5, borderColor: '#1E1E26', borderTopWidth: 0 }, bottomFlapStyle]}>
            <FlipNumberText numberOfLines={1} style={{ top: -55 }}>{nextDigit}</FlipNumberText>
          </RNAnimated.View>

          {/* Divider Line */}
          <DividerLine />

          {/* Interactive chevrons for pre-start adjustment */}
          {interactive && (
            <AbsoluteCanvas style={{ zIndex: 10 }}>
              <InteractiveHalfTop onPress={onIncrement} activeOpacity={0.7}>
                <ChevronUp size={16} color="rgba(255, 126, 71, 0.4)" />
              </InteractiveHalfTop>
              <InteractiveHalfBottom onPress={onDecrement} activeOpacity={0.7}>
                <ChevronDown size={16} color="rgba(255, 126, 71, 0.4)" />
              </InteractiveHalfBottom>
            </AbsoluteCanvas>
          )}
        </SplitCardContainer>
        <CardBottomLabel>{label}</CardBottomLabel>

        {/* Gear outside card — SwipeDial replaces static knob */}
        {showGear && (
          <SwipeDial onIncrement={onIncrement} onDecrement={onDecrement} />
        )}
      </CardOuterContainer>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.digits === nextProps.digits &&
      prevProps.triggerVal === nextProps.triggerVal &&
      prevProps.interactive === nextProps.interactive &&
      prevProps.showGear === nextProps.showGear &&
      prevProps.label === nextProps.label
    );
  }
);

// -------------------------------------------------------------
// SWIPE DIAL — PanResponder gear knob (drag up = increment, drag down = decrement)
// Works on web (mouse drag) + iOS/Android (touch drag)
// -------------------------------------------------------------
const SwipeDial: React.FC<{ onIncrement?: () => void; onDecrement?: () => void }> = ({ onIncrement, onDecrement }) => {
  const lastDy = useRef(0);
  const STEP = 10; // px per increment step

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastDy.current = 0;
      },
      onPanResponderMove: (_, gs) => {
        const delta = gs.dy - lastDy.current;
        if (Math.abs(delta) >= STEP) {
          const steps = Math.floor(Math.abs(delta) / STEP);
          if (delta < 0) {
            // Dragging up → increment
            for (let i = 0; i < steps; i++) onIncrement?.();
          } else {
            // Dragging down → decrement
            for (let i = 0; i < steps; i++) onDecrement?.();
          }
          lastDy.current += steps * (delta < 0 ? -STEP : STEP);
        }
      },
      onPanResponderRelease: () => {
        lastDy.current = 0;
      },
    })
  ).current;

  return (
    <View style={{ position: 'absolute', right: -18, top: 28, width: 24, height: 54, alignItems: 'center', justifyContent: 'center', zIndex: 20 } as any}
      {...panResponder.panHandlers}>
      <GearDialKnob style={{ position: 'relative', right: 0, top: 0, cursor: 'ns-resize' } as any}>
        <GearDialStripe />
        <GearDialStripe style={{ marginTop: 3 }} />
        <GearDialStripe style={{ marginTop: 3 }} />
        <GearDialStripe style={{ marginTop: 3 }} />
        <GearDialStripe style={{ marginTop: 3 }} />
      </GearDialKnob>
    </View>
  );
};

// -------------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------------

export const FocusTimerTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    timerIsActive,
    timerTimeLeft,
    timerDuration,
    isPlaying,
    timerMode,
    animationStyle,
    activeSubScreen,
    completedPomodorosCount,
    totalFocusSeconds,
    weeklyFocusMinutes,
    focusType,
    pomoFocusDuration,
    pomoBreakDuration,
    alertPreference,
    focusCategory,
    sessionTotalSeconds,
    sessionElapsedSeconds,
    currentPhase,
    sessionActive,
  } = useAppSelector((state) => state.audio);

  const [showDropdown, setShowDropdown] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const prevTimerActiveRef = useRef(timerIsActive);

  // Auto-advance phase ONLY when timer naturally hits 0 (not on pause)
  useEffect(() => {
    // timerTimeLeft must be 0 to confirm natural completion (not a pause)
    if (prevTimerActiveRef.current && !timerIsActive && sessionActive && timerTimeLeft === 0) {
      // Play notification then advance
      triggerPhaseNotification();
      const t = setTimeout(() => dispatch(advancePhase()), 800);
      return () => clearTimeout(t);
    }
    prevTimerActiveRef.current = timerIsActive;
  }, [timerIsActive, sessionActive]);

  useEffect(() => {
    if (!timerIsActive) {
      const updateTime = () => {
        const now = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = now.getDate().toString().padStart(2, '0');
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const timeStr = now.toLocaleTimeString('en-US', { hour12: true });
        setCurrentDateTime(`${day}-${month}-${year} at ${timeStr}`);
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [timerIsActive]);

  // Compute hours, minutes, seconds for three-card display
  const hours = Math.floor(timerTimeLeft / 3600);
  const minutes = Math.floor((timerTimeLeft % 3600) / 60);
  const seconds = timerTimeLeft % 60;

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  const handleStartPause = () => {
    if (timerIsActive || (sessionActive && isPlaying)) {
      // Pause: keep timerIsActive false but session stays active
      dispatch(togglePlayback());
    } else if (sessionActive && !isPlaying) {
      // Resume paused session — restart timer with remaining time
      dispatch(resumeSession());
    } else {
      // Start a fresh session
      dispatch(startSession({
        focusDuration: pomoFocusDuration,
        sessionTotal: sessionTotalSeconds,
      }));
    }
  };

  const handleReset = () => {
    dispatch(stopSession());
  };

  // Format seconds as HH:MM:SS or MM:SS
  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
    return `${m.toString().padStart(2,'0')}m ${s.toString().padStart(2,'0')}s`;
  };

  const handleModeChange = (mode: 'pomo' | 'short_break' | 'long_break') => {
    dispatch(setTimerMode(mode));
  };

  // Adjusters for 3-card interactive layout (Updates Redux & Syncs widget)
  const incrementHours = () => {
    const nextDuration = pomoFocusDuration + 3600;
    dispatch(setPomoFocusDuration(Math.min(359900, nextDuration)));
  };

  const decrementHours = () => {
    const nextDuration = Math.max(60, pomoFocusDuration - 3600);
    dispatch(setPomoFocusDuration(nextDuration));
  };

  const incrementMinutes = () => {
    const nextDuration = pomoFocusDuration + 60;
    dispatch(setPomoFocusDuration(Math.min(359900, nextDuration)));
  };

  const decrementMinutes = () => {
    const nextDuration = Math.max(60, pomoFocusDuration - 60);
    dispatch(setPomoFocusDuration(nextDuration));
  };

  const incrementSeconds = () => {
    const nextDuration = pomoFocusDuration + 5;
    dispatch(setPomoFocusDuration(Math.min(359900, nextDuration)));
  };

  const decrementSeconds = () => {
    const nextDuration = Math.max(5, pomoFocusDuration - 5);
    dispatch(setPomoFocusDuration(nextDuration));
  };

  const adjustFocusTime = (step: number) => {
    const nextDuration = pomoFocusDuration + step * 60;
    dispatch(setPomoFocusDuration(Math.max(60, Math.min(359900, nextDuration))));
  };

  const adjustBreakTime = (step: number) => {
    const nextDuration = pomoBreakDuration + step * 60;
    dispatch(setPomoBreakDuration(Math.max(60, Math.min(359900, nextDuration))));
  };

  return (
    <Container>
      <HeaderBar>
        <HeaderTitle>Focus Timer</HeaderTitle>
      </HeaderBar>

      {activeSubScreen === 'timer' && (
        <SubContainer>
          {/* Ambient Backgrounds */}
          {animationStyle === 'falling' && <AmbientFloatingOrbs />}
          {animationStyle === 'orb' && <RadarWaveBackground />}

          {/* Toggle Tab Selectors - Auto Hides during session */}
          {!sessionActive && (
            <FocusTypeTabs>
              <TypeTab active={focusType === 'pomodoro'} onPress={() => dispatch(setFocusType('pomodoro'))}>
                <TypeTabText active={focusType === 'pomodoro'}>Pomodoro Mode</TypeTabText>
              </TypeTab>
              <TypeTab active={focusType === 'quick'} onPress={() => dispatch(setFocusType('quick'))}>
                <TypeTabText active={focusType === 'quick'}>Countdown</TypeTabText>
              </TypeTab>
            </FocusTypeTabs>
          )}

          {/* Pomo focus/break indicators - Always visible in pomodoro mode, read-only during active session */}
          {focusType === 'pomodoro' && (
            <ModeSelectorsHeader>
              <PhaseIndicator active={currentPhase === 'focus' || !sessionActive}>
                <PhaseIndicatorText active={currentPhase === 'focus' || !sessionActive}>
                  Focus ({Math.floor(pomoFocusDuration / 60)}m)
                </PhaseIndicatorText>
              </PhaseIndicator>
              <PhaseIndicator active={sessionActive && currentPhase === 'break'}>
                <PhaseIndicatorText active={sessionActive && currentPhase === 'break'}>
                  Break ({Math.floor(pomoBreakDuration / 60)}m)
                </PhaseIndicatorText>
              </PhaseIndicator>
            </ModeSelectorsHeader>
          )}

          {/* TIMER CONTENT AREA */}
          <TimerContentArea>
            {!sessionActive && animationStyle === 'flip' && (
              <DateTimeText>{currentDateTime}</DateTimeText>
            )}

            {animationStyle === 'flip' ? (
              /* Three-Card vintage style: HOUR, MIN, SEC (Image 2) */
              <ThreeCardRow>
                <FlipCardDigits
                  digits={hoursStr}
                  triggerVal={hoursStr}
                  label="HOUR"
                  interactive={!timerIsActive}
                  showGear={!timerIsActive}
                  onIncrement={incrementHours}
                  onDecrement={decrementHours}
                />
                {timerIsActive ? <FlipColon>:</FlipColon> : <GearGap />}
                <FlipCardDigits
                  digits={minutesStr}
                  triggerVal={minutesStr}
                  label="MIN"
                  interactive={!timerIsActive}
                  showGear={!timerIsActive}
                  onIncrement={incrementMinutes}
                  onDecrement={decrementMinutes}
                />
                {timerIsActive ? <FlipColon>:</FlipColon> : <GearGap />}
                <FlipCardDigits
                  digits={secondsStr}
                  triggerVal={secondsStr}
                  label="SEC"
                  interactive={!timerIsActive}
                  showGear={!timerIsActive}
                  onIncrement={incrementSeconds}
                  onDecrement={decrementSeconds}
                />
              </ThreeCardRow>
            ) : (
              <SimpleTimerText>{hours > 0 ? `${hoursStr}:${minutesStr}:${secondsStr}` : `${minutesStr}:${secondsStr}`}</SimpleTimerText>
            )}

            {/* Category horizontal list - Auto Hides during session */}
            {!sessionActive && (
              <CategoryScrollContainer>
                <CategoryScroll horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORY_ITEMS.map((item) => (
                    <CategoryPill
                      key={item.id}
                      active={focusCategory === item.id}
                      onPress={() => dispatch(setFocusCategory(item.id))}
                    >
                      <CategoryPillText active={focusCategory === item.id}>{item.label}</CategoryPillText>
                    </CategoryPill>
                  ))}
                </CategoryScroll>
              </CategoryScrollContainer>
            )}

            {/* Theme buttons adjacent below the categories row */}
            {!sessionActive && (
              <ThemeSelectionRow>
                {(['flip', 'falling', 'orb'] as const).map((style) => (
                  <ThemeButton
                    key={style}
                    active={animationStyle === style}
                    onPress={() => dispatch(setAnimationStyle(style))}
                  >
                    <ThemeButtonText active={animationStyle === style}>
                      {style === 'flip' ? 'Flip Clock 🕰️' : style === 'falling' ? 'Bubble Orbs 🫧' : 'Radar waves 📡'}
                    </ThemeButtonText>
                  </ThemeButton>
                ))}
              </ThemeSelectionRow>
            )}
          </TimerContentArea>

          {/* Small button settings gear - Auto Hides on Start */}
          {!sessionActive && (
            <SettingsIconPill onPress={() => setShowDropdown(true)}>
              <Settings size={15} color="#FF7E47" />
              <SettingsIconText>Settings</SettingsIconText>
            </SettingsIconPill>
          )}

          {/* Elapsed session time shown above start/pause button during session */}
          {sessionActive && (
            <ElapsedTimeRow>
              <ElapsedTimeLabel>Session: {formatElapsed(sessionElapsedSeconds)} / {Math.floor(sessionTotalSeconds / 60)}m</ElapsedTimeLabel>
            </ElapsedTimeRow>
          )}

          {/* Semi-transparent dropdown panel located right below options */}
          {!sessionActive && showDropdown && (
            <BackdropPressable onPress={() => setShowDropdown(false)}>
              <DropdownOverlayCard onStartShouldSetResponder={() => true}>
                <DropdownHeader>
                  <DropdownTitleText>Focus Settings</DropdownTitleText>
                  <DonePillButton onPress={() => setShowDropdown(false)}>
                    <DonePillText>DONE</DonePillText>
                  </DonePillButton>
                </DropdownHeader>

                <ConfigSection>
                  <ConfigRow>
                    <ConfigLabelText>Session Length:</ConfigLabelText>
                    <StepperRow>
                      <StepperButton onPress={() => dispatch(setSessionTotalSeconds(Math.max(900, sessionTotalSeconds - 900)))}>
                        <Minus size={12} color="#FFFFFF" />
                      </StepperButton>
                      <StepperValueText>{Math.floor(sessionTotalSeconds / 60)} min</StepperValueText>
                      <StepperButton onPress={() => dispatch(setSessionTotalSeconds(Math.min(28800, sessionTotalSeconds + 900)))}>
                        <Plus size={12} color="#FFFFFF" />
                      </StepperButton>
                    </StepperRow>
                  </ConfigRow>

                  <ConfigRow style={{ marginTop: 14 }}>
                    <ConfigLabelText>Focus Block:</ConfigLabelText>
                    <StepperRow>
                      <StepperButton onPress={() => adjustFocusTime(-5)}>
                        <Minus size={12} color="#FFFFFF" />
                      </StepperButton>
                      <StepperValueText>{Math.floor(pomoFocusDuration / 60)} min</StepperValueText>
                      <StepperButton onPress={() => adjustFocusTime(5)}>
                        <Plus size={12} color="#FFFFFF" />
                      </StepperButton>
                    </StepperRow>
                  </ConfigRow>

                  <ConfigRow style={{ marginTop: 14 }}>
                    <ConfigLabelText>Break Block:</ConfigLabelText>
                    <StepperRow>
                      <StepperButton onPress={() => adjustBreakTime(-1)}>
                        <Minus size={12} color="#FFFFFF" />
                      </StepperButton>
                      <StepperValueText>{Math.floor(pomoBreakDuration / 60)} min</StepperValueText>
                      <StepperButton onPress={() => adjustBreakTime(1)}>
                        <Plus size={12} color="#FFFFFF" />
                      </StepperButton>
                    </StepperRow>
                  </ConfigRow>

                  <ConfigRow style={{ marginTop: 14 }}>
                    <ConfigLabelText>Alert Sound:</ConfigLabelText>
                    <OptionSelectionRow>
                      {(['sound', 'haptic', 'both', 'none'] as const).map((alert) => (
                        <OptionBtn
                          key={alert}
                          active={alertPreference === alert}
                          onPress={() => dispatch(setAlertPreference(alert))}
                        >
                          <OptionText active={alertPreference === alert}>
                            {alert === 'sound' ? 'Sound' : alert === 'haptic' ? 'Haptic' : alert === 'both' ? 'Both' : 'None'}
                          </OptionText>
                        </OptionBtn>
                      ))}
                    </OptionSelectionRow>
                  </ConfigRow>

                 </ConfigSection>
              </DropdownOverlayCard>
            </BackdropPressable>
          )}

          {/* Action buttons */}
          <ControlsArea>
            <StartButton onPress={handleStartPause}>
              {timerIsActive && isPlaying ? (
                <>
                  <Pause size={20} color="#08080A" fill="#08080A" />
                  <StartButtonText>Pause {currentPhase === 'focus' ? 'Focus' : 'Break'}</StartButtonText>
                </>
              ) : (
                <>
                  <Play size={20} color="#08080A" fill="#08080A" style={{ marginLeft: 2 }} />
                  <StartButtonText>{sessionActive ? (currentPhase === 'focus' ? 'Resume Focus' : 'Resume Break') : 'Start Focus'}</StartButtonText>
                </>
              )}
            </StartButton>

            {(timerIsActive || sessionActive) && (
              <ResetButton onPress={handleReset}>
                <RotateCcw size={18} color="#FFFFFF" />
              </ResetButton>
            )}
          </ControlsArea>
        </SubContainer>
      )}

      {activeSubScreen === 'stats' && (
        <SubContainerScroll contentContainerStyle={{ paddingBottom: 160 }}>
          <StatsHeaderRow>
            <StatsHeaderTitle>Focus Stats</StatsHeaderTitle>
            <StatsFilterGroup>
              {['D', 'W', 'M', 'Y'].map((f) => (
                <FilterPill key={f} active={f === 'D'}>
                  <FilterPillText active={f === 'D'}>{f}</FilterPillText>
                </FilterPill>
              ))}
            </StatsFilterGroup>
          </StatsHeaderRow>

          <StatsRowGrid>
            <StatsMiniCard>
              <StatsValueLabel>Total Pomodoros</StatsValueLabel>
              <StatsBigNumber>🍅 {completedPomodorosCount}</StatsBigNumber>
            </StatsMiniCard>
            <StatsMiniCard>
              <StatsValueLabel>Total Days Active</StatsValueLabel>
              <StatsBigNumber>18</StatsBigNumber>
            </StatsMiniCard>
          </StatsRowGrid>

          <StatsMiniCard style={{ width: '100%', marginTop: 12 }}>
            <StatsValueLabel>Today's Focus Time</StatsValueLabel>
            <StatsBigNumber>12h 45m</StatsBigNumber>
            <StatsValueLabel style={{ marginTop: 12 }}>Total Focus Accumulated</StatsValueLabel>
            <StatsBigNumber>{Math.floor(totalFocusSeconds / 3600)}h 42m</StatsBigNumber>
          </StatsMiniCard>

          <StatsHeaderTitle style={{ marginTop: 24, marginBottom: 12 }}>Category Breakdown</StatsHeaderTitle>
          <StatsGroupCard>
            <CategoryProgressRow>
              <ProgressLabelInfo>
                <ProgressText>English</ProgressText>
                <ProgressVal>50% (4h)</ProgressVal>
              </ProgressLabelInfo>
              <ProgressBarContainer>
                <ProgressBarFill percent={50} color="#FF7E47" />
              </ProgressBarContainer>
            </CategoryProgressRow>
            <CategoryProgressRow>
              <ProgressLabelInfo>
                <ProgressText>Reading</ProgressText>
                <ProgressVal>30% (2h 24m)</ProgressVal>
              </ProgressLabelInfo>
              <ProgressBarContainer>
                <ProgressBarFill percent={30} color="#FFB347" />
              </ProgressBarContainer>
            </CategoryProgressRow>
          </StatsGroupCard>
        </SubContainerScroll>
      )}

      {activeSubScreen === 'trend' && (
        <SubContainerScroll contentContainerStyle={{ paddingBottom: 160 }}>
          <SummaryTitleRow>
            <SummaryTitle>Summary</SummaryTitle>
            <SummaryBadge><SummaryBadgeText>BETA</SummaryBadgeText></SummaryBadge>
          </SummaryTitleRow>
          <SummaryDateSub>Jul 5, Today</SummaryDateSub>

          <StatsRowGrid>
            <StatsMiniCard>
              <StatsValueLabel>Total Pomodoros</StatsValueLabel>
              <StatsBigNumber>🍅 {completedPomodorosCount}</StatsBigNumber>
            </StatsMiniCard>
            <StatsMiniCard>
              <StatsValueLabel>Total Focus Hours</StatsValueLabel>
              <StatsBigNumber>1540 h</StatsBigNumber>
            </StatsMiniCard>
          </StatsRowGrid>

          <FocusTrendSection>
            <SectionSubtitle>Focus Trend</SectionSubtitle>
            <StatsGroupCard style={{ padding: 20 }}>
              <TrendHeaderStatRow>
                <TrendStatBox>
                  <TrendStatLabel>Today's Focus</TrendStatLabel>
                  <TrendStatVal>6h 35m</TrendStatVal>
                  <TrendChange positive={true}>▲ 20%</TrendChange>
                </TrendStatBox>
                <TrendStatBox>
                  <TrendStatLabel>This Week</TrendStatLabel>
                  <TrendStatVal>40h 27m</TrendStatVal>
                  <TrendChange positive={false}>▼ 5%</TrendChange>
                </TrendStatBox>
              </TrendHeaderStatRow>

              <ChartAreaRow>
                {weeklyFocusMinutes.map((mins, idx) => {
                  const percentHeight = Math.max(8, (mins / Math.max(...weeklyFocusMinutes, 1)) * 80);
                  return (
                    <ChartBarColumn key={idx}>
                      <ChartBarContainer>
                        <ChartBarFill height={percentHeight} />
                      </ChartBarContainer>
                      <ChartBarLabel>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][idx]}</ChartBarLabel>
                    </ChartBarColumn>
                  );
                })}
              </ChartAreaRow>
            </StatsGroupCard>
          </FocusTrendSection>
        </SubContainerScroll>
      )}

      {/* Navigation Stack */}
      <VerticalNavStack pointerEvents="box-none">
        <NavCircleButton active={activeSubScreen === 'timer'} onPress={() => dispatch(setActiveSubScreen('timer'))}>
          <Clock size={18} color={activeSubScreen === 'timer' ? '#08080A' : '#FFFFFF'} />
        </NavCircleButton>
        <NavCircleButton active={activeSubScreen === 'stats'} onPress={() => dispatch(setActiveSubScreen('stats'))}>
          <PieChart size={18} color={activeSubScreen === 'stats' ? '#08080A' : '#FFFFFF'} />
        </NavCircleButton>
        <NavCircleButton active={activeSubScreen === 'trend'} onPress={() => dispatch(setActiveSubScreen('trend'))}>
          <BarChart2 size={18} color={activeSubScreen === 'trend' ? '#08080A' : '#FFFFFF'} />
        </NavCircleButton>
      </VerticalNavStack>
    </Container>
  );
};

// -------------------------------------------------------------
// STYLED COMPONENTS
// -------------------------------------------------------------

const Container = styled.View`
  flex: 1;
  background-color: transparent;
  position: relative;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
  z-index: 10;
`;

const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 0.5px;
`;

const SubContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 120px;
  padding-horizontal: 20px;
  z-index: 5;
`;

const SubContainerScroll = styled.ScrollView`
  flex: 1;
  padding: 10px 20px;
  z-index: 5;
`;

const AbsoluteCanvas = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
`;

const AnimatedBubble = Animated.createAnimatedComponent(styled.View`
  position: absolute;
  shadow-opacity: 0.1;
  shadow-radius: 20px;
  pointer-events: none;
`);

const AnimatedRing = Animated.createAnimatedComponent(styled.View`
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 70px;
  border-width: 1.5px;
  border-color: #FF7E47;
  shadow-color: #FF7E47;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  pointer-events: none;
`);

const FocusTypeTabs = styled.View`
  flex-direction: row;
  background-color: rgba(17, 17, 22, 0.65);
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 12px;
`;

const TypeTab = styled.TouchableOpacity<{ active: boolean }>`
  padding: 6px 14px;
  border-radius: 8px;
  background-color: ${props => props.active ? '#FF7E47' : 'transparent'};
`;

const TypeTabText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080A' : '#B8B0D0'};
  font-size: 11px;
  font-weight: bold;
`;

const ModeSelectorsHeader = styled.View`
  flex-direction: row;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 10px;
`;

const ModeTab = styled.TouchableOpacity<{ active: boolean }>`
  padding: 5px 12px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'transparent'};
`;

const ModeTabText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#6B6280'};
  font-size: 10px;
  font-weight: bold;
`;

// Phase indicators (non-interactive) - replace the old ModeTab during active session
const PhaseIndicator = styled.View<{ active: boolean }>`
  padding: 5px 16px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.18)' : 'rgba(255,255,255,0.04)'};
  border-width: 1.5px;
  border-color: ${props => props.active ? 'rgba(255, 126, 71, 0.5)' : 'rgba(255,255,255,0.08)'};
`;

const PhaseIndicatorText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#3D3650'};
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
`;

const ElapsedTimeRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
`;

const ElapsedTimeLabel = styled.Text`
  color: rgba(255, 126, 71, 0.7);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const TimerContentArea = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  min-height: 240px;
`;

const SimpleTimerText = styled.Text`
  color: #FFFFFF;
  font-size: 80px;
  font-weight: 800;
  letter-spacing: -2px;
`;

// THREE-CARD FLIP CLOCK LAYOUT (Image 2)
const ThreeCardRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const FlipColon = styled.Text`
  color: #E2E2E8;
  font-size: 48px;
  font-weight: 800;
  width: 24px;
  text-align: center;
  margin-top: 26px;
`;

const GearGap = styled.View`
  width: 24px;
`;

const DateTimeText = styled.Text`
  color: #B8B0D0;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  letter-spacing: 1px;
`;

const CardWithGearContainer = styled.View`
  flex-direction: row;
  align-items: flex-start;
`;

const CardOuterContainer = styled.View`
  align-items: center;
`;

const SplitCardContainer = styled.View`
  width: 90px;
  height: 110px;
  position: relative;
  shadow-color: #000;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.5;
  shadow-radius: 8px;
  elevation: 8;
`;

const CardContentWrapper = styled.View`
  width: 90px;
  height: 110px;
  justify-content: center;
  align-items: center;
  position: absolute;
`;

const CardHalf = styled.View`
  position: absolute;
  left: 0;
  width: 90px;
  height: 55px;
  overflow: hidden;
  background-color: #121217;
  border-width: 1.5px;
  border-color: #1E1E26;
`;

const CardHalfTop = styled(CardHalf)`
  top: 0;
  border-bottom-width: 0px;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
`;

const CardHalfBottom = styled(CardHalf)`
  bottom: 0;
  border-top-width: 0px;
  border-bottom-left-radius: 14px;
  border-bottom-right-radius: 14px;
`;

const AnimatedHalfTop = Animated.createAnimatedComponent(styled(CardHalfTop)`
  position: absolute;
  top: 0;
  z-index: 5;
  backface-visibility: hidden;
`);

const AnimatedHalfBottom = Animated.createAnimatedComponent(styled(CardHalfBottom)`
  position: absolute;
  bottom: 0;
  z-index: 5;
  backface-visibility: hidden;
`);

const DividerLine = styled.View`
  position: absolute;
  width: 100%;
  height: 1.5px;
  background-color: #08080A;
  top: 54.25px;
  left: 0;
  z-index: 15;
`;

const FlipNumberText = styled.Text`
  color: #E2E2E8;
  font-size: 64px;
  font-weight: 800;
  text-align: center;
  line-height: 110px;
  height: 110px;
  width: 90px;
  position: absolute;
  top: 0;
  left: 0;
`;

const CardBottomLabel = styled.Text`
  color: #6B6280;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1px;
  margin-top: 8px;
`;

// Gear Knob layout (Image 2)
const GearDialKnob = styled.View`
  position: absolute;
  right: -14px;
  top: 36px;
  width: 7px;
  height: 38px;
  background-color: #25252D;
  border-radius: 3px;
  border-width: 1px;
  border-color: #3C3C47;
  padding-vertical: 2px;
  align-items: center;
  z-index: 20;
`;

const GearDialStripe = styled.View`
  width: 4px;
  height: 1.5px;
  background-color: #555566;
`;

// Touch Regions for tapping up/down adjustments (Image 3)
const InteractiveHalfTop = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  width: 100%;
  height: 50%;
  justify-content: flex-start;
  align-items: center;
  padding-top: 4px;
  z-index: 30;
`;

const InteractiveHalfBottom = styled.TouchableOpacity`
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 50%;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 4px;
  z-index: 30;
`;

const CategoryScrollContainer = styled.View`
  width: ${SCREEN_WIDTH - 40}px;
  margin-top: 28px;
  height: 40px;
`;

const CategoryScroll = styled.ScrollView`
  flex-direction: row;
`;

const CategoryPill = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'rgba(17, 17, 22, 0.65)'};
  border-width: 1px;
  border-color: ${props => props.active ? '#FF7E47' : '#1E1E26'};
  border-radius: 12px;
  padding: 6px 14px;
  margin-right: 8px;
  justify-content: center;
  align-items: center;
  height: 32px;
`;

const CategoryPillText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#B8B0D0'};
  font-size: 11px;
  font-weight: bold;
`;

const ThemeSelectionRow = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 6px;
  width: ${SCREEN_WIDTH - 40}px;
`;

const ThemeButton = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'rgba(17, 17, 22, 0.65)'};
  border-width: 1px;
  border-color: ${props => props.active ? '#FF7E47' : '#1E1E26'};
  border-radius: 12px;
  padding: 6px 14px;
  margin-horizontal: 4px;
  justify-content: center;
  align-items: center;
  height: 32px;
  flex: 1;
`;

const ThemeButtonText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#B8B0D0'};
  font-size: 11px;
  font-weight: bold;
`;

// Small Setting icon pill (closes bottom drawer, opens inline dropdown)
const SettingsIconPill = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: rgba(17, 17, 22, 0.65);
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 10px;
  padding: 6px 12px;
  margin-top: 8px;
  margin-bottom: 12px;
  z-index: 10;
`;

const SettingsIconText = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: bold;
  margin-left: 6px;
`;

// Semi-transparent Dropdown Panel (closes on outside clicks)
const BackdropPressable = styled.Pressable`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(8, 8, 10, 0.2);
  justify-content: center;
  align-items: center;
  z-index: 500;
`;

const DropdownOverlayCard = styled.View`
  background-color: rgba(20, 20, 25, 0.88);
  border-radius: 20px;
  border-width: 1.5px;
  border-color: #1E1E26;
  padding: 20px;
  width: 90%;
  shadow-color: #000;
  shadow-opacity: 0.6;
  shadow-radius: 12px;
  elevation: 20;
`;

const DropdownHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  border-bottom-width: 1px;
  border-bottom-color: #1E1E26;
  padding-bottom: 8px;
`;

const DropdownTitleText = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
`;

const DonePillButton = styled.TouchableOpacity`
  background-color: rgba(255, 126, 71, 0.12);
  padding: 4px 10px;
  border-radius: 8px;
  border-width: 1px;
  border-color: #FF7E47;
`;

const DonePillText = styled.Text`
  color: #FF7E47;
  font-size: 10px;
  font-weight: 800;
`;

const ConfigSection = styled.View``;

const ConfigRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ConfigLabelText = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
`;

const StepperRow = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #141419;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 8px;
  padding: 2px;
`;

const StepperButton = styled.TouchableOpacity`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background-color: #1E1E26;
  justify-content: center;
  align-items: center;
`;

const StepperValueText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  margin-horizontal: 10px;
  min-width: 48px;
  text-align: center;
`;

const OptionSelectionRow = styled.View`
  flex-direction: row;
`;

const OptionBtn = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'transparent'};
  border-width: 1px;
  border-color: ${props => props.active ? '#FF7E47' : '#1E1E26'};
  border-radius: 6px;
  padding: 4px 8px;
  margin-left: 6px;
`;

const OptionText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#B8B0D0'};
  font-size: 9px;
  font-weight: bold;
`;

// Controls
const ControlsArea = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 24px;
  z-index: 10;
`;

const StartButton = styled.TouchableOpacity`
  background-color: #FF7E47;
  padding: 14px 28px;
  border-radius: 14px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

const StartButtonText = styled.Text`
  color: #08080A;
  font-size: 14px;
  font-weight: bold;
  margin-left: 8px;
`;

const ResetButton = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  justify-content: center;
  align-items: center;
  margin-left: 12px;
`;

// Vertical Navigation Stack
const VerticalNavStack = styled.View`
  position: absolute;
  right: 16px;
  bottom: 160px;
  background-color: rgba(17, 17, 22, 0.8);
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 26px;
  padding: 6px;
  align-items: center;
  z-index: 1000;
  shadow-color: #000;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
  elevation: 10;
`;

const NavCircleButton = styled.TouchableOpacity<{ active: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${props => props.active ? '#FF7E47' : 'transparent'};
  justify-content: center;
  align-items: center;
  margin-vertical: 4px;
`;

// Stats styling
const StatsHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StatsHeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
`;

const StatsFilterGroup = styled.View`
  flex-direction: row;
  background-color: #111116;
  border-radius: 10px;
  padding: 2px;
`;

const FilterPill = styled.TouchableOpacity<{ active: boolean }>`
  padding: 4px 10px;
  border-radius: 8px;
  background-color: ${props => props.active ? '#FF7E47' : 'transparent'};
`;

const FilterPillText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080A' : '#6B6280'};
  font-size: 10px;
  font-weight: 800;
`;

const StatsRowGrid = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const StatsMiniCard = styled(GlassCard)`
  width: 48%;
  padding: 14px;
`;

const StatsValueLabel = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatsBigNumber = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 800;
  margin-top: 4px;
`;

const StatsGroupCard = styled.View`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 16px;
  padding: 16px;
`;

const CategoryProgressRow = styled.View`
  margin-bottom: 14px;
`;

const ProgressLabelInfo = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const ProgressText = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: bold;
`;

const ProgressVal = styled.Text`
  color: #6B6280;
  font-size: 11px;
`;

const ProgressBarContainer = styled.View`
  height: 6px;
  border-radius: 3px;
  background-color: #08080A;
  width: 100%;
  overflow: hidden;
`;

const ProgressBarFill = styled.View<{ percent: number; color: string }>`
  height: 100%;
  width: ${props => props.percent}%;
  background-color: ${props => props.color};
  border-radius: 3px;
`;

const ProUpgradePill = styled.TouchableOpacity`
  background-color: #FF7E47;
  border-radius: 16px;
  flex-direction: row;
  padding: 14px;
  justify-content: center;
  align-items: center;
  margin-top: 24px;
`;

const ProButtonText = styled.Text`
  color: #08080A;
  font-size: 14px;
  font-weight: bold;
`;

// Trend styling
const SummaryTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
`;

const SummaryTitle = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 800;
`;

const SummaryBadge = styled.View`
  background-color: rgba(255, 126, 71, 0.12);
  border-width: 1px;
  border-color: #FF7E47;
  border-radius: 6px;
  padding: 2px 6px;
  margin-left: 8px;
`;

const SummaryBadgeText = styled.Text`
  color: #FF7E47;
  font-size: 8px;
  font-weight: 800;
`;

const SummaryDateSub = styled.Text`
  color: #6B6280;
  font-size: 12px;
  margin-bottom: 20px;
`;

const FocusTrendSection = styled.View`
  width: 100%;
`;

const SectionSubtitle = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
  margin-top: 24px;
  margin-bottom: 12px;
  margin-left: 2px;
`;

const TrendHeaderStatRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 18px;
`;

const TrendStatBox = styled.View`
  flex: 1;
`;

const TrendStatLabel = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
`;

const TrendStatVal = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: 800;
  margin-top: 2px;
`;

const TrendChange = styled.Text<{ positive: boolean }>`
  color: ${props => props.positive ? '#38EF7D' : '#FF6B6B'};
  font-size: 10px;
  font-weight: bold;
  margin-top: 2px;
`;

const ChartAreaRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  height: 100px;
  margin-top: 10px;
  padding-horizontal: 8px;
`;

const ChartBarColumn = styled.View`
  align-items: center;
  flex: 1;
`;

const ChartBarContainer = styled.View`
  height: 80px;
  width: 14px;
  border-radius: 7px;
  background-color: #08080A;
  justify-content: flex-end;
`;

const ChartBarFill = styled.View<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  background-color: #FF7E47;
  border-radius: 7px;
`;

const ChartBarLabel = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: bold;
  margin-top: 6px;
`;
