import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TimerPattern } from '../types';
import { theme } from '../utils/theme';
import { loadPatterns, deletePattern } from '../utils/storage';
import { PatternCard } from '../components/PatternCard';

type RootStackParamList = {
  Home: undefined;
  Editor: { patternId?: string };
  Timer: { pattern: TimerPattern };
};

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [patterns, setPatterns] = useState<TimerPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const data = await loadPatterns();
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatternPress = (pattern: TimerPattern) => {
    navigation.navigate('Timer', { pattern });
  };

  const handlePatternLongPress = (pattern: TimerPattern) => {
    Alert.alert(
      pattern.name,
      'What would you like to do?',
      [
        {
          text: 'Edit',
          onPress: () => navigation.navigate('Editor', { patternId: pattern.id }),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(pattern),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const confirmDelete = (pattern: TimerPattern) => {
    Alert.alert(
      'Delete Timer?',
      `Are you sure you want to delete "${pattern.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePattern(pattern.id);
            loadData();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Timers</Text>
        <Text style={styles.subtitle}>Tap to start, hold to edit</Text>
      </View>

      {/* Pattern list */}
      <FlatList
        data={patterns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PatternCard
            pattern={item}
            onPress={() => handlePatternPress(item)}
            onLongPress={() => handlePatternLongPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No timers yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first programmable timer
              </Text>
            </View>
          ) : null
        }
      />

      {/* Create button */}
      <TouchableOpacity
        style={styles.createBtn}
        onPress={() => navigation.navigate('Editor', {})}
        activeOpacity={0.8}
      >
        <Text style={styles.createBtnText}>+ New Timer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  createBtn: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.background,
  },
});

