import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { ShieldCheck, Mail, Lock, Sparkles, UserCheck, ArrowRight } from 'lucide-react-native';
import { supabase, supabaseService, UserProfile } from '../services/supabaseClient';

interface AuthLandingScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
  onOpenPaywall: () => void;
}

export const AuthLandingScreen: React.FC<AuthLandingScreenProps> = ({ onAuthSuccess, onOpenPaywall }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter your email and password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              payment_plan: '7day_trial',
              subscription_status: 'trialing',
              is_premium: true,
            },
          },
        });

        if (error) throw error;

        const user = data.user;
        if (user) {
          await supabaseService.updatePaymentPlan(user.id, '7day_trial', true);

          const userProfile: UserProfile = {
            id: user.id,
            email: user.email || email,
            full_name: fullName || email.split('@')[0],
            payment_plan: '7day_trial',
            subscription_status: 'trialing',
            is_premium: true,
            created_at: user.created_at || new Date().toISOString(),
          };
          await supabaseService.saveSession(userProfile, data.session?.access_token || 'token_' + Date.now());
          setLoading(false);
          onAuthSuccess(userProfile);
          onOpenPaywall(); // Present paywall after signup
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const user = data.user;
        if (user) {
          const userProfile: UserProfile = {
            id: user.id,
            email: user.email || email,
            full_name: user.user_metadata?.full_name || email.split('@')[0],
            created_at: user.created_at || new Date().toISOString(),
          };
          await supabaseService.saveSession(userProfile, data.session?.access_token || 'token_' + Date.now());
          setLoading(false);
          onAuthSuccess(userProfile);
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const userProfile: UserProfile = {
        id: 'usr_apple_' + Date.now(),
        email: 'user@privaterelay.appleid.com',
        full_name: 'Apple User',
        created_at: new Date().toISOString(),
      };
      await supabaseService.saveSession(userProfile, 'apple_token_' + Date.now());
      setLoading(false);
      onAuthSuccess(userProfile);
      onOpenPaywall();
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <ShieldCheck size={36} color="#9B7EDE" />
          </View>
          <Text style={styles.appTitle}>iMaxx</Text>
          <Text style={styles.appSubtitle}>Sign in or Create an Account to Access Dashboard</Text>
        </View>

        {/* Paywall Trial Banner Offer */}
        <TouchableOpacity style={styles.offerCard} activeOpacity={0.85} onPress={onOpenPaywall}>
          <View style={styles.offerTag}>
            <Sparkles size={14} color="#0D0B1A" />
            <Text style={styles.offerTagText}>LIMITED OFFER</Text>
          </View>
          <Text style={styles.offerTitle}>7-Day Premium Pass for $1.00</Text>
          <Text style={styles.offerDesc}>
            Unlock CloudFront Soundtracks, Circadian Alarms &amp; Analytics on Signup
          </Text>
        </TouchableOpacity>

        {/* Main Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {mode === 'register'
              ? 'Join iMaxx to sync your focus points and sleep statistics'
              : 'Enter your credentials to access your dashboard'}
          </Text>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Input Fields */}
          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <Mail size={18} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                placeholder="Email Address"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={18} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0D0B1A" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.submitBtnText}>
                    {mode === 'register' ? 'Sign Up & Continue' : 'Sign In to iMaxx'}
                  </Text>
                  <ArrowRight size={18} color="#0D0B1A" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Apple Sign In */}
          <TouchableOpacity style={styles.appleBtn} activeOpacity={0.85} onPress={handleAppleSignIn}>
            <Text style={styles.appleBtnText}> Continue with Apple</Text>
          </TouchableOpacity>

          {/* Switch Mode Toggle */}
          <TouchableOpacity style={styles.toggleRow} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
              <Text style={styles.toggleTextBold}>{mode === 'login' ? 'Create Account' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#0D0B1A',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(155, 126, 222, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(155, 126, 222, 0.3)',
  },
  appTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  appSubtitle: {
    color: '#B8B0D0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  offerCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  offerTagText: {
    color: '#0D0B1A',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  offerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  offerDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 24,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 99, 132, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 99, 132, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FF6384',
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    marginBottom: 14,
  },
  inputWrapper: {
    marginBottom: 12,
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#9B7EDE',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#0D0B1A',
    fontSize: 15,
    fontWeight: '800',
  },
  appleBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  appleBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    alignItems: 'center',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  toggleTextBold: {
    color: '#9B7EDE',
    fontWeight: '700',
  },
});
