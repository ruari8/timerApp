# Pattern Timer

A flexible, programmable timer app for iOS. Create custom timer patterns with repeating segments for board games, interval training, and more.

## Features

- **Programmable Patterns**: Create timer sequences with multiple segments
- **Repeating Blocks**: Set segments to repeat X times or infinitely
- **Audio Alerts**: Bell sounds when each segment completes
- **Haptic Feedback**: Feel the countdown on your device
- **Beautiful UI**: Dark theme with segment-colored backgrounds
- **Presets**: Comes with Catan turns, Couch to 5K, and Pomodoro timers

## Use Cases

- **Board Games**: 1-minute turn timers for Catan that repeat forever
- **Interval Training**: 1min run → 2min walk, repeat 8 times
- **Pomodoro**: 25min focus → 5min break, with long breaks
- **Custom**: Build any pattern you need

## Running the App

```bash
# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on your device via Expo Go app
# Scan the QR code that appears
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # App screens (Home, Editor, Timer)
├── types/          # TypeScript type definitions
├── utils/          # Helpers, audio, storage, theme
└── assets/         # Static assets
```

## Creating a Timer

1. Tap **+ New Timer** on the home screen
2. Give your timer a name
3. Add **Blocks** (groups of segments that can repeat)
4. Add **Segments** to each block with a name, duration, and color
5. Set repeat counts for blocks and the overall pattern
6. Tap **Save** and you're ready to go!

## Tech Stack

- React Native + Expo
- TypeScript
- expo-av for audio
- expo-haptics for haptic feedback
- AsyncStorage for persistence


