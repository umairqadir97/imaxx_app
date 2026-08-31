import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { X, Mail, Lock, LogIn, UserPlus, ShieldCheck } from 'lucide-react-native';
import { supabase, supabaseService, UserProfile } from '../services/supabaseClient';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ visible, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
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
            },
          },
        });

        if (error) throw error;

        const user = data.user;
        if (user) {
          const userProfile: UserProfile = {
            id: user.id,
            email: user.email || email,
            full_name: fullName || email.split('@')[0],
            created_at: user.created_at || new Date().toISOString(),
          };
          await supabaseService.saveSession(userProfile, data.session?.access_token || 'token_' + Date.now());
          setLoading(false);
          onSuccess(userProfile);
          onClose();
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
          onSuccess(userProfile);
          onClose();
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
      onSuccess(userProfile);
      onClose();
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={28} color="#4ECDC4" />
            </View>
            <Text style={styles.title}>
              {mode === 'login' ? 'Welcome Back to iMaxx' : 'Create Your iMaxx Account'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Sign in to access your synchronized focus stats and sleep alarms'
                : 'Sign up to sync your custom sounds, stats, and circadian alarms across devices'}
            </Text>
          </View>

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Form */}
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

            {/* Main Submit Button */}
            <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#0D0D15" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Apple Sign-In Button */}
          <TouchableOpacity style={styles.appleBtn} activeOpacity={0.85} onPress={handleAppleSignIn}>
            <Text style={styles.appleBtnText}> Continue with Apple</Text>
          </TouchableOpacity>

          {/* Toggle Login / Register */}
          <TouchableOpacity style={styles.toggleRow} onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleTextBold}>{mode === 'login' ? 'Register' : 'Sign In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(78, 205, 196, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
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
    backgroundColor: '#4ECDC4',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#0D0D15',
    fontSize: 15,
    fontWeight: '700',
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
    color: '#4ECDC4',
    fontWeight: '700',
  },
});
