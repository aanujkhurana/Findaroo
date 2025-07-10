import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface OnboardingIllustrationProps {
  type: 'welcome' | 'report' | 'connect';
  width?: number;
  height?: number;
}

export const OnboardingIllustration: React.FC<OnboardingIllustrationProps> = ({ 
  type, 
  width = 300, 
  height = 300 
}) => {
  const getIllustration = () => {
    switch (type) {
      case 'welcome':
        return (
          <Svg width={width} height={height} viewBox="0 0 300 300">
            <Circle cx="150" cy="150" r="120" fill="#EEF2FF" />
            <Circle cx="150" cy="150" r="90" fill="#C7D2FE" />
            <Circle cx="150" cy="150" r="60" fill="#818CF8" />
            <Circle cx="150" cy="150" r="30" fill="#4F46E5" />
            <G transform="translate(110, 110)">
              <Rect x="0" y="0" width="80" height="80" rx="10" fill="#FFFFFF" />
              <Path d="M20 40 L35 55 L60 25" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </G>
          </Svg>
        );
      case 'report':
        return (
          <Svg width={width} height={height} viewBox="0 0 300 300">
            <Rect x="60" y="60" width="180" height="180" rx="20" fill="#EEF2FF" />
            <Rect x="80" y="80" width="140" height="140" rx="10" fill="#C7D2FE" />
            <Rect x="100" y="100" width="100" height="100" rx="5" fill="#818CF8" />
            <Circle cx="150" cy="130" r="20" fill="#4F46E5" />
            <Path d="M130 170 L170 170" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" />
            <Path d="M140 150 L160 150" stroke="#4F46E5" strokeWidth="6" strokeLinecap="round" />
          </Svg>
        );
      case 'connect':
        return (
          <Svg width={width} height={height} viewBox="0 0 300 300">
            <Circle cx="100" cy="150" r="50" fill="#EEF2FF" />
            <Circle cx="200" cy="150" r="50" fill="#EEF2FF" />
            <Path d="M100 150 L200 150" stroke="#4F46E5" strokeWidth="6" strokeDasharray="10,5" />
            <Circle cx="100" cy="150" r="30" fill="#C7D2FE" />
            <Circle cx="200" cy="150" r="30" fill="#C7D2FE" />
            <Circle cx="100" cy="150" r="15" fill="#4F46E5" />
            <Circle cx="200" cy="150" r="15" fill="#4F46E5" />
            <Path d="M150 100 L150 200" stroke="#818CF8" strokeWidth="4" strokeDasharray="8,4" />
            <Circle cx="150" cy="100" r="10" fill="#818CF8" />
            <Circle cx="150" cy="200" r="10" fill="#818CF8" />
          </Svg>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {getIllustration()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});