import React from 'react';
import { TouchableOpacityProps } from 'react-native';
import styled from 'styled-components/native';

interface GlassCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  accentBorder?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, accentBorder = false, ...props }) => {
  return (
    <CardContainer activeOpacity={props.onPress ? 0.85 : 1} accentBorder={accentBorder} {...props}>
      {children}
    </CardContainer>
  );
};

const CardContainer = styled.TouchableOpacity<{ accentBorder: boolean }>`
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: 18px;
  border-width: 0.8px;
  border-color: ${props => props.accentBorder ? '#FF7E47' : 'rgba(255, 255, 255, 0.08)'};
  padding: 16px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.25;
  shadow-radius: 8px;
  elevation: 4;
`;
