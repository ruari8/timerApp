import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  TimerPattern,
  TimerBlock,
  theme,
  createDefaultPattern,
  createDefaultBlock,
  formatDuration,
  calculatePatternDuration,
} from '@repo/shared';
import { loadPatterns, savePattern } from '../utils/storage';
import { BlockEditor } from '../components/BlockEditor';

type RootStackParamList = {
  Home: undefined;
  Editor: { patternId?: string };
  Timer: { pattern: TimerPattern };
};

type EditorScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Editor'>;
  route: RouteProp<RootStackParamList, 'Editor'>;
};

const PATTERN_REPEAT_OPTIONS = [1, 2, 3, 4, 5, -1];

export function EditorScreen({ navigation, route }: EditorScreenProps) {
  const { patternId } = route.params || {};
  const [pattern, setPattern] = useState<TimerPattern>(createDefaultPattern());
  const [showPatternRepeat, setShowPatternRepeat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExisting();
  }, [patternId]);

  const loadExisting = async () => {
    if (patternId) {
      const patterns = await loadPatterns();
      const existing = patterns.find(p => p.id === patternId);
      if (existing) {
        setPattern(existing);
      }
    }
    setIsLoading(false);
  };

  const handleBlockUpdate = (index: number, block: TimerBlock) => {
    const newBlocks = [...pattern.blocks];
    newBlocks[index] = block;
    setPattern({ ...pattern, blocks: newBlocks });
  };

  const handleBlockDelete = (index: number) => {
    if (pattern.blocks.length === 1) {
      Alert.alert('Cannot Delete', 'A timer must have at least one block.');
      return;
    }
    const newBlocks = pattern.blocks.filter((_, i) => i !== index);
    setPattern({ ...pattern, blocks: newBlocks });
  };

  const handleAddBlock = () => {
    setPattern({
      ...pattern,
      blocks: [...pattern.blocks, createDefaultBlock()],
    });
  };

  const handleSave = async () => {
    if (!pattern.name.trim()) {
      Alert.alert('Missing Name', 'Please give your timer a name.');
      return;
    }

    await savePattern({
      ...pattern,
      name: pattern.name.trim(),
    });

    navigation.goBack();
  };

  const totalDuration = calculatePatternDuration(pattern);
  const isInfinite = totalDuration === -1;

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {patternId ? 'Edit Timer' : 'New Timer'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveBtn}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Timer name input */}
        <View style={styles.nameSection}>
          <TextInput
            style={styles.nameInput}
            value={pattern.name}
            onChangeText={(name) => setPattern({ ...pattern, name })}
            placeholder="Timer Name"
            placeholderTextColor={theme.colors.textMuted}
          />
          
          <View style={styles.nameMeta}>
            <TouchableOpacity
              style={styles.patternRepeatBtn}
              onPress={() => setShowPatternRepeat(!showPatternRepeat)}
            >
              <Text style={styles.patternRepeatLabel}>Loop entire pattern </Text>
              <Text style={styles.patternRepeatValue}>
                {pattern.repeatEntirePattern === -1 ? '∞' : `${pattern.repeatEntirePattern}×`}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.totalDuration}>
              {isInfinite ? '∞ Total' : `${formatDuration(totalDuration)} total`}
            </Text>
          </View>

          {showPatternRepeat && (
            <View style={styles.repeatPicker}>
              {PATTERN_REPEAT_OPTIONS.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.repeatOption,
                    pattern.repeatEntirePattern === count && styles.repeatOptionActive,
                  ]}
                  onPress={() => {
                    setPattern({ ...pattern, repeatEntirePattern: count });
                    setShowPatternRepeat(false);
                  }}
                >
                  <Text
                    style={[
                      styles.repeatOptionText,
                      pattern.repeatEntirePattern === count && styles.repeatOptionTextActive,
                    ]}
                  >
                    {count === -1 ? '∞' : count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Blocks */}
        <View style={styles.blocksSection}>
          <Text style={styles.sectionTitle}>Blocks</Text>
          <Text style={styles.sectionSubtitle}>
            Each block contains segments that play in sequence
          </Text>
          
          {pattern.blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              blockIndex={index}
              onUpdate={(b) => handleBlockUpdate(index, b)}
              onDelete={() => handleBlockDelete(index)}
            />
          ))}

          <TouchableOpacity style={styles.addBlockBtn} onPress={handleAddBlock}>
            <Text style={styles.addBlockText}>+ Add Block</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  cancelBtn: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveBtn: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  nameSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  nameMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patternRepeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternRepeatLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  patternRepeatValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  totalDuration: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  repeatPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  repeatOption: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  repeatOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  repeatOptionText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  repeatOptionTextActive: {
    color: theme.colors.background,
  },
  blocksSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.lg,
  },
  addBlockBtn: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addBlockText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});

