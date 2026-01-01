import * as Haptics from 'expo-haptics';

// Initialize audio (no-op for new API, kept for compatibility)
export async function initAudio(): Promise<void> {
  // New expo-audio doesn't require explicit initialization
}

// Play bell sound with haptic feedback
export async function playBell(): Promise<void> {
  try {
    // Always do haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptic error:', error);
  }
}

// Play a tick sound for countdown (haptic only)
export async function playTick(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.log('Haptic error:', error);
  }
}

// Play a completion/finish sound
export async function playComplete(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Haptic error:', error);
  }
}

// Cleanup (no-op for new API)
export async function cleanupAudio(): Promise<void> {
  // Nothing to clean up with haptics-only approach
}
