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
  background-color: rgba(18, 18, 23, 0.85);
  border-radius: 18px;
  border-width: 1px;
  border-color: ${props => props.accentBorder ? '#FF7E47' : '#1E1E26'};
  padding: 16px;
  shadow-color: #000;
  shadow-offset: 0px 6px;
  shadow-opacity: 0.45;
  shadow-radius: 12px;
  elevation: 6;
`;
