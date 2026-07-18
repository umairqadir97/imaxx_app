import React from 'react';
import styled from 'styled-components/native';
import { Compass, Flame, ShieldAlert, Award, Clock, ArrowRight, RotateCcw } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { resetOnboarding } from '../store/habitSlice';
import { CircadianWidget } from '../components/CircadianWidget';
import { GlassCard } from '../components/GlassCard';

interface StatsDashboardProps {
  onOpenPaywall: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ onOpenPaywall }) => {
  const dispatch = useAppDispatch();
  const { habits, focusScoreTotal, listeningTimeTotal } = useAppSelector((state) => state.habits);

  const formatHours = (seconds: number) => {
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs} hrs`;
  };

  const getCompletedCount = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return habits.filter(h => h.completions.includes(todayStr)).length;
  };

  return (
    <Container>
      <HeaderBar>
        <HeaderTitle>Mind Stats</HeaderTitle>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <ProfileCard>
          <AvatarWrapper>
            <AvatarText>D</AvatarText>
          </AvatarWrapper>
          <ProfileInfo>
            <ProfileName>Diana Prince</ProfileName>
            <ProfileLevel>ADHD Explorer • Level 4</ProfileLevel>
          </ProfileInfo>
          <BadgeReward>
            <Award size={20} color="#FFB347" />
          </BadgeReward>
        </ProfileCard>

        {/* Circadian rhythm energy curve */}
        <CircadianWrapper>
          <CircadianWidget />
        </CircadianWrapper>

        {/* Statistics Grid */}
        <SectionTitle>Key Metrics</SectionTitle>
        <StatsGrid>
          <StatBox>
            <StatIconCircle color="#9B7EDE">
              <Clock size={20} color="#9B7EDE" />
            </StatIconCircle>
            <StatValue>{formatHours(listeningTimeTotal)}</StatValue>
            <StatLabel>Focus Listening</StatLabel>
          </StatBox>

          <StatBox>
            <StatIconCircle color="#4ECDC4">
              <Award size={20} color="#4ECDC4" />
            </StatIconCircle>
            <StatValue>{focusScoreTotal} pts</StatValue>
            <StatLabel>Focus Points</StatLabel>
          </StatBox>
        </StatsGrid>

        <StatsGrid style={{ marginTop: 12 }}>
          <StatBox>
            <StatIconCircle color="#FFB347">
              <Flame size={20} color="#FFB347" />
            </StatIconCircle>
            <StatValue>{getCompletedCount()} / {habits.length}</StatValue>
            <StatLabel>Habits Completed Today</StatLabel>
          </StatBox>

          <StatBox>
            <StatIconCircle color="#FF6B6B">
              <Compass size={20} color="#FF6B6B" />
            </StatIconCircle>
            <StatValue>86%</StatValue>
            <StatLabel>Cognitive Flow Index</StatLabel>
          </StatBox>
        </StatsGrid>

        {/* Custom triggers & Reset */}
        <SectionTitle>Preferences & System</SectionTitle>

        <SettingItem onPress={onOpenPaywall}>
          <SettingItemText>Unlock iMaxx Premium</SettingItemText>
          <ArrowRight size={16} color="#6B6280" />
        </SettingItem>

        <SettingItem onPress={() => dispatch(resetOnboarding())}>
          <SettingItemText style={{ color: '#FF6B6B' }}>Reset Onboarding Flow</SettingItemText>
          <RotateCcw size={16} color="#FF6B6B" />
        </SettingItem>

        <ExtraSpacing />
      </ScrollContent>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: transparent;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
  background-color: #0D0B1A;
`;

const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: bold;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const ProfileCard = styled(GlassCard)`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  margin-top: 10px;
  margin-bottom: 20px;
`;

const AvatarWrapper = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #9B7EDE;
  justify-content: center;
  align-items: center;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.3;
  shadow-radius: 6px;
`;

const AvatarText = styled.Text`
  color: #0D0B1A;
  font-size: 18px;
  font-weight: 800;
`;

const ProfileInfo = styled.View`
  flex: 1;
  margin-left: 14px;
`;

const ProfileName = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
`;

const ProfileLevel = styled.Text`
  color: #6B6280;
  font-size: 12px;
  margin-top: 2px;
`;

const BadgeReward = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(255, 179, 71, 0.1);
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 179, 71, 0.2);
`;

const CircadianWrapper = styled.View`
  margin-bottom: 24px;
`;

const SectionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 8px;
`;

const StatsGrid = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

const StatBox = styled(GlassCard)`
  width: 48%;
  padding: 16px 14px;
  align-items: flex-start;
`;

const StatIconCircle = styled.View<{ color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${props => `${props.color}10`};
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  border-width: 1px;
  border-color: ${props => `${props.color}20`};
`;

const StatValue = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 4px;
`;

const StatLabel = styled.Text`
  color: #B8B0D0;
  font-size: 11px;
  font-weight: 500;
`;

const SettingItem = styled.TouchableOpacity`
  background-color: #1A1528;
  border-radius: 12px;
  padding: 16px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.04);
`;

const SettingItemText = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
`;

const ExtraSpacing = styled.View`
  height: 120px;
`;
