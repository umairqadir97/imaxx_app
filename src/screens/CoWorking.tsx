import React, { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { Users, Play, Pause, ChevronRight, X, Clock, Compass, ShieldAlert, Sparkles } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { updateCoworkingRoomParticipants } from '../store/habitSlice';
import { GlassCard } from '../components/GlassCard';

export const CoWorking: React.FC = () => {
  const dispatch = useAppDispatch();
  const rooms = useAppSelector((state) => state.habits.coworkingRooms);
  
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [sessionTime, setSessionTime] = useState(1500); // 25 min default
  const [sessionActive, setSessionActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'Joined Room: ADHD Deep Focus Cave',
    'Leo joined the co-working room',
    'Sarah is reviewing documentation',
  ]);

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Periodically update room participants slightly to look active
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(updateCoworkingRoomParticipants());
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Co-working Pomodoro timer
  useEffect(() => {
    let timer: any;
    if (sessionActive && sessionTime > 0) {
      timer = setInterval(() => {
        setSessionTime(prev => prev - 1);
      }, 1000);
    } else if (sessionTime === 0) {
      setSessionActive(false);
      addLog('Session completed! Take a break.');
    }
    return () => clearInterval(timer);
  }, [sessionActive, sessionTime]);

  // Periodic log messages simulation
  useEffect(() => {
    if (!activeRoomId || !sessionActive) return;
    
    const messages = [
      'Leo checked off: Drink 1 glass of water',
      'Sarah started focus: Code refactoring',
      'Max checked off: Meditate 1 min',
      'Alex joined the room',
      'Aria is starting homework',
      'Elena completed: Write 1 sentence',
      'Liam is focusing on laundry chores',
    ];

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * messages.length);
      addLog(messages[idx]);
    }, 12000);

    return () => clearInterval(interval);
  }, [activeRoomId, sessionActive]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleJoinRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setSessionTime(1500);
    setSessionActive(true);
    setLogs([
      `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] Connected to server`,
      `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] Joined: ${rooms.find(r => r.id === roomId)?.name}`,
      'Aria is editing code',
      'Leo is drawing mockups',
    ]);
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
    setSessionActive(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (activeRoomId && activeRoom) {
    return (
      <Container>
        {/* Header Row */}
        <HeaderBar>
          <LeaveButton onPress={handleLeaveRoom}>
            <X size={20} color="#FFFFFF" />
            <LeaveButtonText>Leave</LeaveButtonText>
          </LeaveButton>
          <RoomNameText numberOfLines={1}>{activeRoom.name}</RoomNameText>
          <ParticipantsBadge>
            <Users size={14} color="#4ECDC4" style={{ marginRight: 6 }} />
            <ParticipantsText>{activeRoom.participants} online</ParticipantsText>
          </ParticipantsBadge>
        </HeaderBar>

        <ScrollContent showsVerticalScrollIndicator={false}>
          {/* Central Session Clock */}
          <GlassCard style={{ padding: 24, alignItems: 'center', marginBottom: 20, marginTop: 10 }}>
            <SessionTitleText>Pomodoro Focus Sync</SessionTitleText>
            <ClockCircleGlow>
              <TimeCountdownText>{formatTime(sessionTime)}</TimeCountdownText>
            </ClockCircleGlow>

            <ControlsRow>
              <ControlBtn onPress={() => setSessionActive(!sessionActive)}>
                {sessionActive ? (
                  <>
                    <Pause size={18} color="#0D0B1A" fill="#0D0B1A" />
                    <ControlBtnText>Pause Sync</ControlBtnText>
                  </>
                ) : (
                  <>
                    <Play size={18} color="#0D0B1A" fill="#0D0B1A" />
                    <ControlBtnText>Resume Sync</ControlBtnText>
                  </>
                )}
              </ControlBtn>
            </ControlsRow>
          </GlassCard>

          {/* Coworker Grid */}
          <SectionTitle>Coworkers in room</SectionTitle>
          <CoworkerGrid>
            {Array.from({ length: 6 }).map((_, i) => (
              <CoworkerBubble key={i}>
                <AvatarCircle color={i % 3 === 0 ? '#9B7EDE' : i % 3 === 1 ? '#4ECDC4' : '#FFB347'}>
                  <AvatarInitial>{['L', 'S', 'M', 'A', 'E', 'K'][i]}</AvatarInitial>
                </AvatarCircle>
                <CoworkerName>{['Leo', 'Sarah', 'Max', 'Aria', 'Elena', 'Kevin'][i]}</CoworkerName>
                <CoworkerStatus>{['Focusing', 'Writing', 'Resting', 'Coding', 'Reading', 'Planning'][i]}</CoworkerStatus>
              </CoworkerBubble>
            ))}
          </CoworkerGrid>

          {/* Activity Log stream */}
          <SectionTitle>ADHD Accountability Log</SectionTitle>
          <LogContainer>
            {logs.map((log, index) => (
              <LogTextLine key={index} isSystem={index === 0}>
                {log}
              </LogTextLine>
            ))}
          </LogContainer>
          
          <ExtraSpacing />
        </ScrollContent>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderBar>
        <HeaderTitle>Body Doubling</HeaderTitle>
      </HeaderBar>

      <ScrollContent showsVerticalScrollIndicator={false}>
        <IntroCard>
          <IntroTitle>What is Body Doubling?</IntroTitle>
          <IntroDesc>
            Having another person work alongside you helps keep your ADHD brain anchored. Select a virtual co-working room below to start focusing in sync.
          </IntroDesc>
        </IntroCard>

        <SectionTitle>Active Rooms</SectionTitle>

        {rooms.map((room) => (
          <RoomCard key={room.id} onPress={() => handleJoinRoom(room.id)}>
            <RoomIconSection>
              <RoomIconCircle>
                <Users size={20} color="#9B7EDE" />
              </RoomIconCircle>
            </RoomIconSection>
            
            <RoomInfoSection>
              <RoomName>{room.name}</RoomName>
              <RoomDescription>{room.description}</RoomDescription>
              <RoomMetaRow>
                <Users size={12} color="#4ECDC4" style={{ marginRight: 4 }} />
                <RoomMetaText>{room.participants} focused coworkers</RoomMetaText>
                <MetaDivider>|</MetaDivider>
                <Clock size={12} color="#6B6280" style={{ marginRight: 4 }} />
                <RoomMetaText>{room.duration} min Pomodoro</RoomMetaText>
              </RoomMetaRow>
            </RoomInfoSection>

            <ChevronWrapper>
              <ChevronRight size={18} color="#6B6280" />
            </ChevronWrapper>
          </RoomCard>
        ))}

        <ExtraSpacing />
      </ScrollContent>
    </Container>
  );
};

const Container = styled.View`
  flex: 1;
  background-color: transparent;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 50px 20px 10px 20px;
  height: 100px;
  background-color: #0D0B1A;
`;

const HeaderTitle = styled.Text`
  color: #FFFFFF;
  font-size: 22px;
  font-weight: bold;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const IntroCard = styled(GlassCard)`
  margin-top: 10px;
  margin-bottom: 20px;
  padding: 16px;
`;

const IntroTitle = styled.Text`
  color: #9B7EDE;
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const IntroDesc = styled.Text`
  color: #B8B0D0;
  font-size: 12px;
  line-height: 18px;
`;

const SectionTitle = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  margin-top: 10px;
`;

const RoomCard = styled(GlassCard)`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
`;

const RoomIconSection = styled.View`
  margin-right: 14px;
`;

const RoomIconCircle = styled.View`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(155, 126, 222, 0.1);
  justify-content: center;
  align-items: center;
  border-width: 1px;
  border-color: rgba(155, 126, 222, 0.2);
`;

const RoomInfoSection = styled.View`
  flex: 1;
`;

const RoomName = styled.Text`
  color: #FFFFFF;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const RoomDescription = styled.Text`
  color: #B8B0D0;
  font-size: 11px;
  margin-bottom: 8px;
  line-height: 15px;
`;

const RoomMetaRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const RoomMetaText = styled.Text`
  color: #6B6280;
  font-size: 11px;
  font-weight: 500;
`;

const MetaDivider = styled.Text`
  color: rgba(255, 255, 255, 0.05);
  font-size: 10px;
  margin-horizontal: 8px;
`;

const ChevronWrapper = styled.View`
  margin-left: 8px;
`;

// Joined active room UI
const LeaveButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  background-color: #252038;
  padding: 6px 12px;
  border-radius: 20px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.05);
`;

const LeaveButtonText = styled.Text`
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  margin-left: 4px;
`;

const RoomNameText = styled.Text`
  color: #FFFFFF;
  font-size: 15px;
  font-weight: bold;
  flex: 1;
  text-align: center;
  margin-horizontal: 8px;
`;

const ParticipantsBadge = styled.View`
  flex-direction: row;
  align-items: center;
  background-color: rgba(78, 205, 196, 0.1);
  padding: 6px 10px;
  border-radius: 20px;
`;

const ParticipantsText = styled.Text`
  color: #4ECDC4;
  font-size: 11px;
  font-weight: bold;
`;

const SessionTitleText = styled.Text`
  color: #B8B0D0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const ClockCircleGlow = styled.View`
  width: 140px;
  height: 140px;
  border-radius: 70px;
  background-color: #0D0B1A;
  border-width: 2px;
  border-color: #9B7EDE;
  justify-content: center;
  align-items: center;
  margin-bottom: 18px;
  shadow-color: #9B7EDE;
  shadow-opacity: 0.4;
  shadow-radius: 10px;
`;

const TimeCountdownText = styled.Text`
  color: #FFFFFF;
  font-size: 34px;
  font-weight: 800;
`;

const ControlsRow = styled.View`
  flex-direction: row;
`;

const ControlBtn = styled.TouchableOpacity`
  background-color: #9B7EDE;
  padding: 10px 24px;
  border-radius: 20px;
  flex-direction: row;
  align-items: center;
`;

const ControlBtnText = styled.Text`
  color: #0D0B1A;
  font-size: 13px;
  font-weight: bold;
  margin-left: 6px;
`;

const CoworkerGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const CoworkerBubble = styled.View`
  width: 30%;
  background-color: #1A1528;
  border-radius: 12px;
  padding: 10px 6px;
  align-items: center;
  margin-bottom: 8px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.04);
`;

const AvatarCircle = styled.View<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: ${props => props.color};
  justify-content: center;
  align-items: center;
  margin-bottom: 6px;
`;

const AvatarInitial = styled.Text`
  color: #0D0B1A;
  font-size: 14px;
  font-weight: 800;
`;

const CoworkerName = styled.Text`
  color: #FFFFFF;
  font-size: 11px;
  font-weight: bold;
`;

const CoworkerStatus = styled.Text`
  color: #6B6280;
  font-size: 9px;
  margin-top: 2px;
`;

const LogContainer = styled.View`
  background-color: #05040B;
  border-radius: 12px;
  padding: 16px;
  height: 180px;
  border-width: 1.5px;
  border-color: rgba(255, 255, 255, 0.03);
`;

const LogTextLine = styled.Text<{ isSystem: boolean }>`
  color: ${props => props.isSystem ? '#4ECDC4' : '#6B6280'};
  font-size: 11px;
  font-family: monospace;
  margin-bottom: 6px;
  line-height: 16px;
`;

const ExtraSpacing = styled.View`
  height: 120px;
`;
