import React, { useState } from 'react';
import styled from 'styled-components/native';
import { Compass, Gift, X, Lock, Flame, Moon, Sun, Shuffle, Sparkles, Coffee } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { setScenario } from '../store/audioSlice';

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
  const { scenariosList, isPremiumUnlocked } = useAppSelector((state) => state.audio);

  const [activeCategory, setActiveCategory] = useState<'all' | 'focus' | 'relax' | 'sleep'>('all');

  const filteredScenarios = scenariosList.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const handleScenarioPress = (id: string, isPremium: boolean) => {
    if (isPremium && !isPremiumUnlocked) {
      onOpenPaywall();
    } else {
      dispatch(setScenario(id));
      onSelectScenario();
    }
  };

  const getCategoryIcon = (cat: string, color: string = '#FFFFFF') => {
    switch (cat) {
      case 'focus':
        return <Compass color={color} size={22} />;
      case 'relax':
        return <Shuffle color={color} size={22} />;
      case 'sleep':
        return <Moon color={color} size={22} />;
      default:
        return <Coffee color={color} size={22} />;
    }
  };

  return (
    <Container>
      {/* Top Header Row */}
      <HeaderBar>
        <LogoArea>
          <LogoIconCircle>
            <Compass size={16} color="#9B7EDE" />
          </LogoIconCircle>
          <LogoText>DOPAMIND</LogoText>
          <BadgeContainer>
            <BadgeText>FREEMIUM</BadgeText>
          </BadgeContainer>
        </LogoArea>
        <RightHeader>
          <SignInLink onPress={onOpenPaywall}>Sign In</SignInLink>
          <CloseButton onPress={onClose}>
            <X size={20} color="#FFFFFF" />
          </CloseButton>
        </RightHeader>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false}>
        {/* Hero ADHD Update Card */}
        <HeroBannerContainer>
          <BannerBadgeRow>
            <BannerBadge>
              <BannerBadgeText>MAJOR UPDATE</BannerBadgeText>
            </BannerBadge>
          </BannerBadgeRow>
          
          <BannerArtRow>
            <SilhouetteIconWrapper>
              <UserSilhouette />
              <OrbiterRing1 />
              <OrbiterRing2 />
            </SilhouetteIconWrapper>
          </BannerArtRow>

          <BannerHeadline>Endel for ADHD</BannerHeadline>
          <BannerDesc>A collaborative acoustic experience optimized for neurodivergent focus patterns.</BannerDesc>
        </HeroBannerContainer>

        {/* Page indicators */}
        <PageIndicatorsRow>
          <IndicatorDot active={true} />
          <IndicatorDot active={false} />
        </PageIndicatorsRow>

        {/* Category Filters row */}
        <FiltersRow horizontal showsHorizontalScrollIndicator={false}>
          <FilterPill active={activeCategory === 'all'} onPress={() => setActiveCategory('all')}>
            <FilterPillText active={activeCategory === 'all'}>All</FilterPillText>
          </FilterPill>
          <FilterPill active={activeCategory === 'focus'} onPress={() => setActiveCategory('focus')}>
            <FilterPillText active={activeCategory === 'focus'}>Focus</FilterPillText>
          </FilterPill>
          <FilterPill active={activeCategory === 'relax'} onPress={() => setActiveCategory('relax')}>
            <FilterPillText active={activeCategory === 'relax'}>Relax</FilterPillText>
          </FilterPill>
          <FilterPill active={activeCategory === 'sleep'} onPress={() => setActiveCategory('sleep')}>
            <FilterPillText active={activeCategory === 'sleep'}>Sleep</FilterPillText>
          </FilterPill>
        </FiltersRow>

        {/* 3-Column Scenario Card Grid */}
        <GridSectionTitle>
          {activeCategory.toUpperCase()} SCENARIOS ({filteredScenarios.length})
        </GridSectionTitle>
        
        <CardsGridContainer>
          {filteredScenarios.map((item) => (
            <CardCell
              key={item.id}
              onPress={() => handleScenarioPress(item.id, item.isPremium)}
            >
              <CardInner>
                {item.isPremium && !isPremiumUnlocked && (
                  <LockBadgeOverlay>
                    <Lock size={12} color="#0D0B1A" fill="#FFFFFF" />
                  </LockBadgeOverlay>
                )}
                <CardIconCircle category={item.category}>
                  {getCategoryIcon(item.category, '#FFFFFF')}
                </CardIconCircle>
                <CardLabel numberOfLines={2}>{item.name}</CardLabel>
              </CardInner>
            </CardCell>
          ))}
        </CardsGridContainer>

        <ExtraSpacing />
      </ScrollContent>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: #0D0B1A;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
  background-color: #0D0B1A;
`;

const LogoArea = styled.View`
  flex-direction: row;
  align-items: center;
`;

const LogoIconCircle = styled.View`
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: #1A1528;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(155, 126, 222, 0.2);
`;

const LogoText = styled.Text`
  color: #FFFFFF;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-left: 6px;
`;

const BadgeContainer = styled.View`
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 8px;
`;

const BadgeText = styled.Text`
  color: #6B6280;
  font-size: 8px;
  font-weight: 800;
`;

const RightHeader = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SignInLink = styled.Text`
  color: #9B7EDE;
  font-size: 13px;
  font-weight: 600;
  margin-right: 16px;
`;

const CloseButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #1A1528;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const HeroBannerContainer = styled.View`
  background-color: #1A1528;
  border-radius: 16px;
  padding: 20px;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 12px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const BannerBadgeRow = styled.View`
  width: 100%;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const BannerBadge = styled.View`
  background-color: rgba(155, 126, 222, 0.15);
  border-radius: 4px;
  padding: 4px 8px;
  border-width: 1px;
  border-color: rgba(155, 126, 222, 0.2);
`;

const BannerBadgeText = styled.Text`
  color: #9B7EDE;
  font-size: 9px;
  font-weight: bold;
`;

const BannerArtRow = styled.View`
  height: 100px;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
`;

const SilhouetteIconWrapper = styled.View`
  width: 80px;
  height: 80px;
  justify-content: center;
  align-items: center;
  position: relative;
`;

const UserSilhouette = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #9B7EDE;
  opacity: 0.8;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.6;
  shadow-radius: 8px;
`;

const OrbiterRing1 = styled.View`
  position: absolute;
  width: 70px;
  height: 24px;
  border-radius: 35px / 12px;
  border-width: 1.5px;
  border-color: #FFFFFF;
  transform: rotate(-15deg);
`;

const OrbiterRing2 = styled.View`
  position: absolute;
  width: 60px;
  height: 20px;
  border-radius: 30px / 10px;
  border-width: 1.5px;
  border-color: #4ECDC4;
  transform: rotate(35deg);
`;

const BannerHeadline = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 6px;
`;

const BannerDesc = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
  text-align: center;
  line-height: 18px;
  padding: 0 10px;
`;

const PageIndicatorsRow = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-bottom: 20px;
`;

const IndicatorDot = styled.View<{ active: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: ${props => props.active ? '#FFFFFF' : '#6B6280'};
  margin: 0 3px;
`;

const FiltersRow = styled.ScrollView`
  flex-direction: row;
  margin-bottom: 20px;
`;

const FilterPill = styled.TouchableOpacity<{ active: boolean }>`
  background-color: ${props => props.active ? '#9B7EDE' : '#1A1528'};
  padding: 8px 16px;
  border-radius: 20px;
  margin-right: 8px;
  border-width: 1px;
  border-color: ${props => props.active ? 'transparent' : 'rgba(255, 255, 255, 0.05)'};
`;

const FilterPillText = styled.Text<{ active: boolean }>`
  color: ${props => props.active ? '#0D0B1A' : '#B8B0D0'};
  font-size: 13px;
  font-weight: 600;
`;

const GridSectionTitle = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const CardsGridContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-horizontal: -6px;
`;

const CardCell = styled.TouchableOpacity`
  width: 33.33%;
  padding: 6px;
`;

const CardInner = styled.View`
  background-color: #1A1528;
  border-radius: 12px;
  padding: 16px 8px 12px 8px;
  align-items: center;
  height: 110px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
  position: relative;
`;

const CardIconCircle = styled.View<{ category: string }>`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: ${props => {
    if (props.category === 'focus') return 'rgba(155, 126, 222, 0.1)';
    if (props.category === 'relax') return 'rgba(78, 205, 196, 0.1)';
    return 'rgba(123, 95, 181, 0.1)';
  }};
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
`;

const CardLabel = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: bold;
  text-align: center;
`;

const LockBadgeOverlay = styled.View`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: #FFFFFF;
  justify-content: center;
  align-items: center;
`;

const ExtraSpacing = styled.View`
  height: 100px;
`;
