import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { karmaService } from '../services/karmaService';

interface KarmaBadgeProps {
  karmaPoints: number;
  size?: 'small' | 'medium' | 'large';
  showLevel?: boolean;
  showPoints?: boolean;
}

export const KarmaBadge: React.FC<KarmaBadgeProps> = ({
  karmaPoints,
  size = 'medium',
  showLevel = true,
  showPoints = true,
}) => {
  const karmaLevel = karmaService.getKarmaLevel(karmaPoints);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallContainer,
          icon: 16,
          levelText: styles.smallLevelText,
          pointsText: styles.smallPointsText,
        };
      case 'large':
        return {
          container: styles.largeContainer,
          icon: 28,
          levelText: styles.largeLevelText,
          pointsText: styles.largePointsText,
        };
      default:
        return {
          container: styles.mediumContainer,
          icon: 20,
          levelText: styles.mediumLevelText,
          pointsText: styles.mediumPointsText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.container,
      sizeStyles.container,
      { backgroundColor: `${karmaLevel.color}15` }
    ]}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: karmaLevel.color }
      ]}>
        <Feather 
          name={karmaLevel.icon as any} 
          size={sizeStyles.icon} 
          color="#fff" 
        />
      </View>
      
      <View style={styles.textContainer}>
        {showLevel && (
          <Text style={[
            styles.levelText,
            sizeStyles.levelText,
            { color: karmaLevel.color }
          ]}>
            {karmaLevel.level}
          </Text>
        )}
        {showPoints && (
          <Text style={[
            styles.pointsText,
            sizeStyles.pointsText
          ]}>
            {karmaPoints} points
          </Text>
        )}
      </View>
    </View>
  );
};

interface TrustedBadgeProps {
  isVerified: boolean;
  returnsCompleted: number;
  size?: 'small' | 'medium' | 'large';
}

export const TrustedBadge: React.FC<TrustedBadgeProps> = ({
  isVerified,
  returnsCompleted,
  size = 'medium',
}) => {
  const isTrustedReturner = returnsCompleted >= 3;
  
  if (!isTrustedReturner && !isVerified) {
    return null;
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.smallTrustedContainer,
          icon: 14,
          text: styles.smallTrustedText,
        };
      case 'large':
        return {
          container: styles.largeTrustedContainer,
          icon: 24,
          text: styles.largeTrustedText,
        };
      default:
        return {
          container: styles.mediumTrustedContainer,
          icon: 18,
          text: styles.mediumTrustedText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.trustedContainer,
      sizeStyles.container
    ]}>
      <Feather 
        name="shield-check" 
        size={sizeStyles.icon} 
        color="#10B981" 
      />
      <Text style={[
        styles.trustedText,
        sizeStyles.text
      ]}>
        {isTrustedReturner && isVerified ? 'Verified Returner' :
         isTrustedReturner ? 'Trusted Returner' :
         'Verified User'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 4,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  levelText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  smallLevelText: {
    fontSize: 10,
  },
  mediumLevelText: {
    fontSize: 12,
  },
  largeLevelText: {
    fontSize: 14,
  },
  pointsText: {
    color: '#64748B',
    fontWeight: '500',
  },
  smallPointsText: {
    fontSize: 8,
  },
  mediumPointsText: {
    fontSize: 10,
  },
  largePointsText: {
    fontSize: 12,
  },
  // Trusted badge styles
  trustedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98115',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallTrustedContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  mediumTrustedContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  largeTrustedContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trustedText: {
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  smallTrustedText: {
    fontSize: 10,
  },
  mediumTrustedText: {
    fontSize: 12,
  },
  largeTrustedText: {
    fontSize: 14,
  },
});
