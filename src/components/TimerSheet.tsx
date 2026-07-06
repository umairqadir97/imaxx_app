import React, { useState } from 'react';
import styled from 'styled-components/native';
import { X, Play, Clock } from 'lucide-react-native';
import { useAppDispatch } from '../store';
import { startTimer } from '../store/audioSlice';

interface TimerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const TimerSheet: React.FC<TimerSheetProps> = ({ visible, onClose }) => {
  const dispatch = useAppDispatch();
  const [customMins, setCustomMins] = useState(25);

  const presets = [
    { label: '15 Min', value: 900, desc: 'Quick Blitz' },
    { label: '25 Min', value: 1500, desc: 'Pomodoro Focus' },
    { label: '45 Min', value: 2700, desc: 'Deep Concentration' },
    { label: '60 Min', value: 3600, desc: 'Sustained Flow' },
  ];

  const handleStartPreset = (seconds: number) => {
    dispatch(startTimer(seconds));
    onClose();
  };

  const handleStartCustom = () => {
    dispatch(startTimer(customMins * 60));
    onClose();
  };

  if (!visible) return null;

  return (
    <ModalContainer>
      <Backdrop onPress={onClose} />
      <SheetContent>
        <HeaderRow>
          <TitleRow>
            <Clock size={20} color="#9B7EDE" style={{ marginRight: 8 }} />
            <SheetTitle>Set Focus Timer</SheetTitle>
          </TitleRow>
          <CloseButton onPress={onClose}>
            <X size={20} color="#FFFFFF" />
          </CloseButton>
        </HeaderRow>

        <PresetsTitle>PRESET INTERVALS</PresetsTitle>
        <PresetsGrid>
          {presets.map((p, idx) => (
            <PresetCell key={idx} onPress={() => handleStartPreset(p.value)}>
              <PresetLabel>{p.label}</PresetLabel>
              <PresetDesc>{p.desc}</PresetDesc>
            </PresetCell>
          ))}
        </PresetsGrid>

        <Divider />

        <PresetsTitle>CUSTOM INTERVAL (MINUTES)</PresetsTitle>
        <SliderRow>
          <TimeAdjustButton onPress={() => setCustomMins(prev => Math.max(5, prev - 5))}>
            <AdjustText>-</AdjustText>
          </TimeAdjustButton>
          <TimeValueText>{customMins} min</TimeValueText>
          <TimeAdjustButton onPress={() => setCustomMins(prev => Math.min(180, prev + 5))}>
            <AdjustText>+</AdjustText>
          </TimeAdjustButton>
        </SliderRow>

        <StartButton onPress={handleStartCustom}>
          <Play size={18} color="#0D0B1A" fill="#0D0B1A" style={{ marginRight: 8 }} />
          <StartButtonText>Start Focus Session</StartButtonText>
        </StartButton>
      </SheetContent>
    </ModalContainer>
  );
};

const ModalContainer = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  justify-content: flex-end;
`;

const Backdrop = styled.TouchableOpacity`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
`;

const SheetContent = styled.View`
  background-color: #1A1528;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
  shadow-color: #000;
  shadow-offset: 0px -4px;
  shadow-opacity: 0.3;
  shadow-radius: 10px;
  elevation: 10;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const TitleRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SheetTitle = styled.Text`
  color: #FFFFFF;
  font-size: 18px;
  font-weight: bold;
`;

const CloseButton = styled.TouchableOpacity`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: #252038;
  justify-content: center;
  align-items: center;
`;

const PresetsTitle = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

const PresetsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-horizontal: -4px;
  margin-bottom: 20px;
`;

const PresetCell = styled.TouchableOpacity`
  background-color: #252038;
  border-radius: 12px;
  padding: 14px 10px;
  width: 48%;
  margin-bottom: 8px;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.03);
`;

const PresetLabel = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const PresetDesc = styled.Text`
  color: #6B6280;
  font-size: 11px;
`;

const Divider = styled.View`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.05);
  margin-vertical: 8px;
  margin-bottom: 16px;
`;

const SliderRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`;

const TimeAdjustButton = styled.TouchableOpacity`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #252038;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const AdjustText = styled.Text`
  color: #FFFFFF;
  font-size: 20px;
  font-weight: bold;
`;

const TimeValueText = styled.Text`
  color: #FFFFFF;
  font-size: 26px;
  font-weight: 800;
  margin-horizontal: 30px;
  width: 100px;
  text-align: center;
`;

const StartButton = styled.TouchableOpacity`
  background-color: #9B7EDE;
  padding: 16px;
  border-radius: 30px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
`;

const StartButtonText = styled.Text`
  color: #0D0B1A;
  font-size: 16px;
  font-weight: bold;
`;
