import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Sparkles, Check, X, Shield, Award, Calendar } from 'lucide-react-native';
import { useAppDispatch } from '../store';
import { unlockPremium } from '../store/audioSlice';
import { GlassCard } from '../components/GlassCard';

interface PaywallProps {
  onClose: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'pro' | 'lifetime'>('plus');

  const handleSubscribe = () => {
    dispatch(unlockPremium());
    onClose();
  };

  return (
    <Container>
      {/* Top Close bar */}
      <HeaderBar>
        <Spacer />
        <CloseButton onPress={onClose}>
          <X size={20} color="#FFFFFF" />
        </CloseButton>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Crown Illustration */}
        <HeroSection>
          <GlowCircle>
            <CrownIcon>👑</CrownIcon>
            <SproutText>🌱</SproutText>
          </GlowCircle>
          <Headline>Unlock Your Full Brain</Headline>
          <Subheadline>Build unbreakable ADHD focus routines & access adaptive AI soundscapes.</Subheadline>
        </HeroSection>

        {/* Feature Grid Comparison Table */}
        <FeatureTableContainer>
          <FeatureRow style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', paddingBottom: 8 }}>
            <FeatureHeader>FEATURES</FeatureHeader>
            <TierHeader>FREE</TierHeader>
            <TierHeader active={true}>PLUS</TierHeader>
            <TierHeader>PRO</TierHeader>
          </FeatureRow>

          <FeatureRow>
            <FeatureName>15+ Soundscapes</FeatureName>
            <FeatureVal><X size={14} color="#6B6280" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
          </FeatureRow>

          <FeatureRow>
            <FeatureName>ADHD Focus Presets</FeatureName>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
          </FeatureRow>

          <FeatureRow>
            <FeatureName>Co-working / Body Double</FeatureName>
            <FeatureVal><X size={14} color="#6B6280" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
          </FeatureRow>

          <FeatureRow>
            <FeatureName>Biometric Temp Tuning</FeatureName>
            <FeatureVal><X size={14} color="#6B6280" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
          </FeatureRow>

          <FeatureRow>
            <FeatureName>ADHD Routine Coaching</FeatureName>
            <FeatureVal><X size={14} color="#6B6280" /></FeatureVal>
            <FeatureVal><X size={14} color="#6B6280" /></FeatureVal>
            <FeatureVal><Check size={14} color="#4ECDC4" /></FeatureVal>
          </FeatureRow>
        </FeatureTableContainer>

        {/* Plan Selectors */}
        <SectionTitle>Select Plan</SectionTitle>

        <PlanCard active={selectedPlan === 'plus'} onPress={() => setSelectedPlan('plus')}>
          <PlanHeaderRow>
            <PlanInfo>
              <PlanTitle>Dopamind Plus</PlanTitle>
              <PlanSubtitle>All Soundscapes & Co-Working Rooms</PlanSubtitle>
            </PlanInfo>
            <RadioCircle active={selectedPlan === 'plus'} />
          </PlanHeaderRow>
          <PlanPriceRow>
            <PriceText>$4.99 / week</PriceText>
            <SaveBadge><SaveText>SAVE 35% ANNUALLY</SaveText></SaveBadge>
          </PlanPriceRow>
          <PlanSubDetails>Or billing annually at $39.99/year</PlanSubDetails>
        </PlanCard>

        <PlanCard active={selectedPlan === 'pro'} onPress={() => setSelectedPlan('pro')}>
          <PlanHeaderRow>
            <PlanInfo>
              <PlanTitle>Dopamind Pro</PlanTitle>
              <PlanSubtitle>Everything in Plus + ADHD Coaching</PlanSubtitle>
            </PlanInfo>
            <RadioCircle active={selectedPlan === 'pro'} />
          </PlanHeaderRow>
          <PlanPriceRow>
            <PriceText>$9.99 / month</PriceText>
          </PlanPriceRow>
          <PlanSubDetails>Or billing annually at $69.99/year</PlanSubDetails>
        </PlanCard>

        <PlanCard active={selectedPlan === 'lifetime'} onPress={() => setSelectedPlan('lifetime')}>
          <PlanHeaderRow>
            <PlanInfo>
              <PlanTitle>Lifetime Access</PlanTitle>
              <PlanSubtitle>Pay once. Lock in premium forever</PlanSubtitle>
            </PlanInfo>
            <RadioCircle active={selectedPlan === 'lifetime'} />
          </PlanHeaderRow>
          <PlanPriceRow>
            <PriceText>$99.99</PriceText>
            <SaveBadge style={{ backgroundColor: '#FF6B6B' }}>
              <SaveText style={{ color: '#FFFFFF' }}>LIMITED OFFER</SaveText>
            </SaveBadge>
          </PlanPriceRow>
          <PlanSubDetails>One-time charge. No recurring fees.</PlanSubDetails>
        </PlanCard>

        {/* Subscribe Button */}
        <ActionWrapper>
          <SubscribeButton onPress={handleSubscribe}>
            <Sparkles size={18} color="#0D0B1A" style={{ marginRight: 8 }} />
            <SubscribeText>Start 7-Day Free Trial</SubscribeText>
          </SubscribeButton>
          <GuaranteeRow>
            <Shield size={12} color="#6B6280" style={{ marginRight: 6 }} />
            <GuaranteeText>30-day money-back guarantee. Cancel anytime. No guilt.</GuaranteeText>
          </GuaranteeRow>
        </ActionWrapper>

        <ExtraSpacing />
      </ScrollContent>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: #0D0B1A;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
`;

const Spacer = styled.View``;

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #1A1528;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const HeroSection = styled.View`
  align-items: center;
  margin-bottom: 24px;
`;

const GlowCircle = styled.View`
  width: 90px;
  height: 90px;
  border-radius: 45px;
  background-color: rgba(155, 126, 222, 0.12);
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  border-width: 1.5px;
  border-color: rgba(155, 126, 222, 0.25);
  shadow-color: #9B7EDE;
  shadow-opacity: 0.5;
  shadow-radius: 12px;
  position: relative;
`;

const CrownIcon = styled.Text`
  font-size: 24px;
  position: absolute;
  top: -15px;
  transform: rotate(-10deg);
`;

const SproutText = styled.Text`
  font-size: 38px;
`;

const Headline = styled.Text`
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
  text-align: center;
`;

const Subheadline = styled.Text`
  color: #B8B0D0;
  font-size: 13px;
  text-align: center;
  line-height: 18px;
  padding: 0 10px;
`;

const SectionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 14px;
`;

const FeatureTableContainer = styled(GlassCard)`
  padding: 16px 12px;
  margin-bottom: 20px;
`;

const FeatureRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px 0;
`;

const FeatureHeader = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: 800;
  flex: 1.5;
`;

const TierHeader = styled.Text<{ active?: boolean }>`
  color: ${props => props.active ? '#9B7EDE' : '#6B6280'};
  font-size: 10px;
  font-weight: 800;
  width: 50px;
  text-align: center;
`;

const FeatureName = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
  font-weight: bold;
  flex: 1.5;
`;

const FeatureVal = styled.View`
  width: 50px;
  align-items: center;
`;

const PlanCard = styled(GlassCard)<{ active: boolean }>`
  margin-bottom: 12px;
  padding: 16px;
  border-color: ${props => props.active ? '#9B7EDE' : 'rgba(255,255,255,0.06)'};
  background-color: ${props => props.active ? 'rgba(155,126,222,0.08)' : 'rgba(26,21,40,0.65)'};
`;

const PlanHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const PlanInfo = styled.View``;

const PlanTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
`;

const PlanSubtitle = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
`;

const RadioCircle = styled.View<{ active: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border-width: 2px;
  border-color: ${props => props.active ? '#9B7EDE' : '#6B6280'};
  background-color: ${props => props.active ? '#9B7EDE' : 'transparent'};
`;

const PlanPriceRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 4px;
`;

const PriceText = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
  margin-right: 10px;
`;

const SaveBadge = styled.View`
  background-color: rgba(78, 205, 196, 0.15);
  border-radius: 4px;
  padding: 2px 6px;
  border-width: 1px;
  border-color: rgba(78, 205, 196, 0.3);
`;

const SaveText = styled.Text`
  color: #4ECDC4;
  font-size: 9px;
  font-weight: 800;
`;

const PlanSubDetails = styled.Text`
  color: #6B6280;
  font-size: 10px;
`;

const ActionWrapper = styled.View`
  margin-top: 14px;
  align-items: center;
  width: 100%;
`;

const SubscribeButton = styled.TouchableOpacity`
  background-color: #9B7EDE;
  padding: 16px;
  border-radius: 30px;
  align-items: center;
  width: 100%;
  flex-direction: row;
  justify-content: center;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`;

const SubscribeText = styled.Text`
  color: #0D0B1A;
  font-size: 16px;
  font-weight: bold;
`;

const GuaranteeRow = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 12px;
`;

const GuaranteeText = styled.Text`
  color: #6B6280;
  font-size: 10px;
`;

const ExtraSpacing = styled.View`
  height: 100px;
`;
