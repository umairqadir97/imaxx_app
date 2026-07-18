import React, { useState } from 'react';
import styled from 'styled-components/native';
import { ShieldCheck, Compass, Sparkles, MapPin, Heart, Bell } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleStruggle, completeOnboarding } from '../store/habitSlice';

export const Onboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedStruggles = useAppSelector((state) => state.habits.selectedStruggles);
  const [step, setStep] = useState(1); // 1: Splash, 2: Struggles, 3: Permissions

  const struggles = [
    { id: 'task_paralysis', title: 'Task Paralysis', desc: 'Struggling to start new tasks' },
    { id: 'distractibility', title: 'Distractibility', desc: 'Hard to maintain focus' },
    { id: 'sleep_troubles', title: 'Sleep Issues', desc: 'Racing mind at bedtime' },
    { id: 'anxiety', title: 'Anxiety & Noise', desc: 'High mental overload' },
    { id: 'lacking_routine', title: 'Lacking Routine', desc: 'Hard to maintain habits' },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      dispatch(completeOnboarding());
    }
  };

  const isStruggleSelected = (id: string) => selectedStruggles.includes(id);

  if (step === 1) {
    return (
      <Container>
        <SplashContent>
          <LogoGlow>
            <LogoIcon>
              <Compass size={60} color="#9B7EDE" />
            </LogoIcon>
          </LogoGlow>
          <Title>iMaxx</Title>
          <Subtitle>Your brain works differently. Let's build focus and calm together.</Subtitle>
          <BeginButton onPress={handleNext}>
            <ButtonText>Get Started</ButtonText>
          </BeginButton>
        </SplashContent>
      </Container>
    );
  }

  if (step === 2) {
    return (
      <Container>
        <StepIndicator>Step 2 of 3</StepIndicator>
        <Header>What struggles do you want to conquer?</Header>
        <Description>We will adjust your soundscapes and habit routines based on your focus profile.</Description>

        <StrugglesScroll>
          {struggles.map((s) => {
            const active = isStruggleSelected(s.id);
            return (
              <StruggleCard
                key={s.id}
                active={active}
                onPress={() => dispatch(toggleStruggle(s.id))}
              >
                <StruggleHeader>
                  <StruggleTitle active={active}>{s.title}</StruggleTitle>
                  <Checkbox active={active}>
                    {active && <ShieldCheck size={14} color="#0D0B1A" />}
                  </Checkbox>
                </StruggleHeader>
                <StruggleDesc active={active}>{s.desc}</StruggleDesc>
              </StruggleCard>
            );
          })}
        </StrugglesScroll>

        <ActionContainer>
          <NextButton onPress={handleNext} disabled={selectedStruggles.length === 0}>
            <ButtonText disabled={selectedStruggles.length === 0}>Next</ButtonText>
          </NextButton>
        </ActionContainer>
      </Container>
    );
  }

  return (
    <Container>
      <StepIndicator>Step 3 of 3</StepIndicator>
      <Header>Grant permissions for real-time tuning</Header>
      <Description>iMaxx adjusts its ambient engine dynamically based on context.</Description>

      <PermissionsList>
        <PermissionRow>
          <IconWrapper color="#9B7EDE">
            <MapPin size={20} color="#9B7EDE" />
          </IconWrapper>
          <PermissionInfo>
            <PermissionTitle>Location Weather Sync</PermissionTitle>
            <PermissionDesc>Adapts acoustics to match local sunlight, rain, and pressure levels.</PermissionDesc>
          </PermissionInfo>
        </PermissionRow>

        <PermissionRow>
          <IconWrapper color="#4ECDC4">
            <Heart size={20} color="#4ECDC4" />
          </IconWrapper>
          <PermissionInfo>
            <PermissionTitle>Biometrics & Heart Rate</PermissionTitle>
            <PermissionDesc>Matches sound tempo to your active stress levels and sleep states.</PermissionDesc>
          </PermissionInfo>
        </PermissionRow>

        <PermissionRow>
          <IconWrapper color="#FFB347">
            <Bell size={20} color="#FFB347" />
          </IconWrapper>
          <PermissionInfo>
            <PermissionTitle>Smart Reminders</PermissionTitle>
            <PermissionDesc>Gentle nudges to start focus sessions and complete micro-habits.</PermissionDesc>
          </PermissionInfo>
        </PermissionRow>
      </PermissionsList>

      <ActionContainer>
        <ActivateButton onPress={handleNext}>
          <Sparkles size={18} color="#0D0B1A" style={{ marginRight: 8 }} />
          <ButtonText>Activate iMaxx</ButtonText>
        </ActivateButton>
      </ActionContainer>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: #0D0B1A;
  padding: 24px;
  justify-content: center;
`;

const SplashContent = styled.View`
  align-items: center;
  justify-content: center;
`;

const LogoGlow = styled.View`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background-color: rgba(155, 126, 222, 0.1);
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  border-width: 1px;
  border-color: rgba(155, 126, 222, 0.2);
  shadow-color: #9B7EDE;
  shadow-offset: 0px 0px;
  shadow-opacity: 0.5;
  shadow-radius: 20px;
`;

const LogoIcon = styled.View`
  width: 100px;
  height: 100px;
  border-radius: 50px;
  background-color: #1A1528;
  justify-content: center;
  align-items: center;
`;

const Title = styled.Text`
  color: #FFFFFF;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: 2px;
  margin-bottom: 12px;
`;

const Subtitle = styled.Text`
  color: #B8B0D0;
  font-size: 16px;
  text-align: center;
  line-height: 24px;
  padding: 0 20px;
  margin-bottom: 40px;
`;

const BeginButton = styled.TouchableOpacity`
  background-color: #9B7EDE;
  padding: 16px 40px;
  border-radius: 30px;
  shadow-color: #9B7EDE;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 10px;
`;

const StepIndicator = styled.Text`
  color: #9B7EDE;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const Header = styled.Text`
  color: #FFFFFF;
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const Description = styled.Text`
  color: #B8B0D0;
  font-size: 14px;
  margin-bottom: 24px;
  line-height: 20px;
`;

const StrugglesScroll = styled.ScrollView`
  flex: 1;
  margin-bottom: 20px;
`;

const StruggleCard = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(155, 126, 222, 0.15)' : '#1A1528'};
  border-width: 1px;
  border-color: ${props => props.active ? '#9B7EDE' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const StruggleHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const StruggleTitle = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#FFFFFF' : '#B8B0D0'};
  font-size: 16px;
  font-weight: bold;
`;

const Checkbox = styled.View<{ active: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border-width: 1.5px;
  border-color: ${props => props.active ? '#9B7EDE' : '#6B6280'};
  background-color: ${props => props.active ? '#9B7EDE' : 'transparent'};
  justify-content: center;
  align-items: center;
`;

const StruggleDesc = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#C4A8F5' : '#6B6280'};
  font-size: 13px;
`;

const ActionContainer = styled.View`
  width: 100%;
`;

const NextButton = styled.TouchableOpacity<{ disabled: boolean }>`
  background-color: ${props => props.disabled ? '#252038' : '#9B7EDE'};
  padding: 16px;
  border-radius: 30px;
  align-items: center;
`;

const ButtonText = styled.Text<{ disabled?: boolean }>`
  color: ${props => props.disabled ? '#6B6280' : '#0D0B1A'};
  font-size: 16px;
  font-weight: bold;
`;

const PermissionsList = styled.View`
  flex: 1;
  justify-content: center;
`;

const PermissionRow = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: #1A1528;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.04);
`;

const IconWrapper = styled.View<{ color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${props => `${props.color}15`};
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`;

const PermissionInfo = styled.View`
  flex: 1;
`;

const PermissionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const PermissionDesc = styled.Text`
  color: #6B6280;
  font-size: 12px;
  line-height: 16px;
`;

const ActivateButton = styled.TouchableOpacity`
  background-color: #9B7EDE;
  padding: 16px;
  border-radius: 30px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  shadow-color: #9B7EDE;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 10px;
`;
