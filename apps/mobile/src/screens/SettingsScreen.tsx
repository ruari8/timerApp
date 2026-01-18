import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  SOUND_OPTIONS,
  SoundKey,
  theme,
} from '@repo/shared';
import { loadSettings, saveSettings } from '../utils/storage';
import { playSound } from '../utils/audio';

type RootStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

const SKIP_OPTIONS = [3, 5, 10, 15, 30];
const SOUND_KEYS = Object.keys(SOUND_OPTIONS) as SoundKey[];

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setIsLoading(false);
    });
  }, []);

  const updateSettings = async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Skip Ahead Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skip Ahead</Text>
          <Text style={styles.sectionSubtitle}>
            When you tap skip, the timer jumps to this many seconds remaining
          </Text>
          
          <View style={styles.optionGrid}>
            {SKIP_OPTIONS.map((seconds) => (
              <TouchableOpacity
                key={seconds}
                style={[
                  styles.optionBtn,
                  settings.skipAheadSeconds === seconds && styles.optionBtnActive,
                ]}
                onPress={() => updateSettings({ skipAheadSeconds: seconds })}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.skipAheadSeconds === seconds && styles.optionTextActive,
                  ]}
                >
                  {seconds}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Default Sound Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Alert Sound</Text>
          <Text style={styles.sectionSubtitle}>
            Sound for new segments (tap to preview). Can be overridden per segment.
          </Text>
          
          <View style={styles.optionGrid}>
            {SOUND_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionBtn,
                  settings.defaultEndSound === key && styles.optionBtnActive,
                ]}
                onPress={() => {
                  playSound(key, settings.hapticFeedback);
                  updateSettings({ defaultEndSound: key });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    settings.defaultEndSound === key && styles.optionTextActive,
                  ]}
                >
                  {SOUND_OPTIONS[key].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Haptic Feedback Section */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.sectionTitle}>Haptic Feedback</Text>
              <Text style={styles.sectionSubtitle}>
                Vibrate on timer transitions and ticks
              </Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(value) => updateSettings({ hapticFeedback: value })}
              trackColor={{ 
                false: theme.colors.backgroundTertiary, 
                true: theme.colors.primaryLight 
              }}
              thumbColor={settings.hapticFeedback ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Timer App</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.description}>
              A programmable interval timer for workouts, productivity, games, and more.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  backBtn: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 50,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  optionBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: theme.fontSize.md,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  optionTextActive: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  aboutCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  appName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  version: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});


