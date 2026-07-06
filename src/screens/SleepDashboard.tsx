import React from 'react';
import styled from 'styled-components/native';
import { Bell, Play, Moon, Compass, Sun, HelpCircle } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { setSoundscape } from '../store/audioSlice';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../theme/colors';

interface SleepDashboardProps {
  onOpenPlayer: () => void;
  onOpenPaywall: () => void;
}

export const SleepDashboard: React.FC<SleepDashboardProps> = ({ onOpenPlayer, onOpenPaywall }) => {
  const dispatch = useAppDispatch();
  const { activeSoundscape, isPremiumUnlocked } = useAppSelector((state) => state.audio);

  const sleepSounds = [
    { id: 'sleep_1', name: 'White noise', desc: 'Best relaxing sounds', duration: '30 min', soundId: 'sleep', color: '#B8B0D0', img: 'https://images.unsplash.com/photo-1511289081367-462f6de910f5?w=100' },
    { id: 'sleep_2', name: 'Ocean wave', desc: 'Subsonic surf rhythms', duration: '60 min', soundId: 'relax', color: '#4ECDC4', img: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=100' },
    { id: 'sleep_3', name: 'Forest rain', desc: 'Acoustic tree drops', duration: '15 min', soundId: 'sleep', color: '#9B7EDE', img: 'https://images.unsplash.com/photo-1486016006115-74a41448aea2?w=100' },
    { id: 'sleep_4', name: 'Campfire', desc: 'Crackling wood sparks', duration: '40 min', soundId: 'move', color: '#FFB347', img: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?w=100' },
  ];

  const handleSoundCardPress = (soundId: string) => {
    dispatch(setSoundscape(soundId));
    onOpenPlayer();
  };

  return (
    <Container>
      {/* Sticky top header */}
      <HeaderRow>
        <HeaderInfo>
          <GreetingText>Hi, Diana!</GreetingText>
          <WelcomeText>Welcome to Somora</WelcomeText>
        </HeaderInfo>
        <NotificationButton onPress={onOpenPaywall}>
          <Bell size={20} color="#FFFFFF" />
          <BadgeDot />
        </NotificationButton>
      </HeaderRow>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <DoubleCardsRow>
          <LastSleepCard>
            <CardLabel>Last sleep</CardLabel>
            <BigNumberText>21</BigNumberText>
            <CardSublabel>April</CardSublabel>
          </LastSleepCard>

          <TimeInBedCard>
            <CardLabel>Time in bed</CardLabel>
            <BigTimeText>07 h 22 min</BigTimeText>
            <TimeIntervalText>11:00 PM – 8:00 AM</TimeIntervalText>
            <ProgressBarContainer>
              <ProgressBarFill width="85%" color="#9B7EDE" />
            </ProgressBarContainer>
          </TimeInBedCard>
        </DoubleCardsRow>

        {/* Sleep Stages */}
        <SectionTitle>Sleep stages</SectionTitle>
        <StagesCard>
          <StageRow>
            <StageInfo>
              <StageDot color="#7B5FB5" />
              <StageLabel>Light</StageLabel>
            </StageInfo>
            <StageBarWrapper>
              <StageBarFill width="55%" color="#7B5FB5" />
            </StageBarWrapper>
            <StageTime>4 h 03 min</StageTime>
          </StageRow>

          <StageRow>
            <StageInfo>
              <StageDot color="#4ECDC4" />
              <StageLabel>REM</StageLabel>
            </StageInfo>
            <StageBarWrapper>
              <StageBarFill width="25%" color="#4ECDC4" />
            </StageBarWrapper>
            <StageTime>1 h 50 min</StageTime>
          </StageRow>

          <StageRow>
            <StageInfo>
              <StageDot color="#9B7EDE" />
              <StageLabel>Deep</StageLabel>
            </StageInfo>
            <StageBarWrapper>
              <StageBarFill width="15%" color="#9B7EDE" />
            </StageBarWrapper>
            <StageTime>1 h 29 min</StageTime>
          </StageRow>
          
          <TotalsRow>
            <TotalsText>Total Deep & REM sleep: 3 h 19 min</TotalsText>
          </TotalsRow>
        </StagesCard>

        {/* Snoring Mic Wave */}
        <SectionTitle>Snoring</SectionTitle>
        <SnoreCard>
          <SnoreWaveformContainer>
            {/* Draw microphone sensor wave dots */}
            <WaveBar height={10} />
            <WaveBar height={14} />
            <WaveBar height={8} />
            <WaveBar height={18} />
            <WaveBar height={26} />
            <WaveBar height={34} />
            <WaveBar height={14} />
            <WaveBar height={8} />
            <WaveBar height={10} />
            <WaveBar height={22} />
            <WaveBar height={16} />
            <WaveBar height={12} />
          </SnoreWaveformContainer>
          <StatsButton>
            <StatsButtonText>Show more statistics</StatsButtonText>
          </StatsButton>
        </SnoreCard>

        {/* Sleep sounds carousel list */}
        <SectionHeaderRow>
          <SectionTitle>Sounds for sleep</SectionTitle>
          <SubTitleLabel>Best relaxing sounds</SubTitleLabel>
        </SectionHeaderRow>

        <SoundsHorizontalRow horizontal showsHorizontalScrollIndicator={false}>
          {sleepSounds.map((sound) => {
            const isActive = activeSoundscape === sound.soundId;
            return (
              <SoundCard key={sound.id} onPress={() => handleSoundCardPress(sound.soundId)}>
                <CircularImageWrapper active={isActive}>
                  {/* We draw a gradient background if image is mock */}
                  <MockCircularImage color={sound.color}>
                    {sound.soundId === 'sleep' ? (
                      <Moon color="#FFFFFF" size={24} />
                    ) : sound.soundId === 'relax' ? (
                      <Compass color="#FFFFFF" size={24} />
                    ) : (
                      <Sun color="#FFFFFF" size={24} />
                    )}
                  </MockCircularImage>
                </CircularImageWrapper>
                <SoundName numberOfLines={1}>{sound.name}</SoundName>
                <SoundDuration>{sound.duration}</SoundDuration>
              </SoundCard>
            );
          })}
        </SoundsHorizontalRow>

        <ExtraSpacing />
      </ScrollContent>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: transparent;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 110px;
  background-color: #0D0B1A;
`;

const HeaderInfo = styled.View``;

const GreetingText = styled.Text`
  color: #6B6280;
  font-size: 13px;
  font-weight: 600;
`;

const WelcomeText = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: bold;
  margin-top: 2px;
`;

const NotificationButton = styled.TouchableOpacity`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.04);
  justify-content: center;
  align-items: center;
  position: relative;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const BadgeDot = styled.View`
  position: absolute;
  top: 10px;
  right: 12px;
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: #9B7EDE;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const DoubleCardsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 10px;
  margin-bottom: 20px;
`;

const LastSleepCard = styled(GlassCard)`
  width: 32%;
  height: 120px;
  align-items: center;
  justify-content: center;
`;

const CardLabel = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const BigNumberText = styled.Text`
  color: #FFFFFF;
  font-size: 38px;
  font-weight: 800;
`;

const CardSublabel = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
  font-weight: 600;
`;

const TimeInBedCard = styled(GlassCard)`
  width: 64%;
  height: 120px;
  justify-content: center;
  padding-horizontal: 16px;
`;

const BigTimeText = styled.Text`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 800;
  margin-top: 2px;
  margin-bottom: 4px;
`;

const TimeIntervalText = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
  margin-bottom: 12px;
`;

const ProgressBarContainer = styled.View`
  height: 6px;
  background-color: #0D0B1A;
  border-radius: 3px;
  width: 100%;
`;

const ProgressBarFill = styled.View<{ width: string; color: string }>`
  height: 6px;
  background-color: ${props => props.color};
  border-radius: 3px;
  width: ${props => props.width};
`;

const SectionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const StagesCard = styled(GlassCard)`
  padding: 16px;
  margin-bottom: 20px;
`;

const StageRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const StageInfo = styled.View`
  flex-direction: row;
  align-items: center;
  width: 70px;
`;

const StageDot = styled.View<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${props => props.color};
  margin-right: 8px;
`;

const StageLabel = styled.Text`
  color: #B8B0D0;
  font-size: 13px;
  font-weight: 500;
`;

const StageBarWrapper = styled.View`
  flex: 1;
  height: 8px;
  background-color: #0D0B1A;
  border-radius: 4px;
  margin-horizontal: 12px;
`;

const StageBarFill = styled.View<{ width: string; color: string }>`
  height: 8px;
  border-radius: 4px;
  background-color: ${props => props.color};
  width: ${props => props.width};
`;

const StageTime = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  width: 70px;
  text-align: right;
`;

const TotalsRow = styled.View`
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.05);
  padding-top: 10px;
  margin-top: 4px;
  align-items: center;
`;

const TotalsText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 600;
`;

const SnoreCard = styled(GlassCard)`
  padding: 18px;
  margin-bottom: 24px;
  align-items: center;
`;

const SnoreWaveformContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 50px;
  width: 100%;
  margin-bottom: 14px;
`;

const WaveBar = styled.View<{ height: number }>`
  width: 4px;
  height: ${props => props.height}px;
  border-radius: 2px;
  background-color: #9B7EDE;
  margin-horizontal: 3px;
  opacity: 0.8;
`;

const StatsButton = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
  padding: 8px 24px;
  border-radius: 20px;
`;

const StatsButtonText = styled.Text`
  color: #9B7EDE;
  font-size: 12px;
  font-weight: 600;
`;

const SectionHeaderRow = styled.View`
  margin-bottom: 12px;
`;

const SubTitleLabel = styled.Text`
  color: #6B6280;
  font-size: 12px;
  margin-top: 2px;
`;

const SoundsHorizontalRow = styled.ScrollView`
  flex-direction: row;
  margin-bottom: 20px;
  padding: 4px 0;
`;

const SoundCard = styled.TouchableOpacity`
  margin-right: 18px;
  align-items: center;
  width: 72px;
`;

const CircularImageWrapper = styled.View<{ active: boolean }>`
  width: 68px;
  height: 68px;
  border-radius: 34px;
  border-width: ${props => props.active ? '2px' : '0px'};
  border-color: #9B7EDE;
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
  shadow-color: ${props => props.active ? '#9B7EDE' : 'transparent'};
  shadow-opacity: 0.6;
  shadow-radius: 5px;
`;

const MockCircularImage = styled.View<{ color: string }>`
  width: 58px;
  height: 58px;
  border-radius: 29px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  opacity: 0.8;
`;

const SoundName = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2px;
`;

const SoundDuration = styled.Text`
  color: #6B6280;
  font-size: 9px;
  font-weight: bold;
`;

const ExtraSpacing = styled.View`
  height: 120px;
`;
