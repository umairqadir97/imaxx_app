import React, { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { View, Text, TouchableOpacity } from 'react-native';
import { Compass, Flame, Award, Clock, ArrowRight, RotateCcw, LogIn, LogOut, UserCheck, ShieldCheck, Sparkles, CreditCard } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { resetOnboarding } from '../store/habitSlice';
import { CircadianWidget } from '../components/CircadianWidget';
import { GlassCard } from '../components/GlassCard';
import { getLocalDateStr } from '../utils/date';
import { supabase, supabaseService, UserProfile } from '../services/supabaseClient';

interface StatsDashboardProps {
  onOpenPaywall: () => void;
  onOpenAuth: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ onOpenPaywall, onOpenAuth }) => {
  const dispatch = useAppDispatch();
  const { habits, focusScoreTotal, listeningTimeTotal } = useAppSelector((state) => state.habits);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadUserProfile = async () => {
    const { user } = await supabaseService.getStoredSession();
    if (user) {
      // Fetch latest row from public.profiles table
      const dbProfile = await supabaseService.fetchUserProfile(user.id);
      setUserProfile({
        ...user,
        ...(dbProfile || {}),
      });
    } else {
      setUserProfile(null);
    }
  };

  useEffect(() => {
    loadUserProfile();

    // Listen to Supabase auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        const dbProfile = await supabaseService.fetchUserProfile(session.user.id);
        const profile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: dbProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          payment_plan: dbProfile?.payment_plan || 'free',
          subscription_status: dbProfile?.subscription_status || 'free',
          is_premium: dbProfile?.is_premium ?? false,
          avatar_url: dbProfile?.avatar_url || session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
        };
        setUserProfile(profile);
        await supabaseService.saveSession(profile, session.access_token);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabaseService.clearSession();
    setUserProfile(null);
  };

  const formatHours = (seconds: number) => {
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs} hrs`;
  };

  const getCompletedCount = () => {
    const todayStr = getLocalDateStr();
    return habits.filter(h => h.completions.includes(todayStr)).length;
  };

  const initialLetter = userProfile?.full_name ? userProfile.full_name[0].toUpperCase() : userProfile?.email ? userProfile.email[0].toUpperCase() : 'G';

  const getPlanBadgeText = () => {
    if (!userProfile) return 'Guest Mode';
    if (userProfile.payment_plan === '7day_trial') return '⚡ $1.00 7-Day Pass (Active)';
    if (userProfile.payment_plan === 'annual_ultra') return '👑 Annual Ultra ($19.50/yr)';
    if (userProfile.payment_plan === 'monthly_pass') return '🌟 Monthly Pass ($6.99/mo)';
    if (userProfile.is_premium) return '👑 Premium PRO Unlocked';
    return 'FREE Plan';
  };

  return (
    <Container>
      <HeaderBar>
        <HeaderTitle>Mind Stats</HeaderTitle>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <ProfileCard onPress={userProfile ? loadUserProfile : onOpenAuth} activeOpacity={0.85}>
          <AvatarWrapper>
            <AvatarText>{initialLetter}</AvatarText>
          </AvatarWrapper>
          <ProfileInfo>
            <ProfileName>{userProfile?.full_name || 'Guest Explorer'}</ProfileName>
            <ProfileLevel>
              {userProfile ? userProfile.email : 'Tap to sign in or create account'}
            </ProfileLevel>
          </ProfileInfo>
          {userProfile ? (
            <BadgeReward>
              <UserCheck size={20} color="#4ECDC4" />
            </BadgeReward>
          ) : (
            <BadgeReward onPress={onOpenAuth}>
              <LogIn size={20} color="#FFB347" />
            </BadgeReward>
          )}
        </ProfileCard>

        {/* Payment Plan & Subscription Status Card */}
        <PlanCard>
          <PlanCardHeader>
            <CreditCard size={20} color="#9B7EDE" />
            <PlanTitle>Subscription & Payment Plan</PlanTitle>
          </PlanCardHeader>
          
          <PlanRow>
            <PlanLabel>Current Plan:</PlanLabel>
            <PlanValueBadge isPremium={userProfile?.is_premium || userProfile?.payment_plan !== 'free'}>
              <PlanValueText>{getPlanBadgeText()}</PlanValueText>
            </PlanValueBadge>
          </PlanRow>

          <PlanRow style={{ marginTop: 8 }}>
            <PlanLabel>Database Status:</PlanLabel>
            <StatusText isPremium={userProfile?.is_premium || userProfile?.subscription_status === 'active'}>
              {userProfile?.subscription_status ? userProfile.subscription_status.toUpperCase() : 'FREE'}
            </StatusText>
          </PlanRow>

          <UpgradePlanBtn onPress={onOpenPaywall} activeOpacity={0.85}>
            <Sparkles size={16} color="#0D0B1A" style={{ marginRight: 6 }} />
            <UpgradePlanBtnText>Manage Subscription / Upgrade Plan</UpgradePlanBtnText>
          </UpgradePlanBtn>
        </PlanCard>

        {/* Circadian rhythm energy curve */}
        <CircadianWrapper>
          <CircadianWidget />
        </CircadianWrapper>

        {/* Key Metrics */}
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

        {/* Preferences & System */}
        <SectionTitle>Preferences & System</SectionTitle>

        {/* Auth / Login / Logout option */}
        {userProfile ? (
          <SettingItem onPress={handleLogout}>
            <SettingItemText style={{ color: '#FF6B6B' }}>Log Out ({userProfile.email})</SettingItemText>
            <LogOut size={16} color="#FF6B6B" />
          </SettingItem>
        ) : (
          <SettingItem onPress={onOpenAuth}>
            <SettingItemText style={{ color: '#4ECDC4' }}>Sign In / Register Account</SettingItemText>
            <LogIn size={16} color="#4ECDC4" />
          </SettingItem>
        )}

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

const ProfileCard = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.05);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  margin-top: 10px;
  margin-bottom: 16px;
`;

const AvatarWrapper = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: #9B7EDE;
  justify-content: center;
  align-items: center;
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

const BadgeReward = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(78, 205, 196, 0.1);
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(78, 205, 196, 0.2);
`;

const PlanCard = styled.View`
  background-color: #161622;
  border-width: 1px;
  border-color: rgba(155, 126, 222, 0.2);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 20px;
`;

const PlanCardHeader = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
`;

const PlanTitle = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
  margin-left: 8px;
`;

const PlanRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const PlanLabel = styled.Text`
  color: #B8B0D0;
  font-size: 13px;
`;

const PlanValueBadge = styled.View<{ isPremium?: boolean }>`
  background-color: ${props => props.isPremium ? 'rgba(78, 205, 196, 0.15)' : 'rgba(255, 255, 255, 0.08)'};
  border-width: 1px;
  border-color: ${props => props.isPremium ? '#4ECDC4' : 'rgba(255, 255, 255, 0.15)'};
  padding: 4px 10px;
  border-radius: 8px;
`;

const PlanValueText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 700;
`;

const StatusText = styled.Text<{ isPremium?: boolean }>`
  color: ${props => props.isPremium ? '#4ECDC4' : '#FFB347'};
  font-size: 13px;
  font-weight: 800;
`;

const UpgradePlanBtn = styled.TouchableOpacity`
  background-color: #9B7EDE;
  border-radius: 12px;
  padding: 12px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  margin-top: 14px;
`;

const UpgradePlanBtnText = styled.Text`
  color: #0D0B1A;
  font-size: 13px;
  font-weight: 800;
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
