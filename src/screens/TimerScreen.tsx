import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { TimerPattern, TimerState } from '../types';
import { theme } from '../utils/theme';
import { formatTime, getCurrentSegment, getNextPosition } from '../utils/helpers';
import { playBell, playComplete, playTick, initAudio } from '../utils/audio';

type RootStackParamList = {
  Home: undefined;
  Editor: { patternId?: string };
  Timer: { pattern: TimerPattern };
};

type TimerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Timer'>;
  route: RouteProp<RootStackParamList, 'Timer'>;
};

const { width } = Dimensions.get('window');
const PROGRESS_WIDTH = width * 0.7;

export function TimerScreen({ navigation, route }: TimerScreenProps) {
  const { pattern } = route.params;
  
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentBlockIndex: 0,
    currentSegmentIndex: 0,
    currentBlockRepeat: 1,
    currentPatternRepeat: 1,
    remainingSeconds: pattern.blocks[0]?.segments[0]?.durationSeconds || 60,
    totalElapsedSeconds: 0,
  });

  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSegment = getCurrentSegment(
    pattern,
    state.currentBlockIndex,
    state.currentSegmentIndex
  );

  useEffect(() => {
    initAudio();
  }, []);

  const tick = useCallback(() => {
    setState((prev) => {
      if (prev.remainingSeconds <= 1) {
        playBell();
        
        const nextPos = getNextPosition(
          pattern,
          prev.currentBlockIndex,
          prev.currentSegmentIndex,
          prev.currentBlockRepeat,
          prev.currentPatternRepeat
        );

        if (nextPos.isComplete) {
          playComplete();
          setIsComplete(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return {
            ...prev,
            isRunning: false,
            remainingSeconds: 0,
          };
        }

        const nextSegment = getCurrentSegment(
          pattern,
          nextPos.blockIndex,
          nextPos.segmentIndex
        );

        return {
          ...prev,
          currentBlockIndex: nextPos.blockIndex,
          currentSegmentIndex: nextPos.segmentIndex,
          currentBlockRepeat: nextPos.blockRepeat,
          currentPatternRepeat: nextPos.patternRepeat,
          remainingSeconds: nextSegment?.durationSeconds || 60,
          totalElapsedSeconds: prev.totalElapsedSeconds + 1,
        };
      }

      if (prev.remainingSeconds === 4) {
        playTick();
      }
      
      return {
        ...prev,
        remainingSeconds: prev.remainingSeconds - 1,
        totalElapsedSeconds: prev.totalElapsedSeconds + 1,
      };
    });
  }, [pattern]);

  const toggleTimer = () => {
    if (isComplete) {
      resetTimer();
      return;
    }

    if (state.isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setState((prev) => ({ ...prev, isPaused: true }));
    } else {
      intervalRef.current = setInterval(tick, 1000);
      setState((prev) => ({ ...prev, isRunning: true, isPaused: false }));
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsComplete(false);
    setState({
      isRunning: false,
      isPaused: false,
      currentBlockIndex: 0,
      currentSegmentIndex: 0,
      currentBlockRepeat: 1,
      currentPatternRepeat: 1,
      remainingSeconds: pattern.blocks[0]?.segments[0]?.durationSeconds || 60,
      totalElapsedSeconds: 0,
    });
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentBlock = pattern.blocks[state.currentBlockIndex];
  const segmentColor = currentSegment?.color || theme.colors.primary;

  const blockRepeatText = currentBlock?.repeatCount === -1
    ? `Loop ${state.currentBlockRepeat}`
    : `${state.currentBlockRepeat}/${currentBlock?.repeatCount}`;
  
  const patternRepeatText = pattern.repeatEntirePattern === -1
    ? `Cycle ${state.currentPatternRepeat}`
    : `Cycle ${state.currentPatternRepeat}/${pattern.repeatEntirePattern}`;

  // Calculate progress as a number (0-1)
  const progress = currentSegment 
    ? 1 - state.remainingSeconds / currentSegment.durationSeconds 
    : 0;
  const progressBarWidth = progress * PROGRESS_WIDTH;

  return (
    <View style={[styles.container, { backgroundColor: segmentColor }]}>
      <View style={styles.overlay} />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigation.goBack();
        }}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.patternName}>{pattern.name}</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.segmentName}>
          {isComplete ? 'Complete!' : currentSegment?.name || 'Timer'}
        </Text>
        
        <Text style={styles.timer}>
          {formatTime(state.remainingSeconds)}
        </Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: progressBarWidth }]} />
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Block</Text>
          <Text style={styles.infoValue}>{blockRepeatText}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Elapsed</Text>
          <Text style={styles.infoValue}>{formatTime(state.totalElapsedSeconds)}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Pattern</Text>
          <Text style={styles.infoValue}>{patternRepeatText}</Text>
        </View>
      </View>

      <View style={styles.preview}>
        {currentBlock?.segments.map((seg, i) => (
          <View
            key={seg.id}
            style={[
              styles.previewSegment,
              { backgroundColor: seg.color },
              i === state.currentSegmentIndex && styles.previewSegmentActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.playBtn,
            isComplete && styles.playBtnComplete,
          ]}
          onPress={toggleTimer}
        >
          <Text style={styles.playText}>
            {isComplete
              ? '↻'
              : state.isRunning && !state.isPaused
              ? '⏸'
              : '▶'}
          </Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.lg,
  },
  backText: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  patternName: {
    position: 'absolute',
    top: 60,
    fontSize: theme.fontSize.md,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  timerContainer: {
    alignItems: 'center',
  },
  segmentName: {
    fontSize: 28,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  timer: {
    fontSize: 96,
    fontWeight: '200',
    color: '#fff',
    letterSpacing: -2,
  },
  progressContainer: {
    width: PROGRESS_WIDTH,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: theme.spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  preview: {
    flexDirection: 'row',
    marginTop: theme.spacing.xl,
  },
  previewSegment: {
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.5,
    marginHorizontal: theme.spacing.xs,
  },
  previewSegmentActive: {
    opacity: 1,
    transform: [{ scale: 1.3 }],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  resetBtn: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  resetText: {
    fontSize: theme.fontSize.md,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: theme.spacing.xl,
  },
  playBtnComplete: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  playText: {
    fontSize: 32,
    color: '#333',
  },
  spacer: {
    width: 100,
  },
});
