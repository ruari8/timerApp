import { SoundKey, SOUND_OPTIONS } from '@repo/shared';

// Web Audio API based sound system
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Sound frequencies and durations
const SOUND_CONFIG: Record<string, { freq: number; duration: number; type: OscillatorType }> = {
  bell: { freq: 800, duration: 0.3, type: 'sine' },
  chime: { freq: 1200, duration: 0.2, type: 'sine' },
  beep: { freq: 1000, duration: 0.15, type: 'square' },
  gong: { freq: 400, duration: 0.6, type: 'sine' },
  whistle: { freq: 1800, duration: 0.4, type: 'sine' },
};

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export async function playSound(soundKey: SoundKey, useHaptic: boolean = true): Promise<void> {
  if (soundKey === 'none' || !SOUND_OPTIONS[soundKey]?.file) {
    if (useHaptic) {
      vibrate(40);
    }
    return;
  }

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (useHaptic) {
      vibrate([20, 40, 20]);
    }

    const config = SOUND_CONFIG[soundKey] || SOUND_CONFIG.bell;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq, ctx.currentTime);
    
    // Envelope for natural sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + config.duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + config.duration);
  } catch (error) {
    console.log('Sound playback error:', error);
  }
}

export async function playTick(useHaptic: boolean = true): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (useHaptic) {
      vibrate(20);
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (error) {
    console.log('Tick error:', error);
  }
}

export async function playComplete(useHaptic: boolean = true): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (useHaptic) {
      vibrate([40, 60, 40]);
    }

    // Play two ascending tones
    const frequencies = [600, 800, 1000];
    
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
      
      oscillator.start(ctx.currentTime + i * 0.15);
      oscillator.stop(ctx.currentTime + i * 0.15 + 0.2);
    });
  } catch (error) {
    console.log('Complete sound error:', error);
  }
}
