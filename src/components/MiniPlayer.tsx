import React from 'react';
import styled from 'styled-components/native';
import { Play, Pause, Compass, Timer, ShieldAlert, Sparkles, Moon, Sun, Shuffle, Flame, X } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { togglePlayback, toggleBlockApps, toggleBlendAudio, dismissMiniPlayer } from '../store/audioSlice';

interface MiniPlayerProps {
  onOpenPlayer: () => void;
  onOpenTimer: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onOpenPlayer, onOpenTimer }) => {
  const dispatch = useAppDispatch();
  const { isPlaying, activeSoundscape, blockApps, blendAudio, timerIsActive, timerTimeLeft } = useAppSelector(
    (state) => state.audio
  );

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getSoundscapeIcon = (id: string, color: string = '#FFFFFF') => {
    switch (id) {
      case 'focus':
        return <Compass color={color} size={20} />;
      case 'relax':
        return <Shuffle color={color} size={20} />;
      case 'sleep':
        return <Moon color={color} size={20} />;
      case 'move':
        return <Flame color={color} size={20} />;
      case 'uplift':
        return <Sun color={color} size={20} />;
      default:
        return <Compass color={color} size={20} />;
    }
  };

  const getSoundscapeName = (id: string) => {
    return id.charAt(0).toUpperCase() + id.slice(1);
  };

  return (
    <Container>
      <MainPlayerRow onPress={onOpenPlayer}>
        <LeftSection>
          <IconCircle>
            {getSoundscapeIcon(activeSoundscape, '#FF7E47')}
          </IconCircle>
          <TextInfo>
            <StatusText>{isPlaying ? 'Active Session' : 'Session Paused'}</StatusText>
            <TitleText>{getSoundscapeName(activeSoundscape)}</TitleText>
          </TextInfo>
        </LeftSection>

        <RightSection>
          {/* Timer preset status */}
          <TimerButton onPress={onOpenTimer} active={timerIsActive}>
            <Timer color={timerIsActive ? '#00F2FE' : '#FFFFFF'} size={18} />
            {timerIsActive && <TimerValueText>{formatTimer(timerTimeLeft)}</TimerValueText>}
          </TimerButton>
          
          {/* Play/Pause (Orange circular trigger) */}
          <PlayCircle onPress={() => dispatch(togglePlayback())}>
            {isPlaying ? (
              <Pause size={18} fill="#08080A" color="#08080A" />
            ) : (
              <Play size={18} fill="#08080A" color="#08080A" style={{ marginLeft: 2 }} />
            )}
          </PlayCircle>

          {/* Close button (X) to dismiss completely */}
          <DismissButton onPress={() => dispatch(dismissMiniPlayer())}>
            <X size={18} color="#6B6280" />
          </DismissButton>
        </RightSection>
      </MainPlayerRow>

      <TogglesRow>
        <ToggleOption onPress={() => dispatch(toggleBlockApps())}>
          <ShieldAlert size={12} color={blockApps ? '#00F2FE' : '#6B6280'} />
          <ToggleText active={blockApps}>Block Apps: {blockApps ? 'On' : 'Off'}</ToggleText>
        </ToggleOption>
        
        <DividerText>|</DividerText>

        <ToggleOption onPress={() => dispatch(toggleBlendAudio())}>
          <Sparkles size={12} color={blendAudio ? '#00F2FE' : '#6B6280'} />
          <ToggleText active={blendAudio}>Blend Audio: {blendAudio ? 'On' : 'Off'}</ToggleText>
        </ToggleOption>
      </TogglesRow>
    </Container>
  );
};

const Container = styled.View`
  background-color: #111116;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  border-width: 1px;
  border-color: #1E1E26;
  padding: 12px 16px 8px 16px;
  width: 100%;
  shadow-color: #000;
  shadow-offset: 0px -6px;
  shadow-opacity: 0.45;
  shadow-radius: 12px;
  elevation: 10;
`;

const MainPlayerRow = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const LeftSection = styled.View`
  flex-direction: row;
  align-items: center;
`;

const IconCircle = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #08080A;
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: #1E1E26;
`;

const TextInfo = styled.View`
  margin-left: 12px;
`;

const StatusText = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TitleText = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
`;

const RightSection = styled.View`
  flex-direction: row;
  align-items: center;
`;

const TimerButton = styled.TouchableOpacity<{ active: boolean }>`
  width: ${props => props.active ? 'auto' : '36px'};
  height: 36px;
  border-radius: 18px;
  background-color: ${props => props.active ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  justify-content: center;
  align-items: center;
  margin-right: 8px;
  flex-direction: row;
  padding: ${props => props.active ? '0 10px' : '0'};
  border-width: 1px;
  border-color: ${props => props.active ? '#00F2FE' : '#1E1E26'};
`;

const TimerValueText = styled.Text`
  color: #00F2FE;
  font-size: 11px;
  font-weight: bold;
  margin-left: 6px;
`;

const PlayCircle = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: #FF7E47;
  justify-content: center;
  align-items: center;
  shadow-color: #FF7E47;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
`;

const DismissButton = styled.TouchableOpacity`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background-color: rgba(255, 255, 255, 0.02);
  justify-content: center;
  align-items: center;
  margin-left: 8px;
  border-width: 1px;
  border-color: #1E1E26;
`;

const TogglesRow = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-top-width: 1px;
  border-top-color: #1E1E26;
  padding-top: 8px;
`;

const ToggleOption = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
`;

const ToggleText = styled.Text<{ active: boolean }>`
  font-size: 11px;
  font-weight: 500;
  color: ${props => props.active ? '#00F2FE' : '#6B6280'};
  margin-left: 6px;
`;

const DividerText = styled.Text`
  color: #1E1E26;
  font-size: 12px;
`;
