import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import styled from 'styled-components/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const BackgroundOrbs: React.FC = () => {
  // Shared values for floating orbs X & Y translation offsets
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);

  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  useEffect(() => {
    // Orb 1: Orange - drifts top right
    orb1X.value = withRepeat(
      withTiming(50, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withTiming(80, { duration: 18000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Orb 2: Teal - drifts bottom left
    orb2X.value = withRepeat(
      withTiming(-60, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withTiming(-40, { duration: 16000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Orb 3: Purple - drifts mid center
    orb3X.value = withRepeat(
      withTiming(40, { duration: 19000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    orb3Y.value = withRepeat(
      withTiming(-70, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // Animated styles mapping translation values to styles
  const animStyleOrb1 = useAnimatedStyle(() => ({
    transform: [{ translateX: orb1X.value }, { translateY: orb1Y.value }],
  }));

  const animStyleOrb2 = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }, { translateY: orb2Y.value }],
  }));

  const animStyleOrb3 = useAnimatedStyle(() => ({
    transform: [{ translateX: orb3X.value }, { translateY: orb3Y.value }],
  }));

  return (
    <Container pointerEvents="none">
      {/* Orb 1: Glowing Orange */}
      <AnimatedOrb
        style={[styles.orb, styles.orbOrange, animStyleOrb1]}
      />
      {/* Orb 2: Glowing Neon Teal */}
      <AnimatedOrb
        style={[styles.orb, styles.orbTeal, animStyleOrb2]}
      />
      {/* Orb 3: Glowing Soft Purple */}
      <AnimatedOrb
        style={[styles.orb, styles.orbPurple, animStyleOrb3]}
      />
    </Container>
  );
};

const Container = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: hidden;
  background-color: #08080A;
  z-index: -1;
`;

const AnimatedOrb = Animated.createAnimatedComponent(styled.View``);

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 150,
    opacity: 0.12,
  },
  orbOrange: {
    width: 250,
    height: 250,
    backgroundColor: '#FF7E47',
    top: 50,
    right: -50,
    // Add shadow glow on native platforms
    shadowColor: '#FF7E47',
    shadowOpacity: 0.8,
    shadowRadius: 100,
    elevation: 20,
  },
  orbTeal: {
    width: 280,
    height: 280,
    backgroundColor: '#00F2FE',
    bottom: 80,
    left: -80,
    shadowColor: '#00F2FE',
    shadowOpacity: 0.8,
    shadowRadius: 120,
    elevation: 20,
  },
  orbPurple: {
    width: 220,
    height: 220,
    backgroundColor: '#9B7EDE',
    top: SCREEN_HEIGHT * 0.4,
    left: -40,
    shadowColor: '#9B7EDE',
    shadowOpacity: 0.8,
    shadowRadius: 90,
    elevation: 15,
  },
});
