import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View, Text, TextInput, Modal, ActivityIndicator, Dimensions, ImageBackground, Image } from 'react-native';
import styled from 'styled-components/native';
import { X, Play, Compass, Moon, Plus, Music, Upload, Trash2, Folder, Volume2, Sun, Activity, CloudRain, Headphones, FileAudio, Check, Lock, Search, Flame, Sparkles, Heart, Smile, BookOpen, BrainCircuit } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { setSoundscape, setScenario } from '../store/audioSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// -------------------------------------------------------------
// Styled components declared at the top to prevent TDZ ReferenceErrors
// -------------------------------------------------------------
const Container = styled.View`
  flex: 1;
  background-color: #08080A;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 14px 20px;
  background-color: rgba(15, 15, 20, 0.7);
  border-bottom-width: 0.8px;
  border-bottom-color: rgba(255, 255, 255, 0.08);
`;

const LogoArea = styled.View`
  flex-direction: row;
  align-items: center;
`;

const LogoIconCircle = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: rgba(255, 126, 71, 0.12);
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const LogoText = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
`;

const CloseButton = styled.TouchableOpacity`
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-color: rgba(255, 255, 255, 0.06);
  justify-content: center;
  align-items: center;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.1);
`;

const CategoriesWrapper = styled.View`
  background-color: rgba(15, 15, 20, 0.7);
  padding-vertical: 12px;
  border-bottom-width: 0.8px;
  border-bottom-color: rgba(255, 255, 255, 0.08);
`;

const CategoryPill = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.04)'};
  padding-horizontal: 14px;
  padding-vertical: 6px;
  border-radius: 16px;
  margin-right: 8px;
  border-width: 0.8px;
  border-color: ${props => props.active ? 'transparent' : 'rgba(255, 255, 255, 0.08)'};
`;

const CategoryText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080A' : '#E6E6FA'};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const ScrollViewContent = styled.ScrollView`
  flex: 1;
  padding: 16px;
`;

const AllDashboardContainer = styled.View`
  flex: 1;
`;

const SearchBoxContainer = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding-horizontal: 14px;
  height: 44px;
  margin-bottom: 24px;
`;

const SearchInput = styled.TextInput`
  flex: 1;
  color: #FFFFFF;
  font-size: 14px;
`;

const QuickCategoryGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const QuickCategoryCard = styled.TouchableOpacity`
  width: 23%;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 10px 4px;
  align-items: center;
  margin-bottom: 12px;
`;

const QuickCategoryIconBox = styled.View<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.color + '15'};
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
`;

const QuickCategoryLabel = styled.Text`
  color: #E6E6FA;
  font-size: 10px;
  font-weight: 500;
  text-align: center;
`;

const SectionHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SectionTitle = styled.Text`
  color: #8E8E93;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const SeeAllLink = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: 600;
`;

const GoalsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const GoalCard = styled.TouchableOpacity`
  width: 48%;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 12px;
  align-items: center;
  margin-bottom: 14px;
`;

const GoalImageContainer = styled.View`
  width: 100%;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  background-color: rgba(0, 0, 0, 0.3);
`;

const GoalImage = styled.Image`
  width: 74px;
  height: 74px;
  border-radius: 37px;
  border-width: 1.5px;
  border-color: rgba(255, 255, 255, 0.15);
`;

const GoalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const LargeTileContainer = styled.View`
  margin-bottom: 24px;
`;

const LargeTileCard = styled.TouchableOpacity`
  width: 270px;
  height: 140px;
  border-radius: 18px;
  overflow: hidden;
  margin-right: 14px;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
`;

const LargeTileImage = styled.Image`
  width: 100%;
  height: 100%;
  position: absolute;
`;

const LargeTileOverlay = styled.View`
  flex: 1;
  background-color: rgba(8, 8, 10, 0.45);
  padding: 16px;
  justify-content: flex-end;
`;

const LargeTileCategory = styled.Text<{ color: string }>`
  color: ${props => props.color};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  margin-bottom: 4px;
`;

const LargeTileTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const LargeTileSub = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  margin-top: 2px;
`;

const TimePill = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding-horizontal: 16px;
  padding-vertical: 8px;
  margin-right: 8px;
`;

const TimePillText = styled.Text`
  color: #E6E6FA;
  font-size: 11px;
  font-weight: 500;
`;

const GridContainer = styled.View`
  flex: 1;
`;

const TracksGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const GridCardCell = styled.TouchableOpacity`
  width: 48%;
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  margin-bottom: 16px;
  overflow: hidden;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  shadow-color: #000;
  shadow-opacity: 0.3;
  shadow-radius: 10px;
  elevation: 5;
`;

const CardHeaderImage = styled.ImageBackground`
  height: 100px;
  width: 100%;
`;

const CardHeaderOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.2);
  justify-content: center;
  align-items: center;
  position: relative;
`;

const LockBadge = styled.View`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: rgba(15, 15, 20, 0.85);
  border-width: 0.5px;
  border-color: rgba(255, 255, 255, 0.2);
  justify-content: center;
  align-items: center;
`;

const CardBody = styled.View`
  padding: 12px;
  background-color: rgba(15, 15, 20, 0.4);
`;

const CardTitle = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const CardSubtitle = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  margin-top: 2px;
`;

const CardFooterRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
`;

const CardDuration = styled.Text`
  color: #A2A2A8;
  font-size: 10px;
`;

const CardPlayCircle = styled.View`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.95);
  justify-content: center;
  align-items: center;
`;

const UploadsSection = styled.View`
  flex: 1;
`;

const UploadBanner = styled.View`
  background-color: rgba(255, 126, 71, 0.08);
  border-width: 0.8px;
  border-color: rgba(255, 126, 71, 0.2);
  border-radius: 20px;
  padding: 20px;
  align-items: center;
  margin-bottom: 24px;
`;

const UploadIconBox = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 126, 71, 0.12);
  justify-content: center;
  align-items: center;
  margin-bottom: 12px;
`;

const UploadBannerTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const UploadBannerDesc = styled.Text`
  color: #A2A2A8;
  font-size: 11px;
  text-align: center;
  margin-top: 6px;
  line-height: 16px;
  padding-horizontal: 10px;
`;

const UploadTriggerButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #FF7E47;
  padding-horizontal: 16px;
  padding-vertical: 8px;
  border-radius: 16px;
  margin-top: 16px;
`;

const UploadTriggerButtonText = styled.Text`
  color: #08080A;
  font-size: 12px;
  font-weight: 700;
  margin-left: 6px;
`;

const EmptyStateContainer = styled.View`
  align-items: center;
  padding: 40px 20px;
`;

const EmptyStateText = styled.Text`
  color: #6B6280;
  font-size: 12px;
  text-align: center;
  margin-top: 12px;
  line-height: 18px;
`;

const TrackListItem = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.03);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 10px;
`;

const TrackListLeft = styled.View`
  flex-direction: row;
  align-items: center;
  flex: 1;
`;

const TrackColorIcon = styled.View<{ color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-right: 12px;
`;

const TrackDetails = styled.View`
  flex: 1;
`;

const TrackListName = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
`;

const TrackListSub = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  margin-top: 2px;
`;

const TrackListRight = styled.View`
  flex-direction: row;
  align-items: center;
`;

const PlayButtonBox = styled.TouchableOpacity`
  width: 26px;
  height: 26px;
  border-radius: 13px;
  background-color: #FF7E47;
  justify-content: center;
  align-items: center;
  margin-right: 8px;
`;

const DeleteButtonBox = styled.TouchableOpacity`
  width: 26px;
  height: 26px;
  justify-content: center;
  align-items: center;
`;

const ExtraSpacing = styled.View`
  height: 60px;
`;

const ModalBackdrop = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(8, 8, 10, 0.85);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContainer = styled.TouchableOpacity`
  width: 100%;
  max-width: 360px;
  background-color: #121218;
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 20px;
  shadow-color: #000;
  shadow-opacity: 0.5;
  shadow-radius: 16px;
  elevation: 10;
`;

const ModalHeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const ModalCloseButton = styled.TouchableOpacity`
  width: 24px;
  height: 24px;
  justify-content: center;
  align-items: center;
`;

const FormLabel = styled.Text`
  color: #8E8E93;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 8px;
  margin-top: 12px;
`;

const FormInput = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.04);
  border-width: 0.8px;
  border-color: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 13px;
  padding: 10px 14px;
`;

const CategoryChoiceRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ChoiceButton = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  background-color: ${props => props.active ? '#FF7E47' : 'rgba(255, 255, 255, 0.04)'};
  border-width: 0.8px;
  border-color: ${props => props.active ? 'transparent' : 'rgba(255, 255, 255, 0.08)'};
  border-radius: 12px;
  padding: 8px;
  align-items: center;
  margin-horizontal: 3px;
`;

const ChoiceText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#08080A' : '#E6E6FA'};
  font-size: 10px;
  font-weight: 700;
`;

const ColorPickerRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ColorDot = styled.TouchableOpacity<{ color: string; selected: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  border-width: 2px;
  border-color: ${props => props.selected ? '#FFFFFF' : 'transparent'};
`;

const FileSelectedBox = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(78, 205, 196, 0.06);
  border-width: 0.8px;
  border-color: rgba(78, 205, 196, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
`;

const FileNameText = styled.Text`
  color: #4ECDC4;
  font-size: 12px;
  flex: 1;
  margin-left: 8px;
`;

const ChooseFileLink = styled.Text`
  color: #FF7E47;
  font-size: 11px;
  font-weight: 600;
`;

const UploadPlaceholder = styled.TouchableOpacity`
  background-color: rgba(255, 255, 255, 0.02);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.08);
  border-style: dashed;
  border-radius: 12px;
  padding: 20px;
  align-items: center;
`;

const UploadPlaceholderText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  margin-top: 6px;
  text-align: center;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: #FF7E47;
  border-radius: 14px;
  padding: 12px;
  align-items: center;
  margin-top: 24px;
`;

const SaveButtonText = styled.Text`
  color: #08080A;
  font-size: 13px;
  font-weight: 700;
`;

// -------------------------------------------------------------
// Component Props and implementation
// -------------------------------------------------------------
interface ScenariosGridProps {
  onClose: () => void;
  onOpenPaywall: () => void;
  onSelectScenario: () => void;
}

export const ScenariosGrid: React.FC<ScenariosGridProps> = ({
  onClose,
  onOpenPaywall,
  onSelectScenario,
}) => {
  const dispatch = useAppDispatch();
  const { isPremiumUnlocked } = useAppSelector((state) => state.audio);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulated custom uploaded tracks
  const [customTracks, setCustomTracks] = useState<any[]>([
    { id: 'custom_1', name: 'My Focus Ambient Loop', category: 'focus', duration: '12m', color: '#9B7EDE', file: 'ambient_focus_432.mp3', bgUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=400' },
    { id: 'custom_2', name: 'Breathing Session Guide', category: 'relax', duration: '5m', color: '#4ECDC4', file: 'breath_slow.wav', bgUrl: 'https://images.unsplash.com/photo-1475113548554-5a36f1f523d6?q=80&w=400' }
  ]);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackCategory, setNewTrackCategory] = useState<'focus' | 'sleep' | 'relax'>('focus');
  const [selectedColor, setSelectedColor] = useState('#9B7EDE');
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Category tags
  const categories = [
    { id: 'all', label: 'All 🌌' },
    { id: 'focus', label: 'Focus 🎯' },
    { id: 'sleep', label: 'Sleep 🌙' },
    { id: 'frequencies', label: 'Frequencies 🧬' },
    { id: 'nature', label: 'Nature 🌲' },
    { id: 'rain', label: 'Rain 🌧️' },
    { id: 'relaxing', label: 'Relaxing 🧘' },
    { id: 'uploads', label: 'My Uploads 📤' }
  ];

  // Predefined sounds library using high-res premium Unsplash cover art matching Portal
  const predefinedSounds: Record<string, any[]> = {
    focus: [
      { id: 'focus_1', name: 'ADHD Deep Flow', sub: 'Binaural Alpha Waves', duration: '15m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400' },
      { id: 'focus_2', name: 'Gamma Concentration', sub: '40Hz Peak Focus', duration: '25m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400' },
      { id: 'focus_3', name: 'Circadian Flow Sync', sub: 'Neuro-Enhancer Beats', duration: '45m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400' },
      { id: 'focus_4', name: 'Ultradian Work Rhythm', sub: 'Active Attention Guide', duration: '20m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400' }
    ],
    sleep: [
      { id: 'sleep_1', name: 'Theta Dreamscape', sub: 'Deep Rest & Recharge', duration: '30m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=400' },
      { id: 'sleep_2', name: 'Lunar Sleep Cradle', sub: 'Gentle Frequency Sleep Inducer', duration: '60m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?q=80&w=400' },
      { id: 'sleep_3', name: 'Ocean Twilight', sub: 'Rhythmic Sleep Inducer', duration: '45m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=400' },
      { id: 'sleep_4', name: 'Cosmic Star Rest', sub: 'Astral Sleeping Space', duration: '60m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=400' }
    ],
    frequencies: [
      { id: 'freq_1', name: '528Hz Solfeggio', sub: 'Cellular Repair Freq', duration: '30m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400' },
      { id: 'freq_2', name: '432Hz Cosmic Calm', sub: 'Heart Rate Resonator', duration: '25m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=400' },
      { id: 'freq_3', name: '40Hz Gamma Focus', sub: 'High Synapse Energy', duration: '45m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=400' },
      { id: 'freq_4', name: '8Hz Theta Sleep', sub: 'Theta Wave Inducer', duration: '50m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400' }
    ],
    nature: [
      { id: 'nature_1', name: 'Forest Wind Whispers', sub: 'Somatic Leaf Rustles', duration: '20m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400' },
      { id: 'nature_2', name: 'Campfire Logs Crackle', sub: 'Warm Night Embers', duration: '35m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1501862700950-18e023f96de5?q=80&w=400' },
      { id: 'nature_3', name: 'Somatic River Calmer', sub: 'Gentle Flow Stream', duration: '40m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400' },
      { id: 'nature_4', name: 'Mountain Ocean Tide', sub: 'Resonant Coast Shore', duration: '25m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=400' }
    ],
    rain: [
      { id: 'rain_1', name: 'Cozy Attic Storm', sub: 'Heavy Roof Rainfall', duration: '30m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=400' },
      { id: 'rain_2', name: 'Rainforest Shower', sub: 'Tropical Leaf Patter', duration: '45m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=400' },
      { id: 'rain_3', name: 'Soft Summer Drizzle', sub: 'Calm Meadow Rainfall', duration: '20m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?q=80&w=400' },
      { id: 'rain_4', name: 'Thunderstorm Sleep', sub: 'Deep Ambient Rumble', duration: '50m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1488034976201-ffbaa99cbf5c?q=80&w=400' }
    ],
    relaxing: [
      { id: 'relax_1', name: 'Zen Temple Bowl', sub: 'Resonant Singing Bowls', duration: '15m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=400' },
      { id: 'relax_2', name: 'Bilateral EMDR Sync', sub: 'Side-to-Side Calmer', duration: '30m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400' },
      { id: 'relax_3', name: 'Anxiety Rescue Wave', sub: 'Vagus Nerve Stimulator', duration: '25m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=400' },
      { id: 'relax_4', name: 'Somatic Calm Sound', sub: 'Calming Resonance System', duration: '40m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=400' }
    ]
  };

  const goalsList = [
    { id: 'goal_1', title: 'Fall Asleep', bgUrl: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=400', category: 'sleep' },
    { id: 'goal_2', title: 'Reduce Anxiety', bgUrl: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=400', category: 'relax' },
    { id: 'goal_3', title: 'Learn to Meditate', bgUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400', category: 'relax' },
    { id: 'goal_4', title: 'Build a Daily Habit', bgUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400', category: 'focus' },
    { id: 'goal_5', title: 'Improve Focus', bgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400', category: 'focus' },
    { id: 'goal_6', title: 'Personal Growth', bgUrl: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=400', category: 'relax' }
  ];

  const quickCategories = [
    { id: 'relaxing', label: 'Meditation', color: '#9B7EDE', icon: <Sparkles size={16} color="#9B7EDE" /> },
    { id: 'focus', label: 'Music', color: '#FF7E47', icon: <Music size={16} color="#FF7E47" /> },
    { id: 'sleep', label: 'Sleep Calm', color: '#00BCD4', icon: <Moon size={16} color="#00BCD4" /> },
    { id: 'frequencies', label: 'Wisdom', color: '#4ECDC4', icon: <BrainCircuit size={16} color="#4ECDC4" /> },
    { id: 'nature', label: 'Calm Life', color: '#E91E63', icon: <Heart size={16} color="#E91E63" /> },
    { id: 'rain', label: 'Rainstorms', color: '#FFD700', icon: <CloudRain size={16} color="#FFD700" /> },
    { id: 'relaxing', label: 'Soundscapes', color: '#4CAF50', icon: <Compass size={16} color="#4CAF50" /> },
    { id: 'focus', label: 'For Work', color: '#9C27B0', icon: <BookOpen size={16} color="#9C27B0" /> },
  ];

  const newNoteworthyList = [
    { id: 'nature_3', name: 'Maine Calm Lake', sub: 'Forged by Nature • Magic of Maine', duration: '40m', isPremium: true, bgUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=600', category: 'nature' },
    { id: 'sleep_2', name: 'Lunar Sleep Cradle', sub: 'Gentle Frequency Sleep Inducer', duration: '60m', isPremium: false, bgUrl: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?q=80&w=600', category: 'sleep' }
  ];

  const colors = ['#9B7EDE', '#4ECDC4', '#FF7E47', '#00BCD4', '#E91E63', '#FFD700'];

  const handleSelectSound = (sound: any) => {
    // Dispatch setScenario to select and play the specific scenario track
    dispatch(setScenario(sound.id));
    onSelectScenario();
  };

  const handleSelectGoal = (goal: any) => {
    dispatch(setSoundscape(goal.category));
    onSelectScenario();
  };

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setSimulatedFileName(`my_track_${Math.floor(Math.random() * 9000) + 1000}.mp3`);
    }, 1200);
  };

  const handleSaveTrack = () => {
    if (!newTrackName || !simulatedFileName) return;
    const newTrack = {
      id: `custom_${Date.now()}`,
      name: newTrackName,
      category: newTrackCategory,
      duration: 'Custom',
      color: selectedColor,
      file: simulatedFileName,
      bgUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=400'
    };
    setCustomTracks([newTrack, ...customTracks]);
    setShowUploadModal(false);
    setNewTrackName('');
    setSimulatedFileName('');
  };

  const handleDeleteTrack = (id: string) => {
    setCustomTracks(customTracks.filter(t => t.id !== id));
  };

  const getFilteredPredefined = () => {
    const list: any[] = [];
    Object.keys(predefinedSounds).forEach((cat) => {
      predefinedSounds[cat].forEach((sound) => {
        if (!searchQuery || sound.name.toLowerCase().includes(searchQuery.toLowerCase()) || sound.sub.toLowerCase().includes(searchQuery.toLowerCase())) {
          list.push({ ...sound, category: cat });
        }
      });
    });
    return list;
  };

  return (
    <Container>
      {/* Top Navigation Header */}
      <HeaderBar>
        <LogoArea>
          <LogoIconCircle>
            <Compass size={18} color="#FF7E47" />
          </LogoIconCircle>
          <LogoText>Discover</LogoText>
        </LogoArea>
        <CloseButton onPress={onClose}>
          <X size={18} color="#FFFFFF" />
        </CloseButton>
      </HeaderBar>

      {/* Horizontal Scrollable Categories with Apple Glass design */}
      <CategoriesWrapper>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <CategoryPill key={cat.id} active={isActive} onPress={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}>
                <CategoryText active={isActive}>{cat.label}</CategoryText>
              </CategoryPill>
            );
          })}
        </ScrollView>
      </CategoriesWrapper>

      {/* Discover Sound Listing Grid */}
      <ScrollViewContent showsVerticalScrollIndicator={false}>
        {/* Render ALL Dashboard layout if activeCategory is 'all' */}
        {activeCategory === 'all' && !searchQuery && (
          <AllDashboardContainer>
            {/* Search Input Bar */}
            <SearchBoxContainer>
              <Search size={16} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
              <SearchInput
                placeholder="Title, narrator, artist or topic"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </SearchBoxContainer>

            {/* Category Quick Grid (8 buttons) */}
            <QuickCategoryGrid>
              {quickCategories.map((qc, idx) => (
                <QuickCategoryCard key={idx} onPress={() => setActiveCategory(qc.id)}>
                  <QuickCategoryIconBox color={qc.color}>
                    {qc.icon}
                  </QuickCategoryIconBox>
                  <QuickCategoryLabel>{qc.label}</QuickCategoryLabel>
                </QuickCategoryCard>
              ))}
            </QuickCategoryGrid>

            {/* Browse by Goal Section (Portal circular designs) */}
            <SectionHeaderRow>
              <SectionTitle>Browse by Goal</SectionTitle>
              <SeeAllLink>See All</SeeAllLink>
            </SectionHeaderRow>
            <GoalsGrid>
              {goalsList.map((goal) => (
                <GoalCard key={goal.id} onPress={() => handleSelectGoal(goal)}>
                  <GoalImageContainer>
                    <GoalImage source={{ uri: goal.bgUrl }} resizeMode="cover" />
                  </GoalImageContainer>
                  <GoalTitle>{goal.title}</GoalTitle>
                </GoalCard>
              ))}
            </GoalsGrid>

            {/* New & Noteworthy Section (Large tiles view) */}
            <SectionHeaderRow style={{ marginTop: 10 }}>
              <SectionTitle>New & Noteworthy</SectionTitle>
              <SeeAllLink>See All</SeeAllLink>
            </SectionHeaderRow>
            <LargeTileContainer>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4 }}>
                {newNoteworthyList.map((item) => (
                  <LargeTileCard key={item.id} onPress={() => handleSelectSound(item)}>
                    <LargeTileImage source={{ uri: item.bgUrl }} resizeMode="cover" />
                    <LargeTileOverlay>
                      <LargeTileCategory color={item.category === 'nature' ? '#4ECDC4' : '#9B7EDE'}>
                        {item.category.toUpperCase()}
                      </LargeTileCategory>
                      <LargeTileTitle>{item.name}</LargeTileTitle>
                      <LargeTileSub>{item.sub}</LargeTileSub>
                    </LargeTileOverlay>
                  </LargeTileCard>
                ))}
              </ScrollView>
            </LargeTileContainer>

            {/* Browse meditations by time */}
            <SectionHeaderRow style={{ marginTop: 24, marginBottom: 12 }}>
              <SectionTitle>Browse by Time</SectionTitle>
            </SectionHeaderRow>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4, marginBottom: 28 }}>
              {['3 min', '5 min', '10 min', '15 min', '20 min', '30 min'].map((time) => (
                <TimePill key={time} onPress={() => {}}>
                  <TimePillText>{time}</TimePillText>
                </TimePill>
              ))}
            </ScrollView>

            {/* Recommended Tracks (Standard tiles view) */}
            <SectionHeaderRow>
              <SectionTitle>Featured Soundscapes</SectionTitle>
            </SectionHeaderRow>
            <TracksGrid>
              {predefinedSounds.focus.slice(0, 2).concat(predefinedSounds.sleep.slice(0, 2)).map((sound) => (
                <GridCardCell key={sound.id} activeOpacity={0.9} onPress={() => handleSelectSound(sound)}>
                  <CardHeaderImage source={{ uri: sound.bgUrl }} imageStyle={{ borderTopLeftRadius: 19, borderTopRightRadius: 19 }}>
                    <CardHeaderOverlay>
                      <Music size={18} color="#FFFFFF" style={{ opacity: 0.9 }} />
                      {false && sound.isPremium && !isPremiumUnlocked && (
                        <LockBadge>
                          <Lock size={9} color="#FFFFFF" fill="#FFFFFF" />
                        </LockBadge>
                      )}
                    </CardHeaderOverlay>
                  </CardHeaderImage>
                  <CardBody>
                    <CardTitle numberOfLines={1}>{sound.name}</CardTitle>
                    <CardSubtitle numberOfLines={1}>{sound.sub}</CardSubtitle>
                    <CardFooterRow>
                      <CardDuration>⏱️ {sound.duration}</CardDuration>
                      <CardPlayCircle>
                        <Play size={8} color="#08080A" fill="#08080A" style={{ marginLeft: 1 }} />
                      </CardPlayCircle>
                    </CardFooterRow>
                  </CardBody>
                </GridCardCell>
              ))}
            </TracksGrid>

          </AllDashboardContainer>
        )}

        {/* Display filtered results or category lists */}
        {((activeCategory !== 'all' || !!searchQuery) && activeCategory !== 'uploads') && (
          <GridContainer>
            {!!searchQuery && (
              <SearchBoxContainer style={{ marginBottom: 20 }}>
                <Search size={16} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 10 }} />
                <SearchInput
                  placeholder="Title, narrator, artist or topic"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </SearchBoxContainer>
            )}

            <SectionTitle>
              {searchQuery ? `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"` : `${activeCategory.toUpperCase()} SOUNDSCAPES`}
            </SectionTitle>
            
            <TracksGrid>
              {(searchQuery ? getFilteredPredefined() : predefinedSounds[activeCategory])?.map((sound) => (
                <GridCardCell key={sound.id} activeOpacity={0.9} onPress={() => handleSelectSound(sound)}>
                  <CardHeaderImage source={{ uri: sound.bgUrl }} imageStyle={{ borderTopLeftRadius: 19, borderTopRightRadius: 19 }}>
                    <CardHeaderOverlay>
                      <Music size={18} color="#FFFFFF" style={{ opacity: 0.9 }} />
                      {false && sound.isPremium && !isPremiumUnlocked && (
                        <LockBadge>
                          <Lock size={9} color="#FFFFFF" fill="#FFFFFF" />
                        </LockBadge>
                      )}
                    </CardHeaderOverlay>
                  </CardHeaderImage>
                  <CardBody>
                    <CardTitle numberOfLines={1}>{sound.name}</CardTitle>
                    <CardSubtitle numberOfLines={1}>{sound.sub}</CardSubtitle>
                    <CardFooterRow>
                      <CardDuration>⏱️ {sound.duration}</CardDuration>
                      <CardPlayCircle>
                        <Play size={8} color="#08080A" fill="#08080A" style={{ marginLeft: 1 }} />
                      </CardPlayCircle>
                    </CardFooterRow>
                  </CardBody>
                </GridCardCell>
              ))}
            </TracksGrid>
          </GridContainer>
        )}

        {/* Custom Uploads view */}
        {activeCategory === 'uploads' && (
          <UploadsSection>
            <UploadBanner>
              <UploadIconBox>
                <Upload size={22} color="#FF7E47" />
              </UploadIconBox>
              <UploadBannerTitle>Custom Soundscapes</UploadBannerTitle>
              <UploadBannerDesc>Import your own background beats, binaural frequencies, or nature tracks to play natively.</UploadBannerDesc>
              <UploadTriggerButton onPress={() => setShowUploadModal(true)}>
                <Plus size={14} color="#08080A" strokeWidth={3} />
                <UploadTriggerButtonText>Upload Custom Sound</UploadTriggerButtonText>
              </UploadTriggerButton>
            </UploadBanner>

            <SectionTitle>MY UPLOADED SOUNDS ({customTracks.length})</SectionTitle>

            {customTracks.length === 0 ? (
              <EmptyStateContainer>
                <FileAudio size={40} color="#6B6280" />
                <EmptyStateText>No custom tracks uploaded yet. Tap the button above to upload.</EmptyStateText>
              </EmptyStateContainer>
            ) : (
              customTracks.map((track) => (
                <TrackListItem key={track.id} activeOpacity={0.8} onPress={() => handleSelectSound(track)}>
                  <TrackListLeft>
                    <TrackColorIcon color={track.color}>
                      <Headphones size={16} color="#08080A" />
                    </TrackColorIcon>
                    <TrackDetails>
                      <TrackListName>{track.name}</TrackListName>
                      <TrackListSub>{track.file} • Category: {track.category}</TrackListSub>
                    </TrackDetails>
                  </TrackListLeft>
                  <TrackListRight>
                    <PlayButtonBox onPress={() => handleSelectSound(track)}>
                      <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                    </PlayButtonBox>
                    <DeleteButtonBox onPress={() => handleDeleteTrack(track.id)}>
                      <Trash2 size={12} color="#6B6280" />
                    </DeleteButtonBox>
                  </TrackListRight>
                </TrackListItem>
              ))
            )}
          </UploadsSection>
        )}
        <ExtraSpacing />
      </ScrollViewContent>

      {/* High-Fidelity Custom Upload Modal Popup */}
      <Modal visible={showUploadModal} transparent={true} animationType="fade" onRequestClose={() => setShowUploadModal(false)}>
        <ModalBackdrop onPress={() => setShowUploadModal(false)}>
          <ModalContainer onPress={(e) => e.stopPropagation()}>
            <ModalHeaderRow>
              <ModalTitle>Upload Custom Sound</ModalTitle>
              <ModalCloseButton onPress={() => setShowUploadModal(false)}>
                <X size={16} color="#FFFFFF" />
              </ModalCloseButton>
            </ModalHeaderRow>

            <FormLabel>Sound Name</FormLabel>
            <FormInput
              placeholder="e.g. Thunderstorm Rain Sleep Loop"
              placeholderTextColor="#6B6280"
              value={newTrackName}
              onChangeText={setNewTrackName}
            />

            <FormLabel>Active Sound Category</FormLabel>
            <CategoryChoiceRow>
              {(['focus', 'sleep', 'relax'] as const).map((cat) => (
                <ChoiceButton
                  key={cat}
                  active={newTrackCategory === cat}
                  onPress={() => setNewTrackCategory(cat)}
                >
                  <ChoiceText active={newTrackCategory === cat}>{cat.toUpperCase()}</ChoiceText>
                </ChoiceButton>
              ))}
            </CategoryChoiceRow>

            <FormLabel>Card Theme Color</FormLabel>
            <ColorPickerRow>
              {colors.map((color) => (
                <ColorDot
                  key={color}
                  color={color}
                  selected={selectedColor === color}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                </ColorDot>
              ))}
            </ColorPickerRow>

            <FormLabel>Simulated Audio File</FormLabel>
            {simulatedFileName ? (
              <FileSelectedBox>
                <FileAudio size={16} color="#4ECDC4" />
                <FileNameText numberOfLines={1}>{simulatedFileName}</FileNameText>
                <ChooseFileLink onPress={handleSimulateUpload}>Change</ChooseFileLink>
              </FileSelectedBox>
            ) : (
              <UploadPlaceholder onPress={handleSimulateUpload}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="#FF7E47" />
                ) : (
                  <>
                    <Upload size={20} color="#6B6280" />
                    <UploadPlaceholderText>Select Audio File (.mp3, .wav, .m4a)</UploadPlaceholderText>
                  </>
                )}
              </UploadPlaceholder>
            )}

            <SaveButton
              disabled={!newTrackName || !simulatedFileName}
              onPress={handleSaveTrack}
              style={{ opacity: newTrackName && simulatedFileName ? 1 : 0.5 }}
            >
              <SaveButtonText>Add to My Uploads</SaveButtonText>
            </SaveButton>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </Container>
  );
};
