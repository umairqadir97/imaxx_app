import React, { useState, useEffect, useRef } from 'react';
import { Dimensions, Animated, Modal, View, Text } from 'react-native';
import styled from 'styled-components/native';
import { ChevronDown, Info, Play, Pause, RotateCcw, Timer, Radio, Compass, Shuffle, Moon, Flame, Sun, Volume2, HelpCircle } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { togglePlayback, setSoundscape, setVolume, startTimer, stopTimer } from '../store/audioSlice';
import { Waveform } from '../components/Waveform';
import { theme } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SoundPlayerProps {
  onClose: () => void;
  onOpenTimerSheet: () => void;
}

export const SoundPlayer: React.FC<SoundPlayerProps> = ({ onClose, onOpenTimerSheet }) => {
  const dispatch = useAppDispatch();
  const { isPlaying, activeSoundscape, soundscapesList, volume, timerIsActive, timerTimeLeft } = useAppSelector(
    (state) => state.audio
  );

  const [showTuner, setShowTuner] = useState(false);
  const [eqAmbient, setEqAmbient] = useState(0.7);
  const [eqTempo, setEqTempo] = useState(0.5);
  const [eqFocus, setEqFocus] = useState(0.8);

  // Animated values for center graphics
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      // Rotation animation for focus / relax
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();

      // Pulsing scale for sleep moon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 3000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.95, duration: 3000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSoundscapeName = (id: string) => {
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  const getSubtitle = (id: string) => {
    switch (id) {
      case 'focus':
        return 'Altered State Circadian Flow';
      case 'relax':
        return 'Somatic Calm Resonator';
      case 'sleep':
        return 'Night Energy Fade';
      case 'move':
        return 'Ultradian Heartbeat Sync';
      case 'uplift':
        return 'Serotonergic Peak State';
      default:
        return 'Adaptive Acoustic Rhythm';
    }
  };

  const getSoundIcon = (id: string, color: string = '#FFFFFF') => {
    switch (id) {
      case 'focus':
        return <Compass color={color} size={26} />;
      case 'relax':
        return <Shuffle color={color} size={26} />;
      case 'sleep':
        return <Moon color={color} size={26} />;
      case 'move':
        return <Flame color={color} size={26} />;
      case 'uplift':
        return <Sun color={color} size={26} />;
      default:
        return <Compass color={color} size={26} />;
    }
  };

  // Format timer countdown
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render centered artwork based on active soundscape
  const renderArt = () => {
    if (activeSoundscape === 'sleep') {
      return (
        <ArtWrapper style={{ transform: [{ scale: pulseAnim }] }}>
          {/* Crescent Moon */}
          <MoonArtContainer>
            <MoonShape />
            <SparkleDot style={{ top: 20, right: 30 }} />
            <SparkleDot style={{ top: 80, right: 90, width: 4, height: 4 }} />
            <SparkleDot style={{ top: 120, right: 40, width: 6, height: 6 }} />
          </MoonArtContainer>
        </ArtWrapper>
      );
    }
    
    if (activeSoundscape === 'focus') {
      return (
        <ArtWrapper>
          <AnimatedRing style={{ transform: [{ rotate: rotation }] }}>
            <InnerRingDot style={{ top: 0 }} />
            <InnerRingDot style={{ bottom: 0 }} />
            <CircleCenter />
          </AnimatedRing>
        </ArtWrapper>
      );
    }

    // Default: Relax (Hourglass or vertical waves)
    return (
      <ArtWrapper>
        <Waveform isPlaying={isPlaying} height={180} mode="relax" />
      </ArtWrapper>
    );
  };

  return (
    <Container>
      {/* Header bar */}
      <HeaderBar>
        <HeaderButton onPress={onClose}>
          <ChevronDown size={28} color="#FFFFFF" />
        </HeaderButton>
        <TitleContainer>
          <PlayerTitle>{getSoundscapeName(activeSoundscape)}</PlayerTitle>
          <PlayerSubtitle>{getSubtitle(activeSoundscape)}</PlayerSubtitle>
        </TitleContainer>
        <HeaderButton>
          <Info size={22} color="#FFFFFF" />
        </HeaderButton>
      </HeaderBar>

      {/* Main interactive artwork */}
      <ArtSection>
        {renderArt()}
      </ArtSection>

      {/* Waveform graphic overlay */}
      {activeSoundscape !== 'relax' && (
        <WaveOverlay>
          <Waveform isPlaying={isPlaying} height={80} mode={activeSoundscape as any} />
        </WaveOverlay>
      )}

      {/* Soundscape horizontal circular selector */}
      <SelectorSection>
        <SoundscapesCarousel horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {soundscapesList.map((item) => {
            const isActive = activeSoundscape === item.id;
            return (
              <SelectorItem key={item.id} onPress={() => dispatch(setSoundscape(item.id))}>
                <SelectorCircle active={isActive} activeColor={item.baseColor}>
                  <InnerCircle active={isActive}>
                    {getSoundIcon(item.id, isActive ? item.baseColor : '#FFFFFF')}
                  </InnerCircle>
                </SelectorCircle>
                <SelectorLabel active={isActive}>{item.name}</SelectorLabel>
              </SelectorItem>
            );
          })}
        </SoundscapesCarousel>
      </SelectorSection>

      {/* Control Pills row */}
      <ControlPillsRow>
        <PillButton onPress={onOpenTimerSheet}>
          <PillText>{timerIsActive ? `⏳ ${formatTimer(timerTimeLeft)}` : '⏳ Set Timer'}</PillText>
        </PillButton>
        <PillButton>
          <PillText>🎵 Feedback</PillText>
        </PillButton>
        <PillButton onPress={() => setShowTuner(true)}>
          <PillText>🔧 Tune Sound</PillText>
        </PillButton>
      </ControlPillsRow>

      {/* Playback Controls bar */}
      <ControlsBar>
        <ActionButton onPress={() => dispatch(togglePlayback())}>
          {isPlaying ? <Pause size={24} color="#FFFFFF" /> : <Play size={24} color="#FFFFFF" style={{ marginLeft: 2 }} />}
        </ActionButton>
        
        <ActionButton>
          <RotateCcw size={22} color="#FFFFFF" />
        </ActionButton>

        <ActionButton onPress={onOpenTimerSheet} active={timerIsActive}>
          <Timer size={22} color={timerIsActive ? '#9B7EDE' : '#FFFFFF'} />
        </ActionButton>

        <ActionButton>
          <Radio size={22} color="#FFFFFF" />
        </ActionButton>
      </ControlsBar>

      {/* Drag up bottom sheet indicator */}
      <ExploreHandle>
        <DragIndicator />
        <ExploreText>Explore Scenarios</ExploreText>
      </ExploreHandle>

      {/* Sound Tuner Modal */}
      <Modal visible={showTuner} transparent={true} animationType="slide" onRequestClose={() => setShowTuner(false)}>
        <TunerModalBackdrop onPress={() => setShowTuner(false)}>
          <TunerModalContainer onPress={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>Sound Tuner</ModalTitle>
              <ClosePill onPress={() => setShowTuner(false)}>
                <PillText>Done</PillText>
              </ClosePill>
            </ModalHeaderRow>

            <SliderGroup>
              <SliderLabelRow>
                <SliderLabel>Ambient Intensity (Noise Layer)</SliderLabel>
                <SliderValue>{Math.round(eqAmbient * 100)}%</SliderValue>
              </SliderLabelRow>
              <MockSliderTrack onPress={(e) => setEqAmbient(0.4)}>
                <MockSliderFill width={eqAmbient * 100} color={theme.colors.accentPrimary} />
                <MockSliderThumb left={eqAmbient * 100} />
              </MockSliderTrack>
            </SliderGroup>

            <SliderGroup>
              <SliderLabelRow>
                <SliderLabel>Melody / Rhythm Beat (Heart Tempos)</SliderLabel>
                <SliderValue>{Math.round(eqTempo * 100)}%</SliderValue>
              </SliderLabelRow>
              <MockSliderTrack onPress={(e) => setEqTempo(0.6)}>
                <MockSliderFill width={eqTempo * 100} color={theme.colors.success} />
                <MockSliderThumb left={eqTempo * 100} />
              </MockSliderTrack>
            </SliderGroup>

            <SliderGroup>
              <SliderLabelRow>
                <SliderLabel>High Frequency (Focus Sparkles)</SliderLabel>
                <SliderValue>{Math.round(eqFocus * 100)}%</SliderValue>
              </SliderLabelRow>
              <MockSliderTrack onPress={(e) => setEqFocus(0.85)}>
                <MockSliderFill width={eqFocus * 100} color={theme.colors.warning} />
                <MockSliderThumb left={eqFocus * 100} />
              </MockSliderTrack>
            </SliderGroup>

            <VolumeControlRow>
              <Volume2 size={18} color="#6B6280" />
              <VolumeText>Dynamic Volume Auto-adjusts with heart rate</VolumeText>
            </VolumeControlRow>
          </TunerModalContainer>
        </TunerModalBackdrop>
      </Modal>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: #000000;
  padding-bottom: 24px;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 16px 10px 16px;
  height: 110px;
`;

const HeaderButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  justify-content: center;
  align-items: center;
`;

const TitleContainer = styled.View`
  align-items: center;
`;

const PlayerTitle = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
`;

const PlayerSubtitle = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
`;

const ArtSection = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  max-height: ${SCREEN_HEIGHT * 0.4}px;
`;

const ArtWrapper = styled(Animated.View)`
  width: 220px;
  height: 220px;
  justify-content: center;
  align-items: center;
`;

// Sleep art elements: Crescent Moon
const MoonArtContainer = styled.View`
  position: relative;
  width: 140px;
  height: 140px;
`;

const MoonShape = styled.View`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  background-color: transparent;
  border-left-width: 22px;
  border-left-color: #FFFFFF;
  border-bottom-width: 12px;
  border-bottom-color: #FFFFFF;
  transform: rotate(-15deg);
  shadow-color: #9B7EDE;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
`;

const SparkleDot = styled.View`
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 2.5px;
  background-color: #FFFFFF;
  shadow-color: #FFFFFF;
  shadow-opacity: 0.9;
  shadow-radius: 4px;
`;

// Focus art elements: Concentric Animated Rings
const AnimatedRing = styled(Animated.View)`
  width: 150px;
  height: 150px;
  border-radius: 75px;
  border-width: 2px;
  border-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
  position: relative;
`;

const InnerRingDot = styled.View`
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: #FFFFFF;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.9;
  shadow-radius: 6px;
`;

const CircleCenter = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #FFFFFF;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.9;
  shadow-radius: 10px;
`;

const WaveOverlay = styled.View`
  height: 85px;
  justify-content: center;
  margin-bottom: 10px;
`;

const SelectorSection = styled.View`
  margin-bottom: 20px;
`;

const SoundscapesCarousel = styled.ScrollView`
  flex-direction: row;
`;

const SelectorItem = styled.TouchableOpacity`
  align-items: center;
  margin-right: 16px;
  width: 70px;
`;

const SelectorCircle = styled.View<{ active: boolean; activeColor: string }>`
  width: 62px;
  height: 62px;
  border-radius: 31px;
  justify-content: center;
  align-items: center;
  border-width: ${props => props.active ? '2px' : '1px'};
  border-color: ${props => props.active ? props.activeColor : 'rgba(255, 255, 255, 0.15)'};
  background-color: transparent;
  shadow-color: ${props => props.active ? props.activeColor : 'transparent'};
  shadow-opacity: 0.6;
  shadow-radius: 6px;
`;

const InnerCircle = styled.View<{ active: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.05)' : '#000000'};
  justify-content: center;
  align-items: center;
`;

const SelectorLabel = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FFFFFF' : '#6B6280'};
  font-size: 11px;
  font-weight: 600;
  margin-top: 6px;
`;

const ControlPillsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  padding: 0 20px;
  margin-bottom: 24px;
`;

const PillButton = styled.TouchableOpacity`
  background-color: #1A1528;
  border-radius: 20px;
  padding: 8px 14px;
  margin: 0 4px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.04);
`;

const PillText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 500;
`;

const ControlsBar = styled.View`
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
  padding: 0 30px;
  margin-bottom: 20px;
`;

const ActionButton = styled.TouchableOpacity<{ active?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${props => props.active ? 'rgba(155, 126, 222, 0.15)' : '#1A1528'};
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: ${props => props.active ? '#9B7EDE' : 'rgba(255, 255, 255, 0.04)'};
`;

const ExploreHandle = styled.View`
  align-items: center;
  margin-top: 10px;
`;

const DragIndicator = styled.View`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.2);
  margin-bottom: 6px;
`;

const ExploreText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: bold;
`;

// Sound Tuner UI Components
const TunerModalBackdrop = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const TunerModalContainer = styled.TouchableOpacity`
  background-color: #1A1528;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const ModalHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
`;

const ClosePill = styled.TouchableOpacity`
  background-color: #252038;
  padding: 6px 16px;
  border-radius: 20px;
`;

const SliderGroup = styled.View`
  margin-bottom: 20px;
`;

const SliderLabelRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SliderLabel = styled.Text`
  color: #B8B0D0;
  font-size: 13px;
  font-weight: 500;
`;

const SliderValue = styled.Text`
  color: #9B7EDE;
  font-size: 13px;
  font-weight: bold;
`;

const MockSliderTrack = styled.TouchableOpacity`
  height: 8px;
  border-radius: 4px;
  background-color: #0D0B1A;
  position: relative;
  width: 100%;
`;

const MockSliderFill = styled.View<{ width: number; color: string }>`
  height: 8px;
  border-radius: 4px;
  background-color: ${props => props.color};
  width: ${props => props.width}%;
`;

const MockSliderThumb = styled.View<{ left: number }>`
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: #FFFFFF;
  top: -6px;
  left: ${props => props.left - 3}%;
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 3px;
  elevation: 3;
`;

const VolumeControlRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
  background-color: #252038;
  padding: 12px;
  border-radius: 12px;
`;

const VolumeText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-left: 10px;
  flex: 1;
`;
