import React from 'react';
import { ScrollView, Share, Linking } from 'react-native';
import styled from 'styled-components/native';
import { X, ChevronRight, Settings, Bell, Palette, Archive, Download, ArrowUpDown, HelpCircle, Eye, Mail, Globe, Lock, Star, Sparkles } from 'lucide-react-native';
import { useAppDispatch } from '../store';
import { resetOnboarding } from '../store/habitSlice';

interface SettingsSheetProps {
  onClose: () => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();

  const handleShowOnboarding = () => {
    dispatch(resetOnboarding());
    onClose();
  };

  const handleFeedback = () => {
    Linking.openURL('mailto:support@dopamind.app?subject=Dopamind Feedback');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Master your ADHD flow with Dopamind soundscapes and nano habit trackers!',
        url: 'https://dopamind.app',
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Container>
      <HeaderRow>
        <CloseButton onPress={onClose}>
          <X size={22} color="#FFFFFF" />
        </CloseButton>
        <HeaderTitle>Settings</HeaderTitle>
        <Placeholder />
      </HeaderRow>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Premium Upgrade Card */}
        <ProCard activeOpacity={0.9}>
          <ProCardLeft>
            <ProIconGrid>
              <Star size={16} color="#08080A" fill="#08080A" />
            </ProIconGrid>
            <ProTextWrapper>
              <ProTitle>Subscribe to Dopamind Pro</ProTitle>
              <ProDesc>Unlimited habits, offline loops, custom widget themes</ProDesc>
            </ProTextWrapper>
          </ProCardLeft>
          <ChevronRight size={18} color="#FF7E47" />
        </ProCard>

        {/* Section: App Settings */}
        <SectionTitle>App Settings</SectionTitle>
        <SettingsGroupCard>
          <SettingsRow border>
            <RowLeft>
              <IconBox color="#FF7E47">
                <Settings size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>General Preferences</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow border>
            <RowLeft>
              <IconBox color="#00F2FE">
                <Bell size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Daily Check-In Reminders</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow border>
            <RowLeft>
              <IconBox color="#9B7EDE">
                <Palette size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Theme Customization</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow border>
            <RowLeft>
              <IconBox color="#FFB347">
                <Archive size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Archived Habits</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow border>
            <RowLeft>
              <IconBox color="#38EF7D">
                <Download size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Data Backup Import/Export</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow>
            <RowLeft>
              <IconBox color="#C4A8F5">
                <ArrowUpDown size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Reorder Habits</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>
        </SettingsGroupCard>

        {/* Section: Help & Support */}
        <SectionTitle>Help & Support</SectionTitle>
        <SettingsGroupCard>
          <SettingsRow border onPress={handleShowOnboarding}>
            <RowLeft>
              <IconBox color="#FF6B6B">
                <HelpCircle size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Show Onboarding Setup</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow border>
            <RowLeft>
              <IconBox color="#00F2FE">
                <Eye size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>What's New in iOS 26+</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow onPress={handleFeedback}>
            <RowLeft>
              <IconBox color="#FFB347">
                <Mail size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Send Feedback / Feature Request</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>
        </SettingsGroupCard>

        {/* Section: About */}
        <SectionTitle>About</SectionTitle>
        <SettingsGroupCard>
          <SettingsRow border onPress={handleShare}>
            <RowLeft>
              <IconBox color="#38EF7D">
                <Sparkles size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Share Dopamind App</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow border onPress={() => Linking.openURL('https://dopamind.app')}>
            <RowLeft>
              <IconBox color="#9B7EDE">
                <Globe size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Official Website</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>

          <SettingsRow onPress={() => Linking.openURL('https://dopamind.app/privacy')}>
            <RowLeft>
              <IconBox color="#6B6280">
                <Lock size={16} color="#FFFFFF" />
              </IconBox>
              <RowLabel>Privacy Policy & Terms</RowLabel>
            </RowLeft>
            <ChevronRight size={16} color="#6B6280" />
          </SettingsRow>
        </SettingsGroupCard>

        <FooterText>Dopamind v1.0.0 (iOS 26+ Build)</FooterText>
        <ExtraSpacing />
      </ScrollContent>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: #08080A;
  padding-top: 50px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom-width: 1px;
  border-bottom-color: #1E1E26;
`;

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  justify-content: center;
  align-items: center;
`;

const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 17px;
  font-weight: bold;
`;

const Placeholder = styled.View`
  width: 36px;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 20px;
`;

// Pro Upgrade Card
const ProCard = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #111116;
  border-width: 1px;
  border-color: #FF7E47;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
`;

const ProCardLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const ProIconGrid = styled.View`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #FF7E47;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const ProTextWrapper = styled.View`
  flex: 1;
`;

const ProTitle = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: bold;
`;

const ProDesc = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 2px;
`;

// Settings Sections
const SectionTitle = styled.Text`
  color: #6B6280;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  margin-left: 4px;
`;

const SettingsGroupCard = styled.View`
  background-color: #111116;
  border-width: 1px;
  border-color: #1E1E26;
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
`;

const SettingsRow = styled.TouchableOpacity<{ border?: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom-width: ${props => props.border ? '1px' : '0px'};
  border-bottom-color: #1E1E26;
`;

const RowLeft = styled.View`
  flex-direction: row;
  align-items: center;
`;

const IconBox = styled.View<{ color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const RowLabel = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 500;
`;

const FooterText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  text-align: center;
  margin-top: 10px;
`;

const ExtraSpacing = styled.View`
  height: 60px;
`;
