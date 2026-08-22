import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/native';
import { X, Check, Lock, Trophy, Star, Zap, Compass, ChevronRight, Award, ShieldCheck } from 'lucide-react-native';

interface JourneyStage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  status: 'completed' | 'active' | 'locked';
  xp: number;
  reward: string;
  requirement: string;
  icon: string;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 1,
    title: 'Alpha Wave Initiation',
    subtitle: 'Stage 1 • Basic Focus Protocol',
    description: 'Build baseline focus awareness by completing your first 3 focus sessions and setting up 2 daily micro-habits.',
    status: 'completed',
    xp: 150,
    reward: 'Starter Neural Aura & 150 XP',
    requirement: 'Complete 3 Focus Sessions',
    icon: '🌱',
  },
  {
    id: 2,
    title: 'Dopamine Detox',
    subtitle: 'Stage 2 • Sensory Calming',
    description: 'Eliminate digital noise. Complete 5 consecutive micro-habits without breaking your daily streak.',
    status: 'completed',
    xp: 300,
    reward: 'Unlocked Deep Work Dolphin & 300 XP',
    requirement: '5-Day Habit Streak',
    icon: '💧',
  },
  {
    id: 3,
    title: 'Deep Work Sanctuary',
    subtitle: 'Stage 3 • Active Mission',
    description: 'Achieve uninterrupted flow state! Accumulate 10 total focus hours and keep companion energy above 80%.',
    status: 'active',
    xp: 500,
    reward: 'Golden Neuro-Brain & 500 XP',
    requirement: '10 Focus Hours + 80% Energy',
    icon: '⚡',
  },
  {
    id: 4,
    title: 'Hyperfocus Citadel',
    subtitle: 'Stage 4 • Advanced Training',
    description: 'Master high-intensity Pomodoro cycles with zero distractions. Complete 20 pomodoros in a single week.',
    status: 'locked',
    xp: 800,
    reward: 'Focus Fox Companion & 800 XP',
    requirement: 'Reach 20 Pomodoros',
    icon: '🏰',
  },
  {
    id: 5,
    title: 'Zenith Mind Master',
    subtitle: 'Stage 5 • Master Level',
    description: 'Synthesize consistency into lifetime habits. Maintain a 30-day streak across all active habit cards.',
    status: 'locked',
    xp: 1200,
    reward: 'Diamond Crown Aura & 1200 XP',
    requirement: '30-Day Master Streak',
    icon: '👑',
  },
  {
    id: 6,
    title: 'Flow State Sovereign',
    subtitle: 'Stage 6 • Apex Mastery',
    description: 'Ultimate ADHD mastery achieved! Your brain operates at peak efficiency with custom widget automations.',
    status: 'locked',
    xp: 2000,
    reward: 'Apex Master Trophy & 2000 XP',
    requirement: '50 Total Focus Hours',
    icon: '🌌',
  },
];

interface UserJourneyMapModalProps {
  visible: boolean;
  onClose: () => void;
  currentXP?: number;
  userRank?: string;
}

export const UserJourneyMapModal: React.FC<UserJourneyMapModalProps> = ({
  visible,
  onClose,
  currentXP = 1450,
  userRank = 'Deep Work Initiate',
}) => {
  const [selectedStage, setSelectedStage] = useState<JourneyStage | null>(JOURNEY_STAGES[2]); // Default to active stage 3

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <ModalBackdrop activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <ContainerCard>
            {/* Header section */}
            <HeaderArea>
              <HeaderTopRow>
                <TitleGroup>
                  <TitleRow>
                    <Compass size={22} color="#FF7E47" style={{ marginRight: 8 }} />
                    <ModalTitleText>Neuro-User Journey</ModalTitleText>
                  </TitleRow>
                  <ModalSubText>Mission Map • ADHD Focus Skill Progression</ModalSubText>
                </TitleGroup>
                <CloseBtn onPress={onClose}>
                  <X size={20} color="#FFFFFF" />
                </CloseBtn>
              </HeaderTopRow>

              {/* Player Rank & XP Banner */}
              <RankBanner>
                <RankLeft>
                  <Trophy size={18} color="#FFB347" style={{ marginRight: 6 }} />
                  <RankTextGroup>
                    <RankTitle>{userRank}</RankTitle>
                    <RankSubtitle>Level 3 Explorer</RankSubtitle>
                  </RankTextGroup>
                </RankLeft>
                <RankRight>
                  <Zap size={14} color="#00F2FE" style={{ marginRight: 4 }} />
                  <XPText>{currentXP} / 2,000 XP</XPText>
                </RankRight>
              </RankBanner>
            </HeaderArea>

            {/* Winding Stage Road Map */}
            <MapScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 16 }}>
              {JOURNEY_STAGES.map((stage, index) => {
                const isSelected = selectedStage?.id === stage.id;
                const isLast = index === JOURNEY_STAGES.length - 1;
                // Alternate left/right offset for winding game road feel
                const alignment = index % 2 === 0 ? 'flex-start' : 'flex-end';

                return (
                  <View key={stage.id} style={{ alignItems: 'center', marginBottom: 4 }}>
                    {/* Node Row */}
                    <NodeRow style={{ justifyContent: alignment === 'flex-start' ? 'flex-start' : 'flex-end', width: '100%', paddingHorizontal: 20 }}>
                      <NodeWrapper onPress={() => setSelectedStage(stage)} activeOpacity={0.85}>
                        <NodeCircle status={stage.status} isSelected={isSelected}>
                          <NodeIconText>{stage.icon}</NodeIconText>
                          {stage.status === 'completed' && (
                            <BadgeCheckWrapper>
                              <Check size={10} color="#08080C" strokeWidth={3} />
                            </BadgeCheckWrapper>
                          )}
                          {stage.status === 'locked' && (
                            <BadgeLockWrapper>
                              <Lock size={9} color="#8E8E93" />
                            </BadgeLockWrapper>
                          )}
                          {stage.status === 'active' && (
                            <ActivePulseRing />
                          )}
                        </NodeCircle>

                        <NodeTextCard status={stage.status} isSelected={isSelected}>
                          <NodeTitle>{stage.title}</NodeTitle>
                          <NodeSubtitle>{stage.subtitle}</NodeSubtitle>
                        </NodeTextCard>
                      </NodeWrapper>
                    </NodeRow>

                    {/* Connecting Road Segment */}
                    {!isLast && (
                      <RoadConnectorSegment status={JOURNEY_STAGES[index + 1].status !== 'locked' ? 'active' : 'locked'} />
                    )}
                  </View>
                );
              })}
            </MapScrollView>

            {/* Selected Stage Detail Card */}
            {selectedStage && (
              <StageDetailCard status={selectedStage.status}>
                <DetailHeader>
                  <DetailIconBox>{selectedStage.icon}</DetailIconBox>
                  <DetailTitleBox>
                    <DetailTitle>{selectedStage.title}</DetailTitle>
                    <DetailBadge status={selectedStage.status}>
                      {selectedStage.status === 'completed' ? '✓ CLEARED' : selectedStage.status === 'active' ? '🔥 IN PROGRESS' : '🔒 LOCKED'}
                    </DetailBadge>
                  </DetailTitleBox>
                </DetailHeader>

                <DetailDesc>{selectedStage.description}</DetailDesc>

                <DetailStatsRow>
                  <DetailStatItem>
                    <DetailStatLabel>Target Goal</DetailStatLabel>
                    <DetailStatValue>{selectedStage.requirement}</DetailStatValue>
                  </DetailStatItem>
                  <DetailStatItem>
                    <DetailStatLabel>Reward</DetailStatLabel>
                    <DetailStatValue style={{ color: '#FFB347' }}>{selectedStage.reward}</DetailStatValue>
                  </DetailStatItem>
                </DetailStatsRow>
              </StageDetailCard>
            )}
          </ContainerCard>
        </TouchableWithoutFeedback>
      </ModalBackdrop>
    </Modal>
  );
};

// ─── Styled Components ───
const ModalBackdrop = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.88);
  justify-content: flex-end;
`;

const ContainerCard = styled.View`
  background-color: #0E0E14;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
  height: 82%;
  padding-bottom: 20px;
`;

const HeaderArea = styled.View`
  padding: 20px 20px 14px 20px;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.05);
`;

const HeaderTopRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const TitleGroup = styled.View``;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ModalTitleText = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 800;
`;

const ModalSubText = styled.Text`
  color: #6B6280;
  font-size: 12px;
  font-weight: 600;
  margin-top: 3px;
`;

const CloseBtn = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.06);
  padding: 8px;
  border-radius: 20px;
`;

const RankBanner = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 126, 71, 0.08);
  border-width: 1px;
  border-color: rgba(255, 126, 71, 0.2);
  border-radius: 16px;
  padding: 10px 14px;
  margin-top: 14px;
`;

const RankLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const RankTextGroup = styled.View``;

const RankTitle = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 800;
`;

const RankSubtitle = styled.Text`
  color: #FFB347;
  font-size: 10px;
  font-weight: 600;
`;

const RankRight = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(0, 242, 254, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
`;

const XPText = styled.Text`
  color: #00F2FE;
  font-size: 11px;
  font-weight: 800;
`;

const MapScrollView = styled.ScrollView`
  flex: 1;
`;

const NodeRow = styled.View`
  margin-vertical: 6px;
`;

const NodeWrapper = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const NodeCircle = styled.View<{ status: string; isSelected: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  justify-content: center;
  align-items: center;
  background-color: ${props =>
    props.status === 'completed'
      ? 'rgba(78, 205, 196, 0.2)'
      : props.status === 'active'
      ? 'rgba(255, 126, 71, 0.25)'
      : 'rgba(255, 255, 255, 0.03)'};
  border-width: ${props => (props.isSelected ? '2.5px' : '1.5px')};
  border-color: ${props =>
    props.isSelected
      ? '#00F2FE'
      : props.status === 'completed'
      ? '#4ECDC4'
      : props.status === 'active'
      ? '#FF7E47'
      : 'rgba(255, 255, 255, 0.1)'};
  position: relative;
`;

const NodeIconText = styled.Text`
  font-size: 22px;
`;

const BadgeCheckWrapper = styled.View`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: #4ECDC4;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  justify-content: center;
  align-items: center;
`;

const BadgeLockWrapper = styled.View`
  position: absolute;
  bottom: -2px;
  right: -2px;
  background-color: #1E1E26;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const ActivePulseRing = styled.View`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  border-width: 1.5px;
  border-color: #FF7E47;
  opacity: 0.6;
`;

const NodeTextCard = styled.View<{ status: string; isSelected: boolean }>`
  margin-left: 12px;
  background-color: ${props => props.isSelected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)'};
  border-width: 1px;
  border-color: ${props => props.isSelected ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255, 255, 255, 0.04)'};
  border-radius: 14px;
  padding: 8px 12px;
  max-width: 200px;
`;

const NodeTitle = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
`;

const NodeSubtitle = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  margin-top: 2px;
`;

const RoadConnectorSegment = styled.View<{ status: string }>`
  width: 3px;
  height: 24px;
  background-color: ${props => props.status === 'active' ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 1.5px;
  margin-vertical: 2px;
`;

const StageDetailCard = styled.View<{ status: string }>`
  margin: 10px 16px 0 16px;
  background-color: rgba(14, 14, 20, 0.95);
  border-width: 1.5px;
  border-color: ${props => props.status === 'completed' ? '#4ECDC4' : props.status === 'active' ? '#FF7E47' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 20px;
  padding: 14px;
`;

const DetailHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
`;

const DetailIconBox = styled.Text`
  font-size: 26px;
  margin-right: 10px;
`;

const DetailTitleBox = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const DetailTitle = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 800;
`;

const DetailBadge = styled.Text<{ status: string }>`
  color: ${props => props.status === 'completed' ? '#4ECDC4' : props.status === 'active' ? '#FF7E47' : '#8E8E93'};
  font-size: 10px;
  font-weight: 800;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 8px;
`;

const DetailDesc = styled.Text`
  color: #C5C5D0;
  font-size: 11px;
  line-height: 16px;
  margin-bottom: 10px;
`;

const DetailStatsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 12px;
`;

const DetailStatItem = styled.View``;

const DetailStatLabel = styled.Text`
  color: #6B6280;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
`;

const DetailStatValue = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 800;
  margin-top: 2px;
`;
