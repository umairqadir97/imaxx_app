import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  cancelAnimation,
  LinearTransition,
  Easing,
} from 'react-native-reanimated';
import styled from 'styled-components/native';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WaveformProps {
  isPlaying: boolean;
  height?: number;
  mode?: 'sleep' | 'relax' | 'focus';
}

export const Waveform: React.FC<WaveformProps> = ({ isPlaying, height = 150, mode = 'relax' }) => {
  const phase1 = useSharedValue(0);
  const phase2 = useSharedValue(0);
  const phase3 = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      // Loop phase values for continuous wave animation
      phase1.value = withRepeat(
        withTiming(2 * Math.PI, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      );
      phase2.value = withRepeat(
        withTiming(-2 * Math.PI, { duration: 3500, easing: Easing.linear }),
        -1,
        false
      );
      phase3.value = withRepeat(
        withTiming(2 * Math.PI, { duration: 1800, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      // Soft resting values
      cancelAnimation(phase1);
      cancelAnimation(phase2);
      cancelAnimation(phase3);
      phase1.value = withTiming(0, { duration: 800 });
      phase2.value = withTiming(0, { duration: 800 });
      phase3.value = withTiming(0, { duration: 800 });
    }

    return () => {
      cancelAnimation(phase1);
      cancelAnimation(phase2);
      cancelAnimation(phase3);
    };
  }, [isPlaying]);

  // Generate sine path
  const generatePath = (p: number, amplitude: number, frequency: number, verticalShift: number) => {
    'worklet';
    const points: string[] = [];
    const step = 5;
    const w = SCREEN_WIDTH - 40; // Horizontal margin

    for (let x = 0; x <= w; x += step) {
      // Sine wave calculation
      let y = amplitude * Math.sin(frequency * (x * (Math.PI / 180)) + p) + verticalShift;
      
      // Mode visual adjustments
      if (mode === 'sleep') {
        // Narrow center wave
        const multiplier = Math.sin((x / w) * Math.PI);
        y = amplitude * multiplier * Math.sin(frequency * (x * (Math.PI / 180)) + p) + verticalShift;
      } else if (mode === 'focus') {
        // High frequency sharp waves
        y = amplitude * Math.sin(frequency * 2 * (x * (Math.PI / 180)) + p) + verticalShift;
      }
      
      if (x === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }
    return points.join(' ');
  };

  // Reanimated animated properties for the 3 SVG paths
  const waveProps1 = useAnimatedProps(() => {
    const amp = isPlaying ? 22 : 4;
    const path = generatePath(phase1.value, amp, 1.2, height / 2);
    return { d: path };
  });

  const waveProps2 = useAnimatedProps(() => {
    const amp = isPlaying ? 14 : 3;
    const path = generatePath(phase2.value, amp, 0.8, height / 2 + 10);
    return { d: path };
  });

  const waveProps3 = useAnimatedProps(() => {
    const amp = isPlaying ? 8 : 2;
    const path = generatePath(phase3.value, amp, 1.6, height / 2 - 10);
    return { d: path };
  });

  return (
    <WaveContainer style={{ height }}>
      <Svg width={SCREEN_WIDTH - 40} height={height}>
        {/* Wave 1: Accent primary (purple) */}
        <AnimatedPath
          animatedProps={waveProps1}
          fill="none"
          stroke="#9B7EDE"
          strokeWidth={2}
          opacity={0.6}
        />
        {/* Wave 2: Success (mint green) */}
        <AnimatedPath
          animatedProps={waveProps2}
          fill="none"
          stroke="#4ECDC4"
          strokeWidth={1.5}
          opacity={0.4}
        />
        {/* Wave 3: White */}
        <AnimatedPath
          animatedProps={waveProps3}
          fill="none"
          stroke="#FFFFFF"
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
