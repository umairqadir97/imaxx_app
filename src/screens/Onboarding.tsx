import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import {
  Compass,
  Sparkles,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  Moon,
  Sun,
  Flame,
  Star,
  Brain,
  Lock,
  ArrowRight,
  User,
  Mail,
  CreditCard,
  CheckCircle2,
  Clock,
  Heart,
  Droplets,
  Wind,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { completeOnboarding, toggleStruggle } from '../store/habitSlice';
import { unlockPremium } from '../store/audioSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseService, UserProfile } from '../services/supabaseClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// -------------------------------------------------------------
// STYLED COMPONENTS
// -------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: #08080A;
`;

const TopProgressBarContainer = styled.View`
  height: 4px;
  background-color: rgba(255, 255, 255, 0.08);
  width: 100%;
`;

const TopProgressBarFill = styled.View<{ widthPercent: number }>`
  height: 100%;
  width: ${(props: { widthPercent: number }) => props.widthPercent}%;
  background-color: #FF7E47;
`;

const HeaderNav = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-horizontal: 20px;
  padding-top: 16px;
  padding-bottom: 8px;
`;

const StepBadge = styled.Text`
  color: #8E8E93;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const SkipText = styled.Text`
  color: #8E8E93;
  font-size: 13px;
  font-weight: 500;
`;

const ContentScroll = styled.ScrollView`
  flex: 1;
  padding-horizontal: 20px;
`;

const Title = styled.Text`
  color: #FFFFFF;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-top: 14px;
  line-height: 32px;
`;

const Subtitle = styled.Text`
  color: #9B9BA7;
  font-size: 14px;
  line-height: 20px;
  margin-top: 8px;
  margin-bottom: 24px;
`;

const OptionCard = styled(TouchableOpacity)<{ active: boolean }>`
  background-color: ${(props: { active: boolean }) =>
    props.active ? 'rgba(255, 126, 71, 0.12)' : 'rgba(255, 255, 255, 0.03)'};
  border-width: 1.5px;
  border-color: ${(props: { active: boolean }) =>
    props.active ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const OptionLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const OptionEmoji = styled.Text`
  font-size: 24px;
  margin-right: 14px;
`;

const OptionTexts = styled.View`
  flex: 1;
`;

const OptionTitle = styled.Text<{ active: boolean }>`
  color: ${(props: { active: boolean }) => (props.active ? '#FFFFFF' : '#E0E0E6')};
  font-size: 15px;
  font-weight: 700;
`;

const OptionSubtitle = styled.Text`
  color: #8E8E93;
  font-size: 12px;
  margin-top: 2px;
`;

const RadioCircle = styled.View<{ active: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 11px;
  border-width: 1.5px;
  border-color: ${(props: { active: boolean }) => (props.active ? '#FF7E47' : '#555566')};
  background-color: ${(props: { active: boolean }) =>
    props.active ? '#FF7E47' : 'transparent'};
  align-items: center;
  justify-content: center;
  margin-left: 10px;
`;

const PrimaryButton = styled(TouchableOpacity)`
  background-color: #FF7E47;
  border-radius: 16px;
  padding-vertical: 16px;
  margin-horizontal: 20px;
  margin-bottom: 24px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  shadow-color: #FF7E47;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.35;
  shadow-radius: 12px;
  elevation: 6;
`;

const PrimaryButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.2px;
`;

interface OnboardingProps {
  onComplete?: () => void;
  onAuthSuccess?: (user: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onAuthSuccess }) => {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState(1); // 1 to 8

  // Step 1: Goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['paralysis', 'deep_work']);
  // Step 2: Chronotype
  const [selectedChronotype, setSelectedChronotype] = useState<string>('afternoon_slump');
  // Step 3: Starter Habits
  const [selectedHabits, setSelectedHabits] = useState<string[]>(['water', 'sunlight', 'focus']);
  // Step 4: Companion Pet
  const [selectedCompanion, setSelectedCompanion] = useState<string>('red_panda');
  // Step 5: Algorithm Calculation
  const [calcProgress, setCalcProgress] = useState(0);
  const [calcStepText, setCalcStepText] = useState('Calibrating circadian chronotype...');
  // Step 6: Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<'7day_pass' | 'annual_ultra'>('7day_pass');
  // Step 7: Auth details
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Animate AI Protocol Generation in Step 5
  useEffect(() => {
    if (step === 5) {
      setCalcProgress(10);
      const t1 = setTimeout(() => {
        setCalcProgress(45);
        setCalcStepText('Synthesizing 40Hz Gamma & 528Hz Solfeggio soundscape...');
      }, 700);
      const t2 = setTimeout(() => {
        setCalcProgress(80);
        setCalcStepText('Generating custom micro-habit streak roadmap...');
      }, 1400);
      const t3 = setTimeout(() => {
        setCalcProgress(100);
        setCalcStepText('Your Neuro-Acoustic Protocol is Ready! 🚀');
      }, 2000);
      const t4 = setTimeout(() => {
        setStep(6); // Move to Paywall Screen
      }, 2700);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [step]);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleHabit = (id: string) => {
    setSelectedHabits((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    }
  };

  // Complete Registration & Activate Plan
  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setAuthError('Please provide both email and password.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              payment_plan: selectedPlan === 'annual_ultra' ? 'annual_ultra' : 'monthly_pass',
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName || email.split('@')[0],
            payment_plan: selectedPlan === 'annual_ultra' ? 'annual_ultra' : 'monthly_pass',
            subscription_status: 'active',
            is_premium: true,
            created_at: new Date().toISOString(),
          };

          await supabaseService.saveSession(userProfile, data.session?.access_token || '');
          await supabaseService.updatePaymentPlan(
            data.user.id,
            selectedPlan === 'annual_ultra' ? 'annual_ultra' : 'monthly_pass',
            true
          );

          dispatch(unlockPremium());
          await AsyncStorage.setItem('iMaxx_is_premium_unlocked', 'true');
          await AsyncStorage.setItem('iMaxx_active_companion', selectedCompanion);

          if (onAuthSuccess) onAuthSuccess(userProfile);
          dispatch(completeOnboarding());
        }
      } else {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const dbProfile = await supabaseService.fetchUserProfile(data.user.id);
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: dbProfile?.full_name || data.user.user_metadata?.full_name || email.split('@')[0],
            payment_plan: dbProfile?.payment_plan || 'monthly_pass',
            subscription_status: dbProfile?.subscription_status || 'active',
            is_premium: dbProfile?.is_premium ?? true,
            created_at: data.user.created_at,
          };

          await supabaseService.saveSession(userProfile, data.session?.access_token || '');
          dispatch(unlockPremium());
          await AsyncStorage.setItem('iMaxx_is_premium_unlocked', 'true');
          await AsyncStorage.setItem('iMaxx_active_companion', selectedCompanion);

          if (onAuthSuccess) onAuthSuccess(userProfile);
          dispatch(completeOnboarding());
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 1: SPLASH & CORE MISSION (Calm/Endel Hook)
  // -------------------------------------------------------------
  if (step === 1) {
    return (
      <Container>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255, 126, 71, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 1.5, borderColor: 'rgba(255, 126, 71, 0.4)' }}>
            <Compass size={52} color="#FF7E47" />
          </View>

          <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5, lineHeight: 38 }}>
            Transform ADHD Chaos into Flow State
          </Text>

          <Text style={{ color: '#A0A0B2', fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 14, marginBottom: 36 }}>
            Neuro-acoustic binaural soundscapes, smart circadian sleep alarms, and micro-habits calibrated for dopamine-seeking brains.
          </Text>

          {/* Value bullet points */}
          <View style={{ width: '100%', marginBottom: 36, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Zap size={18} color="#FF7E47" style={{ marginRight: 12 }} />
              <Text style={{ color: '#E0E0EA', fontSize: 14, fontWeight: '600' }}>40Hz Gamma Focus Frequencies</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Moon size={18} color="#00F2FE" style={{ marginRight: 12 }} />
              <Text style={{ color: '#E0E0EA', fontSize: 14, fontWeight: '600' }}>90-Min Circadian Sleep Cycle Alarms</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Flame size={18} color="#FFD700" style={{ marginRight: 12 }} />
              <Text style={{ color: '#E0E0EA', fontSize: 14, fontWeight: '600' }}>Dopamine-Gamified Pet Consistency</Text>
            </View>
          </View>

          <PrimaryButton style={{ width: '100%', marginHorizontal: 0 }} onPress={handleNext}>
            <PrimaryButtonText>Start Brain Assessment</PrimaryButtonText>
            <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </PrimaryButton>

          <Text style={{ color: '#6A6A7A', fontSize: 12, textAlign: 'center' }}>
            Takes under 60 seconds • 100% Calibrated to you
          </Text>
        </ScrollView>
      </Container>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: GOALS SELECTION (Calm style)
  // -------------------------------------------------------------
  if (step === 2) {
    const goals = [
      { id: 'paralysis', emoji: '🎯', title: 'Break Task Paralysis', desc: 'Overcome resistance and start deep work easily' },
      { id: 'sleep', emoji: '🌙', title: 'Fall Asleep Faster', desc: 'Soothe late-night racing thoughts & sensory overload' },
      { id: 'deep_work', emoji: '⚡', title: 'Dopamine Hyperfocus', desc: 'Stay in uninterrupted flow for 25 to 90 minutes' },
      { id: 'habits', emoji: '🔥', title: 'Build Daily Consistency', desc: 'Maintain micro-habits without burning out' },
      { id: 'anxiety', emoji: '🍃', title: 'Vagus Nerve Calm', desc: 'Decompress from overwhelm and overstimulation' },
    ];

    return (
      <Container>
        <TopProgressBarContainer>
          <TopProgressBarFill widthPercent={(2 / 7) * 100} />
        </TopProgressBarContainer>

        <HeaderNav>
          <StepBadge>Step 1 of 5 • Goals</StepBadge>
          <TouchableOpacity onPress={handleNext}>
            <SkipText>Next →</SkipText>
          </TouchableOpacity>
        </HeaderNav>

        <ContentScroll showsVerticalScrollIndicator={false}>
          <Title>What is your primary focus goal?</Title>
          <Subtitle>Select all areas you want to master with iMaxx.</Subtitle>

          {goals.map((g) => {
            const active = selectedGoals.includes(g.id);
            return (
              <OptionCard key={g.id} active={active} onPress={() => toggleGoal(g.id)}>
                <OptionLeft>
                  <OptionEmoji>{g.emoji}</OptionEmoji>
                  <OptionTexts>
                    <OptionTitle active={active}>{g.title}</OptionTitle>
                    <OptionSubtitle>{g.desc}</OptionSubtitle>
                  </OptionTexts>
                </OptionLeft>
                <RadioCircle active={active}>
                  {active && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </RadioCircle>
              </OptionCard>
            );
          })}
        </ContentScroll>

        <PrimaryButton onPress={handleNext}>
          <PrimaryButtonText>Continue ({selectedGoals.length} Selected)</PrimaryButtonText>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </PrimaryButton>
      </Container>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: CIRCADIAN CHRONOTYPE (Endel style)
  // -------------------------------------------------------------
  if (step === 3) {
    const chronotypes = [
      { id: 'morning_fog', emoji: '🌅', title: 'Morning Brain Fog', desc: 'Hard to wake up and feel alert before 11 AM' },
      { id: 'afternoon_slump', emoji: '☀️', title: '2:00 PM Dopamine Crash', desc: 'Sudden energy drop and heavy distractibility mid-day' },
      { id: 'night_owl', emoji: '🦉', title: 'Revenge Night Owl', desc: 'Peak creativity at midnight, struggles to sleep on time' },
      { id: 'erratic', emoji: '⚡', title: 'Unpredictable Bursts', desc: 'Random waves of intense hyperfocus then fatigue' },
    ];

    return (
      <Container>
        <TopProgressBarContainer>
          <TopProgressBarFill widthPercent={(3 / 7) * 100} />
        </TopProgressBarContainer>

        <HeaderNav>
          <StepBadge>Step 2 of 5 • Chronotype</StepBadge>
          <TouchableOpacity onPress={handleNext}>
            <SkipText>Next →</SkipText>
          </TouchableOpacity>
        </HeaderNav>

        <ContentScroll showsVerticalScrollIndicator={false}>
          <Title>When is your brain most vulnerable?</Title>
          <Subtitle>We adapt sound frequencies and wake alarms to your biological rhythm.</Subtitle>

          {chronotypes.map((c) => {
            const active = selectedChronotype === c.id;
            return (
              <OptionCard key={c.id} active={active} onPress={() => setSelectedChronotype(c.id)}>
                <OptionLeft>
                  <OptionEmoji>{c.emoji}</OptionEmoji>
                  <OptionTexts>
                    <OptionTitle active={active}>{c.title}</OptionTitle>
                    <OptionSubtitle>{c.desc}</OptionSubtitle>
                  </OptionTexts>
                </OptionLeft>
                <RadioCircle active={active}>
                  {active && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </RadioCircle>
              </OptionCard>
            );
          })}
        </ContentScroll>

        <PrimaryButton onPress={handleNext}>
          <PrimaryButtonText>Confirm Chronotype</PrimaryButtonText>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </PrimaryButton>
      </Container>
    );
  }

  // -------------------------------------------------------------
  // STEP 4: MICRO-HABITS COMMITMENT (HabitKit style)
  // -------------------------------------------------------------
  if (step === 4) {
    const habits = [
      { id: 'water', emoji: '💧', title: 'Drink 1 Glass of Water', desc: 'Instant cognitive hydration upon waking' },
      { id: 'sunlight', emoji: '☀️', title: '2-Min Morning Sunlight', desc: 'Sets circadian melatonin timer naturally' },
      { id: 'focus', emoji: '💻', title: '25-Min ADHD Focus Sprint', desc: 'One high-leverage deep work session' },
      { id: 'breath', emoji: '🧘', title: '3 Deep Vagus Breaths', desc: 'Resets central nervous system from overload' },
      { id: 'screen', emoji: '📵', title: 'Screen Curfew (30 min)', desc: 'Prevents blue light melatonin suppression' },
    ];

    return (
      <Container>
        <TopProgressBarContainer>
          <TopProgressBarFill widthPercent={(4 / 7) * 100} />
        </TopProgressBarContainer>

        <HeaderNav>
          <StepBadge>Step 3 of 5 • Habits</StepBadge>
          <TouchableOpacity onPress={handleNext}>
            <SkipText>Next →</SkipText>
          </TouchableOpacity>
        </HeaderNav>

        <ContentScroll showsVerticalScrollIndicator={false}>
          <Title>Pick 3 foundational micro-habits</Title>
          <Subtitle>Micro-habits create effortless consistency without overwhelming ADHD brains.</Subtitle>

          {habits.map((h) => {
            const active = selectedHabits.includes(h.id);
            return (
              <OptionCard key={h.id} active={active} onPress={() => toggleHabit(h.id)}>
                <OptionLeft>
                  <OptionEmoji>{h.emoji}</OptionEmoji>
                  <OptionTexts>
                    <OptionTitle active={active}>{h.title}</OptionTitle>
                    <OptionSubtitle>{h.desc}</OptionSubtitle>
                  </OptionTexts>
                </OptionLeft>
                <RadioCircle active={active}>
                  {active && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </RadioCircle>
              </OptionCard>
            );
          })}
        </ContentScroll>

        <PrimaryButton onPress={handleNext}>
          <PrimaryButtonText>Lock In Habits ({selectedHabits.length})</PrimaryButtonText>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </PrimaryButton>
      </Container>
    );
  }

  // -------------------------------------------------------------
  // STEP 5: AI PROTOCOL GENERATION (The "Aha!" Value Reveal)
  // -------------------------------------------------------------
  if (step === 5) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255, 126, 71, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 2, borderColor: '#FF7E47' }}>
          <Brain size={64} color="#FF7E47" />
        </View>

        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
          Generating Your Neuro-Protocol
        </Text>

        <Text style={{ color: '#9B9BA7', fontSize: 14, textAlign: 'center', minHeight: 44, lineHeight: 20 }}>
          {calcStepText}
        </Text>

        {/* Progress Bar */}
        <View style={{ width: '100%', height: 8, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, marginVertical: 32, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${calcProgress}%`, backgroundColor: '#FF7E47', borderRadius: 4 }} />
        </View>

        <ActivityIndicator size="small" color="#FF7E47" />
      </Container>
    );
  }

  // -------------------------------------------------------------
  // STEP 6: PAYWALL & PLAN SELECTION (Conversion-Optimized)
  // -------------------------------------------------------------
  if (step === 6) {
    return (
      <Container>
        <TopProgressBarContainer>
          <TopProgressBarFill widthPercent={(6 / 7) * 100} />
        </TopProgressBarContainer>

        <HeaderNav>
          <StepBadge>Step 4 of 5 • Pro Plan</StepBadge>
          <TouchableOpacity onPress={() => setStep(7)}>
            <SkipText>Skip for now</SkipText>
          </TouchableOpacity>
        </HeaderNav>

        <ContentScroll showsVerticalScrollIndicator={false}>
          <Title>Your Custom Protocol is Ready 🌟</Title>
          <Subtitle>Unlock full access to soundscapes, circadian alarms & infinite streak tracking.</Subtitle>

          {/* Social Proof Banner */}
          <View style={{ backgroundColor: 'rgba(255, 215, 0, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)', borderRadius: 14, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
            <Star size={20} color="#FFD700" fill="#FFD700" style={{ marginRight: 10 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, flex: 1, lineHeight: 18 }}>
              <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>4.9/5 Rating</Text> • Loved by 150,000+ ADHD high-performers worldwide.
            </Text>
          </View>

          {/* Plan 1: 7-Day $1.00 Trial Pass */}
          <TouchableOpacity
            style={{
              backgroundColor: selectedPlan === '7day_pass' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderWidth: 2,
              borderColor: selectedPlan === '7day_pass' ? '#00F2FE' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 14,
            }}
            onPress={() => setSelectedPlan('7day_pass')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>7-Day Premium Pass</Text>
              <View style={{ backgroundColor: '#00F2FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: '#08080A', fontSize: 11, fontWeight: '800' }}>$1.00 TRIAL</Text>
              </View>
            </View>
            <Text style={{ color: '#00F2FE', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>
              $1.00 for 7 Days
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 12 }}>
              Then $6.99/mo. Cancel anytime in one tap with zero hassle.
            </Text>
          </TouchableOpacity>

          {/* Plan 2: Annual Ultra Plan (77% OFF) */}
          <TouchableOpacity
            style={{
              backgroundColor: selectedPlan === 'annual_ultra' ? 'rgba(255, 126, 71, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              borderWidth: 2,
              borderColor: selectedPlan === 'annual_ultra' ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 20,
            }}
            onPress={() => setSelectedPlan('annual_ultra')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800' }}>Annual Ultra Plan</Text>
              <View style={{ backgroundColor: '#FF7E47', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>77% OFF</Text>
              </View>
            </View>
            <Text style={{ color: '#FF7E47', fontSize: 20, fontWeight: '800', marginBottom: 4 }}>
              $19.00 / year ($1.58/mo)
            </Text>
            <Text style={{ color: '#8E8E93', fontSize: 12 }}>
              Best value. Full uninterrupted annual access with all future updates.
            </Text>
          </TouchableOpacity>

          {/* Feature List */}
          <View style={{ marginBottom: 20 }}>
            {[
              'Unlimited 40Hz Gamma & 528Hz Solfeggio soundscapes',
              'Smart 90-Min Circadian Sleep Cycle Alarms & Shake Challenges',
              'ADHD Focus Dial & unlimited habit streak tracking',
              'Cloud sync across all your mobile & desktop devices',
            ].map((feature, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <CheckCircle2 size={16} color="#38EF7D" style={{ marginRight: 10 }} />
                <Text style={{ color: '#B0B0C0', fontSize: 13, flex: 1 }}>{feature}</Text>
              </View>
            ))}
          </View>
        </ContentScroll>

        <PrimaryButton onPress={() => setStep(7)}>
          <PrimaryButtonText>
            {selectedPlan === '7day_pass' ? 'Claim $1.00 7-Day Pass ⚡' : 'Claim 77% OFF Annual Pass 👑'}
          </PrimaryButtonText>
          <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </PrimaryButton>
      </Container>
    );
  }

  // -------------------------------------------------------------
  // STEP 7: ACCOUNT CREATION & AUTH (Connects plan to DB)
  // -------------------------------------------------------------
  return (
    <Container>
      <TopProgressBarContainer>
        <TopProgressBarFill widthPercent={100} />
      </TopProgressBarContainer>

      <HeaderNav>
        <StepBadge>Final Step • Create Account</StepBadge>
      </HeaderNav>

      <ContentScroll showsVerticalScrollIndicator={false}>
        <Title>Save Your Profile</Title>
        <Subtitle>Your personalized protocol and plan will be linked to your account.</Subtitle>

        {/* Selected Plan Summary Capsule */}
        <View style={{ backgroundColor: 'rgba(255, 126, 71, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 126, 71, 0.3)', borderRadius: 14, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Sparkles size={16} color="#FF7E47" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
              {selectedPlan === 'annual_ultra' ? 'Annual Ultra Plan ($19.00/yr)' : '7-Day Pass ($1.00 Trial)'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setStep(6)}>
            <Text style={{ color: '#FF7E47', fontSize: 12, fontWeight: 'bold' }}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Switcher */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: authMode === 'signup' ? '#FF7E47' : 'transparent', borderRadius: 8 }}
            onPress={() => setAuthMode('signup')}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: authMode === 'login' ? '#FF7E47' : 'transparent', borderRadius: 8 }}
            onPress={() => setAuthMode('login')}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>Log In</Text>
          </TouchableOpacity>
        </View>

        {authError && (
          <View style={{ backgroundColor: 'rgba(255, 75, 75, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 75, 75, 0.3)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: '#FF4B4B', fontSize: 13 }}>{authError}</Text>
          </View>
        )}

        {authMode === 'signup' && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>FULL NAME</Text>
            <TextInput
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 14, color: '#FFFFFF', fontSize: 15 }}
              placeholder="e.g. Umair Qadir"
              placeholderTextColor="#666677"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
        )}

        <View style={{ marginBottom: 14 }}>
          <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>EMAIL ADDRESS</Text>
          <TextInput
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 14, color: '#FFFFFF', fontSize: 15 }}
            placeholder="you@example.com"
            placeholderTextColor="#666677"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>PASSWORD</Text>
          <TextInput
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 14, color: '#FFFFFF', fontSize: 15 }}
            placeholder="••••••••"
            placeholderTextColor="#666677"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
      </ContentScroll>

      <PrimaryButton onPress={handleAuthSubmit} disabled={authLoading}>
        {authLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <PrimaryButtonText>
              {authMode === 'signup' ? 'Create Account & Start iMaxx 🚀' : 'Log In & Continue'}
            </PrimaryButtonText>
            <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </>
        )}
      </PrimaryButton>
    </Container>
  );
};
