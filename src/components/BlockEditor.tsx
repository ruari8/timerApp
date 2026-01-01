import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { TimerBlock, TimerSegment } from '../types';
import { theme } from '../utils/theme';
import { SegmentEditor } from './SegmentEditor';
import { createDefaultSegment } from '../utils/helpers';

interface BlockEditorProps {
  block: TimerBlock;
  blockIndex: number;
  onUpdate: (block: TimerBlock) => void;
  onDelete: () => void;
}

const REPEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, -1];

export function BlockEditor({ block, blockIndex, onUpdate, onDelete }: BlockEditorProps) {
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const handleSegmentUpdate = (segmentIndex: number, segment: TimerSegment) => {
    const newSegments = [...block.segments];
    newSegments[segmentIndex] = segment;
    onUpdate({ ...block, segments: newSegments });
  };

  const handleSegmentDelete = (segmentIndex: number) => {
    if (block.segments.length === 1) return;
    const newSegments = block.segments.filter((_, i) => i !== segmentIndex);
    onUpdate({ ...block, segments: newSegments });
  };

  const handleAddSegment = () => {
    const colors = ['#E85D04', '#2D6A4F', '#4361EE', '#7B2CBF', '#D90429'];
    const color = colors[block.segments.length % colors.length];
    const newSegment = createDefaultSegment('New Segment', color);
    onUpdate({ ...block, segments: [...block.segments, newSegment] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Block {blockIndex + 1}</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.repeatBtn}
            onPress={() => setShowRepeatPicker(!showRepeatPicker)}
          >
            <Text style={styles.repeatText}>
              {block.repeatCount === -1 ? '∞' : `×${block.repeatCount}`}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showRepeatPicker && (
        <View style={styles.repeatPicker}>
          <Text style={styles.pickerLabel}>Repeat count</Text>
          <View style={styles.repeatGrid}>
            {REPEAT_OPTIONS.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.repeatOption,
                  block.repeatCount === count && styles.repeatOptionActive,
                ]}
                onPress={() => {
                  onUpdate({ ...block, repeatCount: count });
                  setShowRepeatPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.repeatOptionText,
                    block.repeatCount === count && styles.repeatOptionTextActive,
                  ]}
                >
                  {count === -1 ? '∞' : count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.segments}>
        {block.segments.map((segment, index) => (
          <SegmentEditor
            key={segment.id}
            segment={segment}
            onUpdate={(s) => handleSegmentUpdate(index, s)}
            onDelete={() => handleSegmentDelete(index)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={handleAddSegment}>
        <Text style={styles.addBtnText}>+ Add Segment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repeatBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    marginRight: theme.spacing.sm,
  },
  repeatText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700',
    color: theme.colors.background,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
  deleteText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textMuted,
  },
  repeatPicker: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  repeatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  repeatOption: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  repeatOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  repeatOptionText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  repeatOptionTextActive: {
    color: theme.colors.background,
  },
  segments: {
    marginBottom: theme.spacing.sm,
  },
  addBtn: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
