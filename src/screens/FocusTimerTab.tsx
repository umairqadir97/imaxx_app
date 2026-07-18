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
import { Play, Pause, RotateCcw, Clock, PieChart, BarChart2, Star, Briefcase, Book, Sparkles, Dumbbell, Code, Smile, Settings, Plus, Minus, ChevronUp, ChevronDown, X } from 'lucide-react-native';
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
// PHASE-CHANGE NOTIFICATION: vibration only (expo-av removed — was crashing)
// ---------------------------------------------------------------------------
const triggerPhaseNotification = async () => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    Vibration.vibrate([200, 100, 200]);
  } catch (e) {
    // Silently fail
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
      withTiming(Math.random() * 60 - 30, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    transY.value = withRepeat(
      withTiming(Math.random() * 100 - 50, { duration: 3500 + Math.random() * 1500, easing: Easing.inOut(Easing.ease) }),
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

const PulsingRing: React.FC<{ maxScale: number; delay: number }> = ({ maxScale, delay }) => {
  const scale = useSharedValue(0.1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    const timer = setTimeout(() => {
      // NOTE TO USER: Adjust 'duration' (currently 4000ms) inside withTiming here to change the speed of the radar waves. Lower duration is faster.
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
    }, delay);
    return () => clearTimeout(timer);
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
      {/* Set A (Group 1) */}
      <PulsingRing maxScale={3.4} delay={0} />
      <PulsingRing maxScale={3.4} delay={350} />
      <PulsingRing maxScale={3.4} delay={700} />

      {/* Set B (Group 2 - starts 2 seconds later, before Set A disappears) */}
      <PulsingRing maxScale={3.4} delay={2000} />
      <PulsingRing maxScale={3.4} delay={2350} />
      <PulsingRing maxScale={3.4} delay={2700} />
    </AbsoluteCanvas>
  );
};

const AnimatedOrbitalContainer = Animated.createAnimatedComponent(styled.View`
  position: absolute;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  justify-content: center;
  align-items: center;
`);

const CelestialBody = styled.View<{ color: string }>`
  position: absolute;
  top: -3px;
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${props => props.color};
  shadow-color: ${props => props.color};
  shadow-opacity: 0.8;
  shadow-radius: 4px;
`;

const CelestialBodySecondary = styled.View<{ color: string }>`
  position: absolute;
  bottom: -3px;
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background-color: ${props => props.color};
`;

const TwinklingStar: React.FC<{ size: number; x: number; y: number; delay: number }> = ({ size, x, y, delay }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1500 + Math.random() * 1000 }),
        withTiming(0.2, { duration: 1500 + Math.random() * 1000 })
      ),
      -1,
      true
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }));
  return (
    <Animated.View
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

const OrbitalRing: React.FC<{ size: number; duration: number; clockwise: boolean }> = ({ size, duration, clockwise }) => {
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
      <CelestialBody color="#FF7E47" />
      <CelestialBodySecondary color="#9B7EDE" />
    </AnimatedOrbitalContainer>
  );
};

export const CelestialEndelBackground: React.FC = () => {
  return (
    <AbsoluteCanvas pointerEvents="none" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <TwinklingStar size={2.5} x={SCREEN_WIDTH * 0.12} y={SCREEN_HEIGHT * 0.18} delay={0} />
      <TwinklingStar size={3} x={SCREEN_WIDTH * 0.82} y={SCREEN_HEIGHT * 0.22} delay={500} />
      <TwinklingStar size={1.8} x={SCREEN_WIDTH * 0.22} y={SCREEN_HEIGHT * 0.46} delay={1000} />
      <TwinklingStar size={2.8} x={SCREEN_WIDTH * 0.72} y={SCREEN_HEIGHT * 0.52} delay={1500} />
      <TwinklingStar size={2} x={SCREEN_WIDTH * 0.08} y={SCREEN_HEIGHT * 0.68} delay={2000} />
      <TwinklingStar size={3} x={SCREEN_WIDTH * 0.88} y={SCREEN_HEIGHT * 0.62} delay={2500} />
      <TwinklingStar size={1.5} x={SCREEN_WIDTH * 0.28} y={SCREEN_HEIGHT * 0.78} delay={3000} />
      <TwinklingStar size={2.2} x={SCREEN_WIDTH * 0.72} y={SCREEN_HEIGHT * 0.8} delay={3500} />

      {/* NOTE TO USER: Adjust 'size' parameters (currently 320 and 380) below to change the diameter of the flip clock orbital waves. */}
      <OrbitalRing size={320} duration={26000} clockwise={true} />
      <OrbitalRing size={380} duration={38000} clockwise={false} />
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

      setNextDigit(digits);

      // Phase 1: fold the top flap down (prev digit disappears from top)
      animTop.setValue(1);
      RNAnimated.timing(animTop, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start(() => {
        setDisplayTop(digits);
        // Phase 2: unfold the bottom flap (new digit appears from bottom)
        animBottom.setValue(0);
        RNAnimated.timing(animBottom, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }).start();

        // Delay the lower half number update slightly for smooth flip transition
        setTimeout(() => {
          setDisplayBottom(digits);
        }, 100);
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
          <RNAnimated.View style={[{
            position: 'absolute', top: 0, left: 0, width: 90, height: 55, overflow: 'hidden', zIndex: 3,
            borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: '#121217',
            borderWidth: 1.5, borderColor: '#1E1E26', borderBottomWidth: 0
          }, topFlapStyle]}>
            <FlipNumberText numberOfLines={1}>{displayTop}</FlipNumberText>
          </RNAnimated.View>

          {/* Animated bottom flap — unfolds in (shows new digit bottom half) */}
          <RNAnimated.View style={[{
            position: 'absolute', bottom: 0, left: 0, width: 90, height: 55, overflow: 'hidden', zIndex: 3,
            borderBottomLeftRadius: 14, borderBottomRightRadius: 14, backgroundColor: '#121217',
            borderWidth: 1.5, borderColor: '#1E1E26', borderTopWidth: 0
          }, bottomFlapStyle]}>
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
  const onIncrementRef = useRef(onIncrement);
  const onDecrementRef = useRef(onDecrement);

  // Sync refs with the latest props
  useEffect(() => {
    onIncrementRef.current = onIncrement;
    onDecrementRef.current = onDecrement;
  }, [onIncrement, onDecrement]);

  const lastDy = useRef(0);
  const STEP = 10; // px per increment step

  // Mobile Touch Drag handling (prevents parent ScrollView from canceling)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        lastDy.current = 0;
      },
      onPanResponderMove: (_, gs) => {
        const delta = gs.dy - lastDy.current;
        if (Math.abs(delta) >= STEP) {
          const steps = Math.floor(Math.abs(delta) / STEP);
          if (delta < 0) {
            // Dragging up → increment
            for (let i = 0; i < steps; i++) onIncrementRef.current?.();
          } else {
            // Dragging down → decrement
            for (let i = 0; i < steps; i++) onDecrementRef.current?.();
          }
          lastDy.current += steps * (delta < 0 ? -STEP : STEP);
        }
      },
      onPanResponderRelease: () => {
        lastDy.current = 0;
      },
    })
  ).current;

  // Web Mouse Drag handling (tracks cursor globally across the window)
  const onMouseDownWeb = (e: React.MouseEvent) => {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    const startY = e.clientY;
    let localLastDy = 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dy = moveEvent.clientY - startY;
      const delta = dy - localLastDy;
      if (Math.abs(delta) >= STEP) {
        const steps = Math.floor(Math.abs(delta) / STEP);
        if (delta < 0) {
          for (let i = 0; i < steps; i++) onIncrementRef.current?.();
        } else {
          for (let i = 0; i < steps; i++) onDecrementRef.current?.();
        }
        localLastDy += steps * (delta < 0 ? -STEP : STEP);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <View
      style={{ position: 'absolute', right: -22, top: 28, width: 32, height: 60, alignItems: 'center', justifyContent: 'center', zIndex: 20 } as any}
      {...panResponder.panHandlers}
      {...(Platform.OS === 'web' ? { onMouseDown: onMouseDownWeb } : {})}
    >
      <GearDialKnob style={{ position: 'relative', right: 0, top: 0, cursor: 'ns-resize' } as any}>
        <GearDialStripe />
        <GearDialStripe />
        <GearDialStripe />
        <GearDialStripe />
        <GearDialStripe />
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
    categoryFocusSeconds,
  } = useAppSelector((state) => state.audio);

  const pomoFocusDurationRef = useRef(pomoFocusDuration);
  pomoFocusDurationRef.current = pomoFocusDuration;

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
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleModeChange = (mode: 'pomo' | 'short_break' | 'long_break') => {
    dispatch(setTimerMode(mode));
  };

  // Adjusters for 3-card interactive layout (Updates Redux & Syncs widget)
  const incrementHours = () => {
    const nextDuration = pomoFocusDurationRef.current + 3600;
    dispatch(setPomoFocusDuration(Math.min(359900, nextDuration)));
  };

  const decrementHours = () => {
    const nextDuration = Math.max(60, pomoFocusDurationRef.current - 3600);
    dispatch(setPomoFocusDuration(nextDuration));
  };

  const incrementMinutes = () => {
    const nextDuration = pomoFocusDurationRef.current + 60;
    dispatch(setPomoFocusDuration(Math.min(359900, nextDuration)));
  };

  const decrementMinutes = () => {
    const nextDuration = Math.max(60, pomoFocusDurationRef.current - 60);
    dispatch(setPomoFocusDuration(nextDuration));
  };

  const incrementSeconds = () => {
    const nextDuration = pomoFocusDurationRef.current + 5;
    dispatch(setPomoFocusDuration(Math.min(359900, nextDuration)));
  };

  const decrementSeconds = () => {
    const nextDuration = Math.max(5, pomoFocusDurationRef.current - 5);
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

  const SUB_SCREENS: ('timer' | 'stats')[] = ['timer', 'stats'];

  const handlePressSettingsInNav = () => {
    if (activeSubScreen !== 'timer') {
      dispatch(setActiveSubScreen('timer'));
    }
    setShowDropdown(true);
  };

  const handleSubSwipeLeft = () => {
    const currentIndex = SUB_SCREENS.indexOf(activeSubScreen as any);
    if (currentIndex >= 0 && currentIndex < SUB_SCREENS.length - 1) {
      dispatch(setActiveSubScreen(SUB_SCREENS[currentIndex + 1]));
    }
  };

  const handleSubSwipeRight = () => {
    const currentIndex = SUB_SCREENS.indexOf(activeSubScreen as any);
    if (currentIndex > 0) {
      dispatch(setActiveSubScreen(SUB_SCREENS[currentIndex - 1]));
    }
  };

  const subPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        // Set pan responder only for horizontal swipes
        return Math.abs(dx) > 40 && Math.abs(dy) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        if (dx < -60) {
          handleSubSwipeLeft();
        } else if (dx > 60) {
          handleSubSwipeRight();
        }
      },
    })
  ).current;

  return (
    <Container {...subPanResponder.panHandlers}>
      {/* Global Ambient Orbs for rich color contrasts */}
      <AmbientOrb style={{ top: -80, left: -80, backgroundColor: '#FF7E47' }} />
      <AmbientOrb style={{ bottom: 120, right: -100, backgroundColor: '#9B7EDE' }} />
      <AmbientOrb style={{ top: '35%', left: '15%', backgroundColor: '#00F2FE', width: 240, height: 240, opacity: 0.08 }} />

      <HeaderBar>
        <HeaderTitle>Focus Session</HeaderTitle>
      </HeaderBar>

      {activeSubScreen === 'timer' && (
        <SubContainer>
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
            {/* Ambient Backgrounds centered on the clock numbers! */}
            {animationStyle === 'falling' && <AmbientFloatingOrbs />}
            {animationStyle === 'orb' && <RadarWaveBackground />}
            {animationStyle === 'flip' && <CelestialEndelBackground />}

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
            <RightHeaderGroup>
              <StatsFilterGroup style={{ marginRight: 8 }}>
                {['D', 'W', 'M', 'Y'].map((f) => (
                  <FilterPill key={f} active={f === 'D'}>
                    <FilterPillText active={f === 'D'}>{f}</FilterPillText>
                  </FilterPill>
                ))}
              </StatsFilterGroup>
              <StatsCloseButton onPress={() => dispatch(setActiveSubScreen('timer'))}>
                <X size={16} color="#FFFFFF" />
              </StatsCloseButton>
            </RightHeaderGroup>
          </StatsHeaderRow>

          {/* Dynamic Statistics Panel (Real data calculation) */}
          {(() => {
            const activeDaysCount = weeklyFocusMinutes.filter(m => m > 0).length || 1;
            const totalDaysActive = completedPomodorosCount > 0 ? Math.max(activeDaysCount, Math.ceil(completedPomodorosCount / 3)) : 1;

            const todayMins = weeklyFocusMinutes[new Date().getDay()] || 0;
            const todayH = Math.floor(todayMins / 60);
            const todayM = todayMins % 60;
            const todayFocusStr = todayH > 0 ? `${todayH}h ${todayM}m` : `${todayM}m`;

            const accumH = Math.floor(totalFocusSeconds / 3600);
            const accumM = Math.floor((totalFocusSeconds % 3600) / 60);
            const accumFocusStr = `${accumH}h ${accumM}m`;

            const weeklyMins = weeklyFocusMinutes.reduce((acc, m) => acc + m, 0);
            const weeklyH = Math.floor(weeklyMins / 60);
            const weeklyM = weeklyMins % 60;
            const weeklyFocusStr = `${weeklyH}h ${weeklyM}m`;

            const catStats = (categoryFocusSeconds || { Work: 600 * 3600, Study: 450 * 3600, Meditate: 120 * 3600, Fitness: 80 * 3600, Code: 200 * 3600, Relax: 90 * 3600 }) as Record<string, number>;
            const totalCatSeconds = Object.values(catStats).reduce((acc: number, val: number) => acc + val, 0) || 1;
            const sortedCategories = (Object.entries(catStats) as [string, number][]).sort((a, b) => b[1] - a[1]);

            // Simple trend calculation compared to baseline average of 5 hours/day
            const todayAvgMinutes = 300;
            const trendPercent = Math.min(150, Math.round((todayMins / todayAvgMinutes) * 100));

            return (
              <>
                <StatsRowGrid>
                  <StatsMiniCard>
                    <StatsValueLabel>Total Pomodoros</StatsValueLabel>
                    <StatsBigNumber>🍅 {completedPomodorosCount}</StatsBigNumber>
                  </StatsMiniCard>
                  <StatsMiniCard>
                    <StatsValueLabel>Total Days Active</StatsValueLabel>
                    <StatsBigNumber>{totalDaysActive}</StatsBigNumber>
                  </StatsMiniCard>
                </StatsRowGrid>

                <StatsMiniCard style={{ width: '100%', marginTop: 12 }}>
                  <StatsValueLabel>Today's Focus Time</StatsValueLabel>
                  <StatsBigNumber>{todayFocusStr}</StatsBigNumber>
                  <StatsValueLabel style={{ marginTop: 12 }}>Total Focus Accumulated</StatsValueLabel>
                  <StatsBigNumber>{accumFocusStr}</StatsBigNumber>
                </StatsMiniCard>

                {/* Combined Trend Section */}
                <FocusTrendSection style={{ marginTop: 20 }}>
                  <SectionSubtitle>Focus Trend</SectionSubtitle>
                  <StatsGroupCard style={{ padding: 20 }}>
                    <TrendHeaderStatRow>
                      <TrendStatBox>
                        <TrendStatLabel>Today's Focus</TrendStatLabel>
                        <TrendStatVal>{todayFocusStr}</TrendStatVal>
                        <TrendChange positive={todayMins >= todayAvgMinutes}>
                          {todayMins >= todayAvgMinutes ? '▲' : '▼'} {trendPercent}%
                        </TrendChange>
                      </TrendStatBox>
                      <TrendStatBox>
                        <TrendStatLabel>This Week</TrendStatLabel>
                        <TrendStatVal>{weeklyFocusStr}</TrendStatVal>
                        <TrendChange positive={weeklyMins >= 1000}>
                          {weeklyMins >= 1000 ? '▲ Stable' : '▼ Light'}
                        </TrendChange>
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

                <StatsHeaderTitle style={{ marginTop: 24, marginBottom: 12 }}>Category Breakdown</StatsHeaderTitle>
                <StatsGroupCard>
                  {sortedCategories.map(([catName, seconds]) => {
                    const pct = Math.round((seconds / totalCatSeconds) * 100);
                    const hrs = (seconds / 3600).toFixed(1);
                    const catColor = catName === 'Work' ? '#FF7E47' : catName === 'Study' ? '#4ECDC4' : catName === 'Meditate' ? '#9B7EDE' : catName === 'Fitness' ? '#FFB347' : catName === 'Code' ? '#FF6B6B' : '#E6E6FA';
                    return (
                      <CategoryProgressRow key={catName}>
                        <ProgressLabelInfo>
                          <ProgressText>{catName}</ProgressText>
                          <ProgressVal>{pct}% ({hrs}h)</ProgressVal>
                        </ProgressLabelInfo>
                        <ProgressBarContainer>
                          <ProgressBarFill percent={pct} color={catColor} />
                        </ProgressBarContainer>
                      </CategoryProgressRow>
                    );
                  })}
                </StatsGroupCard>
              </>
            );
          })()}
        </SubContainerScroll>
      )}

      {/* Navigation Stack */}
      {!sessionActive && (
        <VerticalNavStack pointerEvents="box-none">
          <NavCircleButton active={activeSubScreen === 'timer'} onPress={() => dispatch(setActiveSubScreen('timer'))}>
            <Clock size={18} color={activeSubScreen === 'timer' ? '#08080A' : '#FFFFFF'} />
          </NavCircleButton>
          <NavCircleButton active={activeSubScreen === 'stats'} onPress={() => dispatch(setActiveSubScreen('stats'))}>
            <PieChart size={18} color={activeSubScreen === 'stats' ? '#08080A' : '#FFFFFF'} />
          </NavCircleButton>
        </VerticalNavStack>
      )}
    </Container>
  );
};

// -------------------------------------------------------------
// STYLED COMPONENTS
// -------------------------------------------------------------

const Container = styled.View`
  flex: 1;
  background-color: #08080A;
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
  justify-content: center;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
  z-index: 10;
`;

const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 500;
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
  width: 180px;
  height: 180px;
  border-radius: 90px;
  border-width: 1.5px;
  border-color: #FF7E47;
  shadow-color: #FF7E47;
  shadow-opacity: 0.2;
  shadow-radius: 8px;
  pointer-events: none;
`);

const FocusTypeTabs = styled.View`
  flex-direction: row;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 3px;
  margin-bottom: 12px;
`;

const TypeTab = styled.TouchableOpacity<{ active: boolean }>`
  padding: 6px 14px;
  border-radius: 10px;
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.95)' : 'transparent'};
`;

const TypeTabText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080C' : '#8E8E93'};
  font-size: 11px;
  font-weight: 600;
`;

const ModeSelectorsHeader = styled.View`
  flex-direction: row;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 3px;
  margin-bottom: 10px;
`;

const ModeTab = styled.TouchableOpacity<{ active: boolean }>`
  padding: 5px 12px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'transparent'};
`;

const ModeTabText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#8E8E93'};
  font-size: 10px;
  font-weight: bold;
`;

const PhaseIndicator = styled.View<{ active: boolean }>`
  padding: 5px 16px;
  border-radius: 16px;
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'rgba(255,255,255,0.02)'};
  border-width: 0.8px;
  border-color: ${props => props.active ? '#FF7E47' : 'rgba(255,255,255,0.06)'};
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
  font-size: 84px;
  font-weight: 300;
  letter-spacing: -2px;
  text-shadow-color: rgba(255, 255, 255, 0.1);
  text-shadow-radius: 8px;
`;

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
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
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
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
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
  height: 1px;
  background-color: #08080C;
  top: 54.5px;
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
  color: #8E8E93;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 8px;
`;

const GearDialKnob = styled.View`
  position: absolute;
  right: -14px;
  top: 32px;
  width: 13px;
  height: 46px;
  background-color: #1A1A22;
  border-radius: 6px;
  border-width: 1.5px;
  border-color: rgba(255, 126, 71, 0.45);
  padding-vertical: 4px;
  align-items: center;
  justify-content: space-around;
  z-index: 20;
  shadow-color: #FF7E47;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
  elevation: 3;
`;

const GearDialStripe = styled.View`
  width: 7px;
  height: 2px;
  background-color: #FF7E47;
  border-radius: 1px;
`;

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
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.04)'};
  border-width: 0.8px;
  border-color: ${props => props.active ? 'transparent' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 14px;
  padding: 6px 14px;
  margin-right: 8px;
  justify-content: center;
  align-items: center;
  height: 32px;
`;

const CategoryPillText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080C' : '#E6E6FA'};
  font-size: 11px;
  font-weight: 600;
`;

const ThemeSelectionRow = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 6px;
  width: ${SCREEN_WIDTH - 40}px;
`;

const ThemeButton = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(255, 126, 71, 0.12)' : 'rgba(255, 255, 255, 0.04)'};
  border-width: 0.8px;
  border-color: ${props => props.active ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 14px;
  padding: 6px 14px;
  margin-horizontal: 4px;
  justify-content: center;
  align-items: center;
  height: 32px;
  flex: 1;
`;

const ThemeButtonText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FF7E47' : '#8E8E93'};
  font-size: 11px;
  font-weight: bold;
`;

const SettingsIconPill = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
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

const BackdropPressable = styled.Pressable`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(8, 8, 12, 0.6);
  justify-content: center;
  align-items: center;
  z-index: 500;
`;

const DropdownOverlayCard = styled.View`
  background-color: rgba(28, 28, 30, 0.96);
  border-radius: 24px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.12);
  padding: 24px;
  width: 90%;
  shadow-color: #000;
  shadow-opacity: 0.4;
  shadow-radius: 16px;
  elevation: 20;
`;

const DropdownHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  border-bottom-width: 0.8px;
  border-bottom-color: rgba(255, 255, 255, 0.08);
  padding-bottom: 10px;
`;

const DropdownTitleText = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const DonePillButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 6px 12px;
  border-radius: 12px;
`;

const DonePillText = styled.Text`
  color: #08080C;
  font-size: 11px;
  font-weight: bold;
`;

const ConfigSection = styled.View``;

const ConfigRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ConfigLabelText = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StepperRow = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 2px;
`;

const StepperButton = styled.TouchableOpacity`
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.06);
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
  background-color: ${props => props.active ? '#FF7E47' : 'rgba(255, 255, 255, 0.04)'};
  border-width: 0.8px;
  border-color: ${props => props.active ? 'transparent' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 8px;
  padding: 5px 10px;
  margin-left: 6px;
`;

const OptionText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080C' : '#8E8E93'};
  font-size: 9px;
  font-weight: bold;
`;

const ControlsArea = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 24px;
  z-index: 10;
`;

const StartButton = styled.TouchableOpacity`
  background-color: rgba(255, 126, 71, 0.22);
  border-width: 1px;
  border-color: #FF7E47;
  padding: 13px 30px;
  border-radius: 16px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.15;
  shadow-radius: 6px;
`;

const StartButtonText = styled.Text`
  color: #FF8E53;
  font-size: 14px;
  font-weight: bold;
  margin-left: 8px;
`;

const ResetButton = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  justify-content: center;
  align-items: center;
  margin-left: 12px;
`;

const VerticalNavStack = styled.View`
  position: absolute;
  right: 16px;
  bottom: 120px;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 26px;
  padding: 6px;
  align-items: center;
  z-index: 1000;
  shadow-color: #000;
  shadow-opacity: 0.3;
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

const StatsHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const StatsHeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.2px;
`;

const StatsFilterGroup = styled.View`
  flex-direction: row;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 2px;
`;

const FilterPill = styled.TouchableOpacity<{ active: boolean }>`
  padding: 4px 10px;
  border-radius: 8px;
  background-color: ${props => props.active ? '#FF7E47' : 'transparent'};
`;

const FilterPillText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080C' : '#8E8E93'};
  font-size: 10px;
  font-weight: bold;
`;

const StatsRowGrid = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const StatsMiniCard = styled(GlassCard)`
  width: 48%;
  padding: 16px;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
`;

const StatsValueLabel = styled.Text`
  color: #8E8E93;
  font-size: 9px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatsBigNumber = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
  margin-top: 4px;
`;

const StatsGroupCard = styled.View`
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
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
  font-weight: 500;
`;

const ProgressVal = styled.Text`
  color: #8E8E93;
  font-size: 11px;
`;

const ProgressBarContainer = styled.View`
  height: 5px;
  border-radius: 2.5px;
  background-color: rgba(255, 255, 255, 0.04);
  width: 100%;
  overflow: hidden;
`;

const ProgressBarFill = styled.View<{ percent: number; color: string }>`
  height: 100%;
  width: ${props => props.percent}%;
  background-color: ${props => props.color};
  border-radius: 2.5px;
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

const SummaryTitleRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 2px;
`;

const SummaryTitle = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: bold;
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
  color: #8E8E93;
  font-size: 12px;
  margin-bottom: 20px;
`;

const FocusTrendSection = styled.View`
  width: 100%;
`;

const SectionSubtitle = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 500;
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
  color: #8E8E93;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TrendStatVal = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: bold;
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
  width: 12px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.04);
  justify-content: flex-end;
`;

const ChartBarFill = styled.View<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  background-color: #FF7E47;
  border-radius: 6px;
`;

const ChartBarLabel = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: bold;
  margin-top: 6px;
`;

const RightHeaderGroup = styled.View`
  flex-direction: row;
  align-items: center;
`;

const StatsCloseButton = styled.TouchableOpacity`
  margin-left: 12px;
  width: 30px;
  height: 30px;
  justify-content: center;
  align-items: center;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
`;
