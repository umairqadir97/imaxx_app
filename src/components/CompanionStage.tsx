import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image, Animated, Easing, Platform, ImageSourcePropType } from 'react-native';
import styled from 'styled-components/native';
import { Lock, X, Star, CheckSquare, Compass } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Conditional Rive import (native only) ───
let RiveView: any = null;
let useRiveFile: any = null;
let Fit: any = null;

if (Platform.OS !== 'web') {
  try {
    const riveModule = require('@rive-app/react-native');
    RiveView = riveModule.RiveView;
    useRiveFile = riveModule.useRiveFile;
    Fit = riveModule.Fit;
  } catch (e) {
    console.log('Rive not available, using image fallback');
  }
}

// ─── 3D Image Assets (web fallback + roster icons) ───
export const COMPANION_IMAGES = {
  red_panda: {
    stressed: require('../../assets/companions/panda_stressed.png'),
    relaxed: require('../../assets/companions/panda_relaxed.png'),
    happy: require('../../assets/companions/panda_happy.png'),
    focus: require('../../assets/companions/panda_focus.png'),
    sleep: require('../../assets/companions/panda_sleep.png'),
    roster: require('../../assets/companions/panda_relaxed.png'),
  },
  brain: {
    stressed: require('../../assets/companions/brain_sleep.png'),
    relaxed: require('../../assets/companions/brain_relaxed.png'),
    happy: require('../../assets/companions/brain_happy.png'),
    focus: require('../../assets/companions/brain_happy.png'),
    sleep: require('../../assets/companions/brain_sleep.png'),
    roster: require('../../assets/companions/brain_happy.png'),
  },
  dolphin: { roster: require('../../assets/companions/dolphin_icon.png') },
  fox: { roster: require('../../assets/companions/fox_icon.png') },
};

export type CompanionType = 'red_panda' | 'brain' | 'dolphin' | 'fox';

interface CompanionStageProps {
  fillProgress: number;
  state: 'idle' | 'focus' | 'sleep';
  totalFocusSeconds: number;
  completedHabitsCount: number;
  maxStreakCount: number;
  activeCompanion: CompanionType;
  onChangeCompanion: (companion: CompanionType) => void;
  totalTasksCount: number;
  completedTasksCount: number;
  onPressTaskPreview: () => void;
  onPressUserJourney?: () => void;
}

// ─── Emotional state from progress ───
export const getEmotionalState = (progress: number, appState: 'idle' | 'focus' | 'sleep'): 'stressed' | 'relaxed' | 'happy' | 'focus' | 'sleep' => {
  if (appState === 'focus') return 'focus';
  if (progress < 0.2) return 'sleep';
  if (progress >= 0.2 && progress < 0.8) return 'relaxed';
  return 'happy';
};

export const getEmotionalLabel = (emotionalState: string): string => {
  switch (emotionalState) {
    case 'stressed': return '😩 Feeling overwhelmed...';
    case 'relaxed': return '😌 Awake and neutral';
    case 'happy': return '🎉 Happy & energetic!';
    case 'focus': return '🎧 Deep Focus mode';
    case 'sleep': return '💤 Sleeping & recovering';
    default: return '✨ Standing by';
  }
};

// ─── Floating Particles Component ───
const FloatingParticles: React.FC<{ emotionalState: string }> = ({ emotionalState }) => {
  const particles = useMemo(() => {
    let symbol = '✨';
    if (emotionalState === 'stressed') symbol = '💤';
    else if (emotionalState === 'happy') symbol = '⭐';
    else if (emotionalState === 'sleep') symbol = '💤';
    else if (emotionalState === 'focus') symbol = '🎵';
    else if (emotionalState === 'relaxed') symbol = '🍃';

    return Array.from({ length: 4 }).map((_, i) => ({
      id: i,
      symbol,
      anim: new Animated.Value(0),
      left: 20 + Math.random() * 120,
      delay: i * 800,
    }));
  }, [emotionalState]);

  useEffect(() => {
    let active = true;

    const startAnim = (p: any) => {
      if (!active) return;
      p.anim.setValue(0);
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.timing(p.anim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(({ finished }) => {
        if (finished && active) {
          startAnim(p);
        }
      });
    };

    particles.forEach(p => {
      startAnim(p);
    });

    return () => {
      active = false;
    };
  }, [particles]);

  return (
    <View style={{ position: 'absolute', width: 160, height: 140, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
      {particles.map(p => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [120, 10],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.15, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });
        const scale = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.2],
        });

        return (
          <Animated.Text
            key={p.id}
            style={{
              position: 'absolute',
              left: p.left,
              transform: [{ translateY }, { scale }],
              opacity,
              fontSize: 16,
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            {p.symbol}
          </Animated.Text>
        );
      })}
    </View>
  );
};

// ─── Rive Animation Component (native devices only) ───
const RiveCompanion: React.FC<{ emotionalState: string }> = ({ emotionalState }) => {
  if (!useRiveFile || !RiveView || !Fit) return null;

  const { riveFile } = useRiveFile(require('../../assets/rive/panda_karate.riv'));

  if (!riveFile) {
    return (
      <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#6B6280', fontSize: 10 }}>Loading animation...</Text>
      </View>
    );
  }

  return (
    <View style={{ width: 140, height: 140 }}>
      <RiveView
        file={riveFile}
        autoPlay={true}
        fit={Fit.Contain}
        style={{ width: 140, height: 140 }}
      />
    </View>
  );
};

// ─── Image Fallback with Breathing Animation (web + other pets) ───
const ImageCompanion: React.FC<{ activeCompanion: CompanionType; emotionalState: string; companionColor: string }> = ({
  activeCompanion,
  emotionalState,
  companionColor,
}) => {
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.08)).current;

  useEffect(() => {
    let active = true;

    const runBreathe = () => {
      if (!active) return;
      breatheAnim.setValue(0);
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(breatheAnim, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== 'web' }),
      ]).start(({ finished }) => {
        if (finished && active) runBreathe();
      });
    };

    const runFloat = () => {
      if (!active) return;
      floatAnim.setValue(0);
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ]).start(({ finished }) => {
        if (finished && active) runFloat();
      });
    };

    const runGlow = () => {
      if (!active) return;
      glowAnim.setValue(0.08);
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.18, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.06, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]).start(({ finished }) => {
        if (finished && active) runGlow();
      });
    };

    runBreathe();
    runFloat();
    runGlow();

    return () => {
      active = false;
    };
  }, []);

  const breatheScale = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.04] });
  const floatTranslate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  const getActiveImage = (): ImageSourcePropType => {
    if (activeCompanion === 'red_panda') {
      return (COMPANION_IMAGES.red_panda as any)[emotionalState] || COMPANION_IMAGES.red_panda.relaxed;
    }
    if (activeCompanion === 'brain') {
      return (COMPANION_IMAGES.brain as any)[emotionalState] || COMPANION_IMAGES.brain.relaxed;
    }
    return (COMPANION_IMAGES[activeCompanion] as any).roster;
  };

  return (
    <>
      <Animated.View style={{
        position: 'absolute',
        width: 110, height: 110, borderRadius: 55,
        backgroundColor: companionColor,
        opacity: glowAnim,
      }} />
      <Animated.View style={{ transform: [{ scale: breatheScale }, { translateY: floatTranslate }] }}>
        <Image source={getActiveImage()} style={{ width: 115, height: 115, borderRadius: 12 }} resizeMode="contain" />
      </Animated.View>
    </>
  );
};

// ─── Main CompanionStage ───
export const CompanionStage: React.FC<CompanionStageProps> = ({
  fillProgress, state, totalFocusSeconds, completedHabitsCount, maxStreakCount, activeCompanion, onChangeCompanion,
  totalTasksCount, completedTasksCount, onPressTaskPreview, onPressUserJourney,
}) => {
  const [showRosterModal, setShowRosterModal] = useState(false);

  const getCompanionName = (): string => {
    switch (activeCompanion) {
      case 'red_panda': return 'Red Panda';
      case 'brain': return 'Neuro-Brain';
      case 'dolphin': return 'Deep Work Dolphin';
      case 'fox': return 'Focus Fox';
    }
  };

  const getCompanionColor = (): string => {
    switch (activeCompanion) {
      case 'red_panda': return '#FF7E47';
      case 'brain': return '#FF7EB9';
      case 'dolphin': return '#00F2FE';
      case 'fox': return '#4ECDC4';
    }
  };

  const emotionalState = getEmotionalState(fillProgress, state);
  const companionColor = getCompanionColor();
  const progressPercent = Math.round(fillProgress * 100);

  // Decide: Rive (native + Red Panda) or Image fallback (web or other pets)
  const isNative = Platform.OS !== 'web' && RiveView !== null;
  const showRive = isNative && activeCompanion === 'red_panda';

  const remainingCount = totalTasksCount - completedTasksCount;

  return (
    <StageCard>
      <StageContentRow>
        {/* Left Column: Interactive Character Box */}
        <CharacterStageBox onPress={onPressUserJourney} activeOpacity={0.88}>
          <FloatingParticles emotionalState={emotionalState} />
          {showRive ? (
            <RiveCompanion emotionalState={emotionalState} />
          ) : (
            <ImageCompanion
              activeCompanion={activeCompanion}
              emotionalState={emotionalState}
              companionColor={companionColor}
            />
          )}
          <JourneyHintBadge>
            <Compass size={10} color="#00F2FE" style={{ marginRight: 3 }} />
            <JourneyHintText>Road Map</JourneyHintText>
          </JourneyHintBadge>
        </CharacterStageBox>

        {/* Right Column: Info, Energy, Buttons */}
        <StageRightColumn>
          <StageHeaderRow>
            <StageTitleArea>
              <CompanionName>{getCompanionName()}</CompanionName>
              <CompanionStatusText>{getEmotionalLabel(emotionalState)}</CompanionStatusText>
            </StageTitleArea>
            <RosterTrigger onPress={() => setShowRosterModal(true)}>
              <Star size={10} color="#08080C" fill="#08080C" style={{ marginRight: 4 }} />
              <RosterTriggerText>Choose Pet</RosterTriggerText>
            </RosterTrigger>
          </StageHeaderRow>

          <ProgressBarContainer>
            <ProgressBarHeader>
              <ProgressLabelText>Energy</ProgressLabelText>
              <ProgressValueText style={{ color: companionColor }}>{progressPercent}%</ProgressValueText>
            </ProgressBarHeader>
            <ProgressBarTrack>
              <ProgressBarFill style={{ width: `${progressPercent}%`, backgroundColor: companionColor }} />
            </ProgressBarTrack>
          </ProgressBarContainer>

          <StageActionsRow>
            <TaskPreviewButton onPress={onPressTaskPreview} activeOpacity={0.85}>
              <CheckSquare size={12} color={companionColor} style={{ marginRight: 4 }} />
              <TaskPreviewText>
                {completedTasksCount === totalTasksCount && totalTasksCount > 0 ? (
                  <Text style={{ color: '#4ECDC4', fontWeight: '800', fontSize: 10 }}>
                    ✨ All done! 🎉
                  </Text>
                ) : (
                  <Text style={{ color: '#E1E1E6', fontWeight: '700', fontSize: 10 }}>
                    📝 {remainingCount} left • <Text style={{ color: companionColor, fontWeight: '800' }}>Check</Text>
                  </Text>
                )}
              </TaskPreviewText>
            </TaskPreviewButton>

            <UserJourneyButton onPress={onPressUserJourney} activeOpacity={0.85}>
              <Compass size={12} color="#08080C" style={{ marginRight: 4 }} />
              <UserJourneyButtonText>Road Map</UserJourneyButtonText>
            </UserJourneyButton>
          </StageActionsRow>
        </StageRightColumn>
      </StageContentRow>

      {/* ─── Roster Modal ─── */}
      <Modal animationType="slide" transparent={true} visible={showRosterModal} onRequestClose={() => setShowRosterModal(false)}>
        <ModalOverlay>
          <ModalContentCard>
            <ModalHeader>
              <ModalTitle>Companion Roster</ModalTitle>
              <TouchableOpacity onPress={() => setShowRosterModal(false)}>
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </ModalHeader>
            <ModalSubtitle>Select your companion (All unlocked!)</ModalSubtitle>

            <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
              <RosterItem selected={activeCompanion === 'red_panda'} onPress={() => { onChangeCompanion('red_panda'); setShowRosterModal(false); }}>
                <RosterImageBox>
                  <Image source={COMPANION_IMAGES.red_panda.roster} style={{ width: 56, height: 56, borderRadius: 14 }} resizeMode="contain" />
                </RosterImageBox>
                <RosterTextGroup>
                  <RosterName>Red Panda</RosterName>
                  <RosterDesc>Active buddy! Animated on native devices.</RosterDesc>
                </RosterTextGroup>
                <UnlockedBadge color="#FF7E47">✓</UnlockedBadge>
              </RosterItem>

              <RosterItem selected={activeCompanion === 'brain'} onPress={() => { onChangeCompanion('brain'); setShowRosterModal(false); }}>
                <RosterImageBox>
                  <Image source={COMPANION_IMAGES.brain.roster} style={{ width: 56, height: 56, borderRadius: 14 }} resizeMode="contain" />
                </RosterImageBox>
                <RosterTextGroup>
                  <RosterName>Neuro-Brain</RosterName>
                  <RosterDesc>See-through brain character. Responsive to task completions!</RosterDesc>
                </RosterTextGroup>
                <UnlockedBadge color="#FF7EB9">✓</UnlockedBadge>
              </RosterItem>

              <RosterItem selected={activeCompanion === 'dolphin'} onPress={() => { onChangeCompanion('dolphin'); setShowRosterModal(false); }}>
                <RosterImageBox>
                  <Image source={COMPANION_IMAGES.dolphin.roster} style={{ width: 56, height: 56, borderRadius: 14 }} resizeMode="contain" />
                </RosterImageBox>
                <RosterTextGroup>
                  <RosterName>Deep Work Dolphin</RosterName>
                  <RosterDesc>Flow state surfer. Unlocked by default!</RosterDesc>
                </RosterTextGroup>
                <UnlockedBadge color="#00F2FE">✓</UnlockedBadge>
              </RosterItem>

              <RosterItem selected={activeCompanion === 'fox'} onPress={() => { onChangeCompanion('fox'); setShowRosterModal(false); }}>
                <RosterImageBox>
                  <Image source={COMPANION_IMAGES.fox.roster} style={{ width: 56, height: 56, borderRadius: 14 }} resizeMode="contain" />
                </RosterImageBox>
                <RosterTextGroup>
                  <RosterName>Focus Fox</RosterName>
                  <RosterDesc>Streak strategist. Unlocked by default!</RosterDesc>
                </RosterTextGroup>
                <UnlockedBadge color="#4ECDC4">✓</UnlockedBadge>
              </RosterItem>
            </ScrollView>
          </ModalContentCard>
        </ModalOverlay>
      </Modal>
    </StageCard>
  );
};

// ─── Styled Components ───
const StageCard = styled.View`
  background-color: rgba(14, 14, 18, 0.92);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 10px 12px;
  margin-bottom: 12px;
  margin-top: 4px;
`;

const StageContentRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const CharacterStageBox = styled.TouchableOpacity`
  width: 105px;
  height: 105px;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.04);
`;

const JourneyHintBadge = styled.View`
  position: absolute;
  bottom: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 8px;
  flex-direction: row;
  align-items: center;
  border-width: 1px;
  border-color: rgba(0, 242, 254, 0.3);
`;

const JourneyHintText = styled.Text`
  color: #00F2FE;
  font-size: 8px;
  font-weight: 800;
`;

const StageRightColumn = styled.View`
  flex: 1;
  margin-left: 12px;
`;

const StageHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
`;

const StageTitleArea = styled.View`
  flex: 1;
  margin-right: 6px;
`;

const CompanionName = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.2px;
`;

const CompanionStatusText = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: 600;
  margin-top: 1px;
`;

const RosterTrigger = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #FF7E47;
  padding: 4px 8px;
  border-radius: 12px;
`;

const RosterTriggerText = styled.Text`
  color: #08080C;
  font-size: 9px;
  font-weight: 800;
`;

const ProgressBarContainer = styled.View`
  margin-vertical: 6px;
`;

const ProgressBarHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 3px;
`;

const ProgressBarTrack = styled.View`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.06);
  overflow: hidden;
`;

const ProgressBarFill = styled.View`
  height: 100%;
  border-radius: 2px;
`;

const ProgressLabelText = styled.Text`
  color: #6B6280;
  font-size: 9px;
  font-weight: 700;
`;

const ProgressValueText = styled.Text`
  font-size: 9px;
  font-weight: 800;
`;

const StageActionsRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
`;

const TaskPreviewButton = styled.TouchableOpacity`
  flex: 1.2;
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 6px 8px;
  margin-right: 6px;
  justify-content: center;
`;

const UserJourneyButton = styled.TouchableOpacity`
  flex: 1;
  flex-direction: row;
  align-items: center;
  background-color: #00F2FE;
  border-radius: 10px;
  padding: 6px 8px;
  justify-content: center;
`;

const UserJourneyButtonText = styled.Text`
  color: #08080C;
  font-size: 10px;
  font-weight: 800;
`;

const TaskPreviewText = styled.View`
  justify-content: center;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.88);
  justify-content: flex-end;
`;

const ModalContentCard = styled.View`
  background-color: #0E0E14;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.06);
  max-height: 75%;
  padding: 22px;
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 800;
`;

const ModalSubtitle = styled.Text`
  color: #6B6280;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
  margin-bottom: 20px;
`;

const RosterItem = styled.TouchableOpacity<{ selected: boolean }>`
  flex-direction: row;
  align-items: center;
  background-color: ${(props: any) => props.selected ? 'rgba(255, 126, 71, 0.08)' : 'rgba(255, 255, 255, 0.02)'};
  border-width: 1.5px;
  border-color: ${(props: any) => props.selected ? '#FF7E47' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 10px;
`;

const RosterImageBox = styled.View`
  position: relative;
`;

const RosterTextGroup = styled.View`
  margin-left: 14px;
  flex: 1;
`;

const RosterName = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 700;
`;

const RosterDesc = styled.Text`
  color: #8E8E93;
  font-size: 11px;
  margin-top: 3px;
`;

const UnlockedBadge = styled.Text<{ color: string }>`
  color: ${(props: any) => props.color};
  font-size: 16px;
  font-weight: 800;
`;
