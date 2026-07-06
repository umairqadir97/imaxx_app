import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import styled from 'styled-components/native';
import { theme } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CircadianWidget: React.FC = () => {
  const width = SCREEN_WIDTH - 40;
  const height = 110;

  // Get current time parameters
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  
  // Calculate composite circadian wave y-coordinate (scaled from 0 to 1)
  // Formula simulates typical daily energy cycle: morning peak, afternoon slump, evening recovery, night recharge
  const getEnergyValue = (t: number) => {
    // Standard circadian curve
    const cycle1 = 0.45 * Math.sin((2 * Math.PI * (t - 6)) / 24);
    // 12-hour ultradian rhythm
    const cycle2 = 0.25 * Math.sin((2 * Math.PI * (t - 15)) / 12);
    // Combine and offset to range [0.1, 0.9]
    return 0.5 - (cycle1 + cycle2);
  };

  // Generate SVG path for the curve
  const generateCurvePath = () => {
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 24;
      const x = (i / steps) * width;
      const y = getEnergyValue(t) * (height - 30) + 15; // Padding top/bottom
      if (i === 0) {
        points.push(`M ${x} ${y}`);
      } else {
        points.push(`L ${x} ${y}`);
      }
    }
    return points.join(' ');
  };

  // Generate background closed path for gradient fill
  const generateFillPath = () => {
    const curve = generateCurvePath();
    return `${curve} L ${width} ${height} L 0 ${height} Z`;
  };

  // Cursor coordinates
  const cursorX = (currentHour / 24) * width;
  const cursorY = getEnergyValue(currentHour) * (height - 30) + 15;

  // Describe current state
  const getCurrentStateLabel = (hour: number) => {
    if (hour >= 7 && hour < 12) return { label: 'High Energy Peak', color: theme.colors.warning };
    if (hour >= 12 && hour < 16) return { label: 'Afternoon Slump', color: theme.colors.textTertiary };
    if (hour >= 16 && hour < 21) return { label: 'Wind-Down Focus', color: theme.colors.accentPrimary };
    return { label: 'Night Sleep Recharge', color: theme.colors.success };
  };

  const stateInfo = getCurrentStateLabel(currentHour);

  // Time milestones markers
  const markers = [6, 12, 18];
  
  return (
    <Container>
      <TitleRow>
        <WidgetTitle>ADHD Energy Cycle</WidgetTitle>
        <StatusBadge style={{ backgroundColor: `${stateInfo.color}15` }}>
          <StatusDot style={{ backgroundColor: stateInfo.color }} />
          <StatusText style={{ color: stateInfo.color }}>{stateInfo.label}</StatusText>
        </StatusBadge>
      </TitleRow>

      <SvgWrapper>
        <Svg width={width} height={height}>
          <Defs>
            {/* Background Area Gradient */}
            <LinearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.accentPrimary} stopOpacity="0.18" />
              <Stop offset="1" stopColor={theme.colors.bgPrimary} stopOpacity="0.0" />
            </LinearGradient>
            
            {/* Glowing Ring Gradient */}
            <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={theme.colors.accentGlow} />
              <Stop offset="1" stopColor={theme.colors.accentPrimary} />
            </LinearGradient>
          </Defs>

          {/* Time markers grid */}
          {markers.map(m => {
            const x = (m / 24) * width;
            return (
              <React.Fragment key={m}>
                <Line
                  x1={x}
                  y1={10}
                  x2={x}
                  y2={height - 20}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4, 4"
                  strokeWidth={1}
                />
              </React.Fragment>
            );
          })}

          {/* Fill under the curve */}
          <Path d={generateFillPath()} fill="url(#waveFill)" />

          {/* Circadian rhythm line */}
          <Path d={generateCurvePath()} fill="none" stroke="rgba(155, 126, 222, 0.4)" strokeWidth={2} />

          {/* Dotted indicator line for current time */}
          <Line
            x1={cursorX}
            y1={0}
            x2={cursorX}
            y2={height}
            stroke={theme.colors.accentPrimary}
            strokeOpacity={0.25}
            strokeDasharray="2, 2"
            strokeWidth={1.5}
          />

          {/* Glowing Cursor representation */}
          <Circle cx={cursorX} cy={cursorY} r={8} fill={theme.colors.bgPrimary} />
          <Circle
            cx={cursorX}
            cy={cursorY}
            r={5}
            fill="url(#glowGrad)"
            stroke={theme.colors.accentGlow}
            strokeWidth={1}
          />
        </Svg>
      </SvgWrapper>

      <FooterRow>
        <TimeLabel>12 AM</TimeLabel>
        <TimeLabel>6 AM</TimeLabel>
        <TimeLabel>12 PM</TimeLabel>
        <TimeLabel>6 PM</TimeLabel>
        <TimeLabel>12 AM</TimeLabel>
      </FooterRow>
    </Container>
  );
};

const Container = styled.View`
  background-color: rgba(26, 21, 40, 0.65);
  border-radius: 16px;
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.06);
  padding: 16px 12px;
  width: 100%;
`;

const TitleRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
`;

const WidgetTitle = styled.Text`
  color: ${theme.colors.textPrimary};
  font-size: 15px;
  font-weight: 600;
`;

const StatusBadge = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 4px 8px;
  border-radius: 20px;
`;

const StatusDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  margin-right: 6px;
`;

const StatusText = styled.Text`
  font-size: 11px;
  font-weight: 600;
`;

const SvgWrapper = styled.View`
  align-items: center;
  width: 100%;
`;

const FooterRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 6px;
  padding: 0 4px;
`;

const TimeLabel = styled.Text`
  color: #6B6280;
  font-size: 10px;
  font-weight: 500;
`;
