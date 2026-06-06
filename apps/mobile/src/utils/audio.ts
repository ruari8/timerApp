import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { SoundKey } from '@repo/shared';

// Sound cache to avoid reloading
const soundCache: Map<string, Audio.Sound> = new Map();

// Sound definitions using expo-av's built-in functionality
// We'll generate tones programmatically or use simple audio patterns
const SOUND_FREQUENCIES: Record<string, { freq: number; duration: number; pattern: number[] }> = {
  bell: { freq: 800, duration: 300, pattern: [1, 0.5, 0.3] },
  chime: { freq: 1200, duration: 200, pattern: [1, 0.8, 0.6, 0.4] },
  beep: { freq: 1000, duration: 150, pattern: [1] },
  gong: { freq: 400, duration: 600, pattern: [1, 0.7, 0.4, 0.2] },
  whistle: { freq: 1800, duration: 400, pattern: [1, 0, 1] },
};

let audioInitialized = false;

// Initialize audio system
export async function initAudio(): Promise<void> {
  if (audioInitialized) return;
  
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    audioInitialized = true;
  } catch (error) {
    console.log('Audio init error:', error);
  }
}

// Play a specific sound by key
export async function playSound(soundKey: SoundKey, useHaptic: boolean = true): Promise<void> {
  if (soundKey === 'none') {
    // Still do haptic if enabled
    if (useHaptic) {
      await playHaptic('medium');
    }
    return;
  }

  try {
    // Play haptic feedback
    if (useHaptic) {
      await playHaptic('medium');
    }

    // Create and play a simple tone using Audio API
    // Since expo-av doesn't have built-in tone generation, we'll use the notification pattern
    // For a real app, you'd bundle actual sound files in assets
    
    // For now, use system sounds via haptics + a pattern approach
    const pattern = SOUND_FREQUENCIES[soundKey];
    if (pattern) {
      // Play haptic pattern to simulate sound variety
      for (let i = 0; i < pattern.pattern.length; i++) {
        if (pattern.pattern[i] > 0) {
          await Haptics.impactAsync(
            pattern.freq > 1000 
              ? Haptics.ImpactFeedbackStyle.Light 
              : pattern.freq > 600 
                ? Haptics.ImpactFeedbackStyle.Medium 
                : Haptics.ImpactFeedbackStyle.Heavy
          );
        }
        if (i < pattern.pattern.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  } catch (error) {
    console.log('Sound playback error:', error);
  }
}

// Play haptic feedback
async function playHaptic(intensity: 'light' | 'medium' | 'heavy'): Promise<void> {
  try {
    const style = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    }[intensity];
    
    await Haptics.impactAsync(style);
  } catch (error) {
    console.log('Haptic error:', error);
  }
}

// Play bell sound (segment transition) - legacy support
export async function playBell(): Promise<void> {
  await playSound('bell', true);
}

// Play a tick sound for countdown
export async function playTick(useHaptic: boolean = true): Promise<void> {
  if (!useHaptic) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.log('Haptic error:', error);
  }
}

// Play completion sound
export async function playComplete(useHaptic: boolean = true): Promise<void> {
  if (!useHaptic) return;

  try {
    // Double haptic for completion
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise(resolve => setTimeout(resolve, 200));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptic error:', error);
  }
}

// Cleanup audio resources
export async function cleanupAudio(): Promise<void> {
  for (const sound of soundCache.values()) {
    try {
      await sound.unloadAsync();
    } catch (error) {
      console.log('Sound cleanup error:', error);
    }
  }
  soundCache.clear();
}
