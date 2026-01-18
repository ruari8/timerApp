import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  TimerSegment,
  SEGMENT_COLORS,
  SOUND_OPTIONS,
  SoundKey,
  theme,
  formatDuration,
} from '@repo/shared';
import { playSound } from '../utils/audio';

interface SegmentEditorProps {
  segment: TimerSegment;
  onUpdate: (segment: TimerSegment) => void;
  onDelete: () => void;
}

const PRESET_DURATIONS = [15, 30, 60, 90, 120, 180, 300, 600, 900, 1500];
const COLOR_OPTIONS = Object.values(SEGMENT_COLORS);
const SOUND_KEYS = Object.keys(SOUND_OPTIONS) as SoundKey[];

export function SegmentEditor({ segment, onUpdate, onDelete }: SegmentEditorProps) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [customSeconds, setCustomSeconds] = useState('');

  const handleSoundSelect = (soundKey: SoundKey) => {
    playSound(soundKey, true); // Preview the sound
    onUpdate({ ...segment, endSound: soundKey });
    setShowSoundPicker(false);
  };

  const handleDurationSelect = (seconds: number) => {
    onUpdate({ ...segment, durationSeconds: seconds });
    setShowDurationPicker(false);
  };

  const handleCustomDuration = () => {
    const mins = parseInt(customMinutes) || 0;
    const secs = parseInt(customSeconds) || 0;
    const total = mins * 60 + secs;
    if (total > 0) {
      onUpdate({ ...segment, durationSeconds: total });
      setCustomMinutes('');
      setCustomSeconds('');
      setShowDurationPicker(false);
    }
  };

  return (
    <View style={[styles.container, { borderLeftColor: segment.color }]}>
      <View style={styles.header}>
        <TextInput
          style={styles.nameInput}
          value={segment.name}
          onChangeText={(name) => onUpdate({ ...segment, name })}
          placeholder="Segment name"
          placeholderTextColor={theme.colors.textMuted}
        />
        
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.durationBtn}
          onPress={() => setShowDurationPicker(!showDurationPicker)}
        >
          <Text style={styles.durationText}>
            {formatDuration(segment.durationSeconds)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.soundBtn}
          onPress={() => setShowSoundPicker(!showSoundPicker)}
        >
          <Text style={styles.soundText}>
            🔔 {SOUND_OPTIONS[segment.endSound || 'bell'].label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.colorBtn, { backgroundColor: segment.color }]}
          onPress={() => setShowColorPicker(!showColorPicker)}
        />
      </View>

      {showDurationPicker && (
        <View style={styles.picker}>
          <Text style={styles.pickerLabel}>Quick select</Text>
          <View style={styles.presetGrid}>
            {PRESET_DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.presetBtn,
                  segment.durationSeconds === d && styles.presetBtnActive,
                ]}
                onPress={() => handleDurationSelect(d)}
              >
                <Text
                  style={[
                    styles.presetText,
                    segment.durationSeconds === d && styles.presetTextActive,
                  ]}
                >
                  {formatDuration(d)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.pickerLabel}>Custom</Text>
          <View style={styles.customDuration}>
            <TextInput
              style={styles.durationInput}
              value={customMinutes}
              onChangeText={setCustomMinutes}
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={3}
            />
            <Text style={styles.durationUnit}>min</Text>
            <TextInput
              style={styles.durationInput}
              value={customSeconds}
              onChangeText={setCustomSeconds}
              placeholder="0"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.durationUnit}>sec</Text>
            <TouchableOpacity style={styles.setBtn} onPress={handleCustomDuration}>
              <Text style={styles.setBtnText}>Set</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showColorPicker && (
        <View style={styles.picker}>
          <Text style={styles.pickerLabel}>Color</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  segment.color === color && styles.colorOptionActive,
                ]}
                onPress={() => {
                  onUpdate({ ...segment, color });
                  setShowColorPicker(false);
                }}
              />
            ))}
          </View>
        </View>
      )}

      {showSoundPicker && (
        <View style={styles.picker}>
          <Text style={styles.pickerLabel}>End Sound (tap to preview)</Text>
          <View style={styles.soundGrid}>
            {SOUND_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.soundOption,
                  (segment.endSound || 'bell') === key && styles.soundOptionActive,
                ]}
                onPress={() => handleSoundSelect(key)}
              >
                <Text
                  style={[
                    styles.soundOptionText,
                    (segment.endSound || 'bell') === key && styles.soundOptionTextActive,
                  ]}
                >
                  {SOUND_OPTIONS[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  nameInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.text,
    padding: 0,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
  deleteText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationBtn: {
    backgroundColor: theme.colors.backgroundTertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  durationText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
  },
  soundBtn: {
    backgroundColor: theme.colors.backgroundTertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  soundText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  picker: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pickerLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  presetBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  presetBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  presetTextActive: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  customDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationInput: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    width: 60,
    textAlign: 'center',
    marginRight: theme.spacing.sm,
  },
  durationUnit: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    marginRight: theme.spacing.sm,
  },
  setBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.md,
  },
  setBtnText: {
    color: theme.colors.background,
    fontWeight: '600',
    fontSize: theme.fontSize.sm,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  colorOptionActive: {
    borderColor: theme.colors.text,
  },
  soundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  soundOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  soundOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  soundOptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  soundOptionTextActive: {
    color: theme.colors.background,
    fontWeight: '600',
  },
});
