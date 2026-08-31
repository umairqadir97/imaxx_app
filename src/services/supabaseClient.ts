import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Supabase Credentials
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wceaigqblpfknnuoisqa.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_cex2ubScNJZ_HKO7duxquQ_7xRJU_PA';

export interface UserSubscription {
  id: string;
  user_id: string;
  status: 'active' | 'trialing' | 'canceled' | 'expired' | 'free';
  plan_type: 'monthly_pass' | 'annual_ultra' | 'free';
  store?: 'app_store' | 'play_store' | 'web_stripe' | 'test_revenuecat' | 'free';
  current_period_end?: string;
  is_trial_active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  payment_plan?: 'free' | 'monthly_pass' | 'annual_ultra' | '7day_trial';
  subscription_status?: 'free' | 'active' | 'trialing' | 'canceled' | 'expired';
  is_premium?: boolean;
  avatar_url?: string;
  created_at: string;
}

// Storage adapter compatible with React Native / Web / Electron
const customStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {}
  },
};

// Initialize Official Supabase JS Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export class SupabaseService {
  private static instance: SupabaseService;
  public supabaseUrl: string = SUPABASE_URL;
  public supabaseAnonKey: string = SUPABASE_ANON_KEY;

  private constructor() {}

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Get active session from local storage or Supabase Auth and DB
  public async getStoredSession(): Promise<{ user: UserProfile | null; token: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        // Fetch latest profile row from public.profiles table
        const dbProfile = await this.fetchUserProfile(session.user.id);

        const userProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: dbProfile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          payment_plan: dbProfile?.payment_plan || 'free',
          subscription_status: dbProfile?.subscription_status || 'free',
          is_premium: dbProfile?.is_premium ?? false,
          avatar_url: dbProfile?.avatar_url || session.user.user_metadata?.avatar_url,
          created_at: session.user.created_at,
        };
        return { user: userProfile, token: session.access_token };
      }

      // Fallback to local storage
      const sessionStr = await customStorage.getItem('iMaxx_supabase_session');
      if (sessionStr) {
        return JSON.parse(sessionStr);
      }
    } catch (e) {}
    return { user: null, token: null };
  }

  // Fetch profile from public.profiles table
  public async fetchUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data && !error) {
        return data as UserProfile;
      }
    } catch (e) {}
    return null;
  }

  // Update payment plan & status in DB public.profiles table
  public async updatePaymentPlan(userId: string, plan: string, isPremium: boolean): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          payment_plan: plan,
          subscription_status: isPremium ? 'active' : 'free',
          is_premium: isPremium,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (e) {}
  }

  // Save session locally
  public async saveSession(user: UserProfile, token: string): Promise<void> {
    try {
      await customStorage.setItem('iMaxx_supabase_session', JSON.stringify({ user, token }));
    } catch (e) {}
  }

  // Clear session / Log Out
  public async clearSession(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await customStorage.removeItem('iMaxx_supabase_session');
    } catch (e) {}
  }
}

export const supabaseService = SupabaseService.getInstance();
