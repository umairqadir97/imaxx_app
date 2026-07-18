import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import styled from 'styled-components/native';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaveformProps {
  isPlaying: boolean;
  height?: number;
  mode?: 'sleep' | 'relax' | 'focus' | 'move' | 'uplift';
}

const modeConfigs = {
  relax: {
    stroke1: '#FF7E47', // Warm orange/peach
    stroke2: '#4ECDC4', // Mint green
    stroke3: '#FFFFFF', // Clean white
    amp1: 18, amp2: 12, amp3: 8,
    freq1: 1.2, freq2: 0.8, freq3: 1.6,
  },
  sleep: {
    stroke1: '#9B7EDE', // Deep indigo/violet
    stroke2: '#3B5998', // Nocturnal blue
    stroke3: '#FFFFFF',
    amp1: 11, amp2: 7, amp3: 4,
    freq1: 0.7, freq2: 0.5, freq3: 0.9,
  },
  move: {
    stroke1: '#FF3B30', // Energetic coral red
    stroke2: '#FF9500', // Active sunshine gold
    stroke3: '#FFFFFF',
    amp1: 24, amp2: 16, amp3: 10,
    freq1: 1.8, freq2: 1.2, freq3: 2.2,
  },
  uplift: {
    stroke1: '#E91E63', // Energetic pink
    stroke2: '#FFCC00', // Sunshine yellow
    stroke3: '#FFFFFF',
    amp1: 20, amp2: 13, amp3: 9,
    freq1: 1.4, freq2: 1.0, freq3: 1.8,
  },
  focus: {
    stroke1: 'transparent',
    stroke2: 'transparent',
    stroke3: 'transparent',
    amp1: 0, amp2: 0, amp3: 0,
    freq1: 0, freq2: 0, freq3: 0,
  }
};

export const Waveform: React.FC<WaveformProps> = ({ isPlaying, height = 150, mode = 'relax' }) => {
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);
  const phase3 = useSharedValue(0);

  const activeMode = mode || 'relax';
  const config = modeConfigs[activeMode] || modeConfigs.relax;

  useEffect(() => {
    let dur1 = 3000, dur2 = 4000, dur3 = 2200;
    if (activeMode === 'sleep') {
      dur1 = 6500; dur2 = 8500; dur3 = 4800; // Slow, delta-like sleep rhythms
    } else if (activeMode === 'move') {
      dur1 = 1400; dur2 = 1800; dur3 = 1000; // Fast energetic tempos
    } else if (activeMode === 'uplift') {
      dur1 = 2000; dur2 = 2800; dur3 = 1500; // Bright bubbling speeds
    }

    // Reset and restart phase animations with new durations
    phase1.value = withRepeat(
      withTiming(2 * Math.PI, { duration: dur1, easing: Easing.linear }),
      -1,
      false
    );
    phase2.value = withRepeat(
      withTiming(-2 * Math.PI, { duration: dur2, easing: Easing.linear }),
      -1,
      false
    );
    phase3.value = withRepeat(
      withTiming(2 * Math.PI, { duration: dur3, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(phase1);
      cancelAnimation(phase2);
      cancelAnimation(phase3);
    };
  }, [activeMode]);

  // Generate customized path designs based on target mode
  const generatePath = (p: number, amplitude: number, frequency: number, verticalShift: number) => {
    'worklet';
    const points: string[] = [];
    const step = 6;
    const w = SCREEN_WIDTH - 40;

    for (let x = 0; x <= w; x += step) {
      let y = verticalShift;

      if (activeMode === 'sleep') {
        // Enveloped narrow wave at center representing theta sleep states
        const envelope = Math.sin((x / w) * Math.PI);
        y = amplitude * envelope * Math.sin(frequency * (x * (Math.PI / 180)) + p) + verticalShift;
      } else if (activeMode === 'move') {
        // Complex dynamic heart beat double-crests
        const firstHarmonic = Math.sin(frequency * (x * (Math.PI / 180)) + p);
        const secondHarmonic = 0.3 * Math.sin(frequency * 2.5 * (x * (Math.PI / 180)) + p * 1.5);
        y = amplitude * (firstHarmonic + secondHarmonic) + verticalShift;
      } else if (activeMode === 'uplift') {
        // Modulation bubble ripples
        const baseSine = Math.sin(frequency * (x * (Math.PI / 180)) + p);
        const modulation = 0.85 + 0.15 * Math.sin(x * 0.04 + p);
        y = amplitude * baseSine * modulation + verticalShift;
      } else {
        // Standard gentle relax sine wave
        y = amplitude * Math.sin(frequency * (x * (Math.PI / 180)) + p) + verticalShift;
      }

      if (x === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }
    return points.join(' ');
  };

  const waveProps1 = useAnimatedProps(() => {
    const activeConf = modeConfigs[activeMode] || modeConfigs.relax;
    const path = generatePath(phase1.value, activeConf.amp1, activeConf.freq1, height / 2);
    return { d: path };
  });

  const waveProps2 = useAnimatedProps(() => {
    const activeConf = modeConfigs[activeMode] || modeConfigs.relax;
    const path = generatePath(phase2.value, activeConf.amp2, activeConf.freq2, height / 2 + 6);
    return { d: path };
  });

  const waveProps3 = useAnimatedProps(() => {
    const activeConf = modeConfigs[activeMode] || modeConfigs.relax;
    const path = generatePath(phase3.value, activeConf.amp3, activeConf.freq3, height / 2 - 6);
    return { d: path };
  });

  return (
    <WaveContainer style={{ height }}>
      <Svg width={SCREEN_WIDTH - 40} height={height}>
        {/* Wave 1 */}
        <AnimatedPath
          animatedProps={waveProps1}
          fill="none"
          stroke={config.stroke1}
          strokeWidth={2}
          opacity={0.65}
        />
        {/* Wave 2 */}
        <AnimatedPath
          animatedProps={waveProps2}
          fill="none"
          stroke={config.stroke2}
          strokeWidth={1.5}
          opacity={0.45}
        />
        {/* Wave 3 */}
        <AnimatedPath
          animatedProps={waveProps3}
          fill="none"
          stroke={config.stroke3}
          strokeWidth={1}
          opacity={0.3}
        />
      </Svg>
    </WaveContainer>
  );
};

const WaveContainer = styled.View`
  justify-content: center;
  align-items: center;
  width: 100%;
`;
