import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { TimerPattern } from '../types';
import { theme } from '../utils/theme';
import { formatDuration, calculatePatternDuration } from '../utils/helpers';

interface PatternCardProps {
  pattern: TimerPattern;
  onPress: () => void;
  onLongPress: () => void;
}

export function PatternCard({ pattern, onPress, onLongPress }: PatternCardProps) {
  const duration = calculatePatternDuration(pattern);
  const isInfinite = duration === -1;
  
  // Get preview colors from segments
  const previewColors = pattern.blocks
    .flatMap(block => block.segments.map(seg => seg.color))
    .slice(0, 5);
  
  // Get segment preview text
  const segmentNames = pattern.blocks
    .flatMap(block => block.segments.map(seg => seg.name))
    .slice(0, 3)
    .join(' → ');
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Color bar preview */}
      <View style={styles.colorBar}>
        {previewColors.map((color, i) => (
          <View
            key={i}
            style={[
              styles.colorSegment,
              { backgroundColor: color, flex: 1 },
            ]}
          />
        ))}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {pattern.name}
        </Text>
        
        <Text style={styles.preview} numberOfLines={1}>
          {segmentNames}
        </Text>
        
        <View style={styles.footer}>
          <Text style={styles.duration}>
            {isInfinite ? '∞ Repeating' : formatDuration(duration)}
          </Text>
          
          <View style={styles.stats}>
            <Text style={styles.stat}>
              {pattern.blocks.length} block{pattern.blocks.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  colorBar: {
    flexDirection: 'row',
    height: 4,
  },
  colorSegment: {
    height: 4,
  },
  content: {
    padding: theme.spacing.md,
  },
  name: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  preview: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
  },
});

