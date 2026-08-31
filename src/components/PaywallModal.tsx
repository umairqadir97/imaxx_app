import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { X, Sparkles, CheckCircle2, ShieldCheck, Zap, Crown, Flame } from 'lucide-react-native';
import { usePurchases } from '../hooks/usePurchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  customTitle?: string;
  customSubtitle?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, onSuccess, customTitle, customSubtitle }) => {
  const { offerings, purchasePackage, restorePurchases, isLoading } = usePurchases();
  const [selectedPlan, setSelectedPlan] = useState<'imaxx_monthly_699' | 'imaxx_annual_1900'>('imaxx_monthly_699');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handlePurchase = async () => {
    const success = await purchasePackage(selectedPlan);
    if (success) {
      setToastMsg('🎉 Premium Unlocked Successfully!');
      setTimeout(() => {
        setToastMsg(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      setToastMsg('✓ Purchases Restored Successfully');
      setTimeout(() => {
        setToastMsg(null);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } else {
      setToastMsg('No active purchases found');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header Badge */}
            <View style={styles.header}>
              <View style={styles.badgeRow}>
                <Crown size={16} color="#FFD700" style={{ marginRight: 6 }} />
                <Text style={styles.badgeText}>IMAX PRO UNLIMITED</Text>
              </View>
              <Text style={styles.title}>{customTitle || 'Unlock Extreme Focus & Circadian Sleep'}</Text>
              <Text style={styles.subtitle}>
                {customSubtitle || 'Unlock 1,500+ natural, relaxing, meditation and deep focus work soundtracks, custom MP3 alarms, and 90-minute sleep cycle intelligence.'}
              </Text>
            </View>

            {/* Feature Checklist */}
            <View style={styles.featureBox}>
              <View style={styles.featureRow}>
                <CheckCircle2 size={18} color="#4ECDC4" style={{ marginRight: 10 }} />
                <Text style={styles.featureText}>Unlimited CloudFront Hi-Fi Natural Soundtracks</Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle2 size={18} color="#4ECDC4" style={{ marginRight: 10 }} />
                <Text style={styles.featureText}>Smart 90-Minute Circadian Sleep Cycle Alarms</Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle2 size={18} color="#4ECDC4" style={{ marginRight: 10 }} />
                <Text style={styles.featureText}>Custom Local MP3 File Ringtone Importer</Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle2 size={18} color="#4ECDC4" style={{ marginRight: 10 }} />
                <Text style={styles.featureText}>Calibrated 60s Physical Shake Forced Wakeup</Text>
              </View>
            </View>

            {/* Plan Cards */}
            <View style={styles.plansContainer}>
              {/* Option 1: Monthly Pass ($1.00 7-Day Trial) */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'imaxx_monthly_699' && styles.planCardActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedPlan('imaxx_monthly_699')}
              >
                <View style={styles.planHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Flame size={16} color="#FF7E47" style={{ marginRight: 6 }} />
                    <Text style={styles.planTitle}>7-Day Premium Pass</Text>
                  </View>
                  <View style={styles.trialTag}>
                    <Text style={styles.trialTagText}>$1.00 TRIAL PASS</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>$1.00 <Text style={styles.planPriceSub}>for 7 days</Text></Text>
                <Text style={styles.planDetail}>Then $6.99/month. Cancel anytime in App Store / Play Store.</Text>
              </TouchableOpacity>

              {/* Option 2: Annual Plan ($19.00 / year) */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'imaxx_annual_1900' && styles.planCardActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setSelectedPlan('imaxx_annual_1900')}
              >
                <View style={styles.planHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Crown size={16} color="#9B7EDE" style={{ marginRight: 6 }} />
                    <Text style={styles.planTitle}>Annual Ultra Plan</Text>
                  </View>
                  <View style={styles.bestValueTag}>
                    <Text style={styles.bestValueTagText}>SAVE 77%</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>$19.00 <Text style={styles.planPriceSub}>/ year</Text></Text>
                <Text style={styles.planDetail}>Equivalent to just $1.58/month. Billed annually.</Text>
              </TouchableOpacity>
            </View>

            {/* Feedback Toast */}
            {toastMsg && (
              <View style={styles.toastBox}>
                <Text style={styles.toastText}>{toastMsg}</Text>
              </View>
            )}

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.ctaButton}
              activeOpacity={0.8}
              onPress={handlePurchase}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0D0D15" />
              ) : (
                <Text style={styles.ctaButtonText}>
                  {selectedPlan === 'imaxx_monthly_699'
                    ? 'Start $1.00 7-Day Premium Pass ⚡'
                    : 'Get Annual Ultra Plan for $19/yr 👑'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer & Restore */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={handleRestore}>
                <Text style={styles.restoreText}>Restore Purchases</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Subscriptions renew automatically unless canceled at least 24h before end of period.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#161622',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    zIndex: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  featureBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#E6E6FA',
    fontSize: 13,
    fontWeight: '500',
  },
  plansContainer: {
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  planCardActive: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  trialTag: {
    backgroundColor: 'rgba(255, 126, 71, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  trialTagText: {
    color: '#FF7E47',
    fontSize: 10,
    fontWeight: '800',
  },
  bestValueTag: {
    backgroundColor: 'rgba(155, 126, 222, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestValueTagText: {
    color: '#9B7EDE',
    fontSize: 10,
    fontWeight: '800',
  },
  planPrice: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  planPriceSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
  planDetail: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  toastBox: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  toastText: {
    color: '#4ECDC4',
    fontSize: 12,
    fontWeight: '700',
  },
  ctaButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  ctaButtonText: {
    color: '#0D0D15',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
  },
  restoreText: {
    color: '#9B7EDE',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
