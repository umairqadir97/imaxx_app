import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { unlockPremium, lockPremium } from '../store/audioSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, supabaseService } from '../services/supabaseClient';

export interface PackageOffer {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  title: string;
  priceString: string;
  price: number;
  description: string;
  introPriceString?: string;
}

export const usePurchases = () => {
  const dispatch = useAppDispatch();
  const { isPremiumUnlocked } = useAppSelector((state) => state.audio);

  const [isLoading, setIsLoading] = useState(false);
  const [offerings, setOfferings] = useState<PackageOffer[]>([
    {
      identifier: 'imaxx_monthly_699',
      packageType: 'MONTHLY',
      title: 'Monthly Premium Pass',
      priceString: '$6.99 / mo',
      price: 6.99,
      description: '$1.00 for 7 Days, then $6.99/mo',
      introPriceString: '$1.00 7-Day Pass',
    },
    {
      identifier: 'imaxx_annual_1900',
      packageType: 'ANNUAL',
      title: 'Annual Ultra Plan',
      priceString: '$19.00 / yr',
      price: 19.00,
      description: '$1.58/mo billed annually ($19/yr)',
    },
  ]);

  // Load database subscription state on mount
  useEffect(() => {
    const checkDbSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const dbProfile = await supabaseService.fetchUserProfile(session.user.id);
          const isPaid = dbProfile?.is_premium === true || (dbProfile?.payment_plan && dbProfile.payment_plan !== 'free');
          if (isPaid) {
            dispatch(unlockPremium());
            await AsyncStorage.setItem('iMaxx_is_premium_unlocked', 'true');
          } else {
            dispatch(lockPremium());
            await AsyncStorage.removeItem('iMaxx_is_premium_unlocked');
          }
        } else {
          dispatch(lockPremium());
          await AsyncStorage.removeItem('iMaxx_is_premium_unlocked');
        }
      } catch (e) {
        dispatch(lockPremium());
      }
    };
    checkDbSubscription();
  }, [dispatch]);

  // Execute purchase flow
  const purchasePackage = async (packageId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const planName = packageId.includes('yearly') ? 'annual_ultra' : 'monthly_pass';

      // 1. Sync to Supabase public.profiles table
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        await supabaseService.updatePaymentPlan(session.user.id, planName, true);
      }

      // 2. Register in RevenueCat
      try {
        const userId = session?.user?.id || (await AsyncStorage.getItem('iMaxx_user_id')) || 'user_imaxx_' + Date.now();
        await AsyncStorage.setItem('iMaxx_user_id', userId);

        await fetch('https://api.revenuecat.com/v2/projects/proj384dd416/customers', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk_mdumHHGVrWQrQEORiNHvtUlZjzAcg',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: userId }),
        });

        await fetch(`https://api.revenuecat.com/v2/projects/proj384dd416/customers/${userId}/entitlements/entlaa3ac44ca7/actions/grant`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk_mdumHHGVrWQrQEORiNHvtUlZjzAcg',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration: packageId.includes('yearly') ? 'yearly' : 'monthly' }),
        });

        console.log(`[Purchases] Registered customer '${userId}' in RevenueCat Dashboard`);
      } catch (rcErr) {}

      // 3. Update Redux state and local storage
      dispatch(unlockPremium());
      await AsyncStorage.setItem('iMaxx_is_premium_unlocked', 'true');
      await AsyncStorage.setItem('iMaxx_subscription_plan', packageId);

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('[Purchases Error]:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Restore previous purchases
  const restorePurchases = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const dbProfile = await supabaseService.fetchUserProfile(session.user.id);
        const isPaid = dbProfile?.is_premium === true || (dbProfile?.payment_plan && dbProfile.payment_plan !== 'free');
        if (isPaid) {
          dispatch(unlockPremium());
          await AsyncStorage.setItem('iMaxx_is_premium_unlocked', 'true');
          setIsLoading(false);
          return true;
        }
      }
    } catch (e) {}
    dispatch(lockPremium());
    await AsyncStorage.removeItem('iMaxx_is_premium_unlocked');
    setIsLoading(false);
    return false;
  };

  return {
    isPremiumUnlocked,
    offerings,
    isLoading,
    purchasePackage,
    restorePurchases,
  };
};
