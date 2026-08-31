import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, PanResponder } from 'react-native';
import { X, CheckCircle2, Star, Crown, Flame, Sparkles } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { unlockPremium } from '../store/audioSlice';
import { usePurchases } from '../hooks/usePurchases';

interface PaywallProps {
  onClose: () => void;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { purchasePackage, restorePurchases, isLoading } = usePurchases();
  const [selectedPlan, setSelectedPlan] = useState<'imaxx_monthly_699' | 'imaxx_annual_1900'>('imaxx_monthly_699');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dy, dx } = gestureState;
        return dy > 45 && Math.abs(dx) < 30;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dy } = gestureState;
        if (dy > 90) {
          onClose();
        }
      },
    })
  ).current;

  const handlePurchase = async () => {
    const success = await purchasePackage(selectedPlan);
    if (success) {
      dispatch(unlockPremium());
      setToastMsg('🎉 Premium Unlocked Successfully!');
      setTimeout(() => {
        setToastMsg(null);
        onClose();
      }, 1400);
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      dispatch(unlockPremium());
      setToastMsg('✓ Purchases Restored Successfully');
      setTimeout(() => {
        setToastMsg(null);
        onClose();
      }, 1400);
    } else {
      setToastMsg('No active purchases found');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.sheetContainer}>
        {/* Top Swipe Drag Handle Bar */}
        <View style={styles.dragHeader} {...panResponder.panHandlers}>
          <View style={styles.dragBar} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Gem Icon */}
          <View style={styles.heroSection}>
            <View style={styles.gemContainer}>
              <Text style={styles.gemIcon}>💎</Text>
            </View>
            <Text style={styles.mainTitle}>Pick your plan</Text>

            {/* Feature Bullet List */}
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <CheckCircle2 size={15} color="#9B7EDE" />
                </View>
                <Text style={styles.featureText}>Unlock 1,500+ Natural, Relaxing & Deep Focus Soundtracks</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <CheckCircle2 size={15} color="#9B7EDE" />
                </View>
                <Text style={styles.featureText}>Smart 90-Min Circadian Sleep Cycle Alarms</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <CheckCircle2 size={15} color="#9B7EDE" />
                </View>
                <Text style={styles.featureText}>Custom Local MP3 Ringtones Importer</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <CheckCircle2 size={15} color="#9B7EDE" />
                </View>
                <Text style={styles.featureText}>Calibrated 60s Physical Shake Wakeup Challenge</Text>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <CheckCircle2 size={15} color="#9B7EDE" />
                </View>
                <Text style={styles.featureText}>Full Focus & Sleep Regularity Analytics</Text>
              </View>
            </View>

            {/* Rating Stars Social Proof */}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingScore}>4.9 stars</Text>
              <View style={{ flexDirection: 'row', marginHorizontal: 4 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={13} color="#FFD700" fill="#FFD700" style={{ marginRight: 2 }} />
                ))}
              </View>
              <Text style={styles.ratingReviews}>1,000+ reviews</Text>
            </View>
          </View>

          {/* Pricing Options Cards */}
          <View style={styles.plansContainer}>
            {/* Plan 1: Annual Ultra Plan ($19.50/yr) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'imaxx_annual_1900' && styles.planCardSelected,
              ]}
              activeOpacity={0.88}
              onPress={() => setSelectedPlan('imaxx_annual_1900')}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radioButton, selectedPlan === 'imaxx_annual_1900' && styles.radioButtonSelected]}>
                  {selectedPlan === 'imaxx_annual_1900' && <View style={styles.radioInnerDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>Annual Ultra Plan</Text>
                  <Text style={styles.planSubtext}>Only $1.58/mo billed annually</Text>
                </View>
                <View style={styles.planRightColumn}>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>77% OFF</Text>
                  </View>
                  <Text style={styles.priceMain}>$19.50/yr</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Plan 2: 7-Day Pass / Monthly ($1.00 trial, then $6.99/mo) */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'imaxx_monthly_699' && styles.planCardSelected,
              ]}
              activeOpacity={0.88}
              onPress={() => setSelectedPlan('imaxx_monthly_699')}
            >
              <View style={styles.radioRow}>
                <View style={[styles.radioButton, selectedPlan === 'imaxx_monthly_699' && styles.radioButtonSelected]}>
                  {selectedPlan === 'imaxx_monthly_699' && <View style={styles.radioInnerDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>7-Day Premium Pass</Text>
                  <Text style={styles.planSubtext}>$1.00 for 7 days, then $6.99/mo</Text>
                </View>
                <View style={styles.planRightColumn}>
                  <View style={styles.trialBadge}>
                    <Text style={styles.trialBadgeText}>$1.00 TRIAL</Text>
                  </View>
                  <Text style={styles.priceMain}>$6.99/mo</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Feedback Toast */}
          {toastMsg && (
            <View style={styles.toastBox}>
              <Text style={styles.toastText}>{toastMsg}</Text>
            </View>
          )}

          {/* Main CTA Continue Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.85}
            onPress={handlePurchase}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#08080C" />
            ) : (
              <Text style={styles.continueBtnText}>
                {selectedPlan === 'imaxx_monthly_699'
                  ? 'Start $1.00 7-Day Pass ⚡'
                  : 'Get Annual Ultra Plan ($19.50/yr) 👑'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerRow}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.footerLink}>Restore Purchases</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerLink}>Terms</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerLink}>Privacy</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F0E17',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 34,
    maxHeight: '94%',
  },
  dragHeader: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 6,
  },
  dragBar: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: 6,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gemContainer: {
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
  gemIcon: {
    fontSize: 32,
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  featureList: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletDot: {
    marginRight: 10,
  },
  featureText: {
    color: '#E2E0EE',
    fontSize: 13,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingScore: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingReviews: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  plansContainer: {
    marginBottom: 18,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 12,
  },
  planCardSelected: {
    borderColor: '#00F2FE',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#00F2FE',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00F2FE',
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  planSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  planRightColumn: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    backgroundColor: '#FF2A85',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  trialBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  trialBadgeText: {
    color: '#00F2FE',
    fontSize: 10,
    fontWeight: '800',
  },
  priceMain: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  toastBox: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  toastText: {
    color: '#00F2FE',
    fontSize: 13,
    fontWeight: '700',
  },
  continueBtn: {
    backgroundColor: '#00F2FE',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  continueBtnText: {
    color: '#08080C',
    fontSize: 16,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  footerDot: {
    color: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
    fontSize: 11,
  },
});
