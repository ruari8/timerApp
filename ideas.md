# iOS Native Integration Ideas

This document outlines how to integrate your timer app with native iOS features like the Dynamic Island, Lock Screen widgets, and how to publish to the App Store.

---

## Understanding Expo Go vs Native Builds

### What is Expo Go?

Expo Go is a development client app that lets you preview your React Native app instantly without building native code. It's fantastic for rapid development, but has limitations:

- Cannot access all native iOS APIs (like Live Activities)
- Your app runs inside the Expo Go container, not as a standalone app
- Won't work offline without Expo's servers
- Cannot be distributed to others without them installing Expo Go

### What is a Development Build?

A development build is your own custom version of Expo Go that includes any native modules your app needs. It's built once and then updated with JavaScript updates like Expo Go.

### What is a Production Build?

A production build is the final `.ipa` file that gets uploaded to the App Store. It's optimized, signed, and ready for distribution.

---

## Making Your App Permanent (No `npx expo start`)

### Option 1: Expo EAS Build (Recommended)

EAS (Expo Application Services) is the modern way to build and distribute Expo apps.

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
eas build:configure

# Build for iOS (requires Apple Developer account - $99/year)
eas build --platform ios
```

This creates a proper `.ipa` file. You can then:
- Install it on your device via TestFlight
- Submit to the App Store

### Option 2: Local Builds (No Expo Account)

If you have Xcode installed:

```bash
# Generate native iOS project
npx expo prebuild --platform ios

# Open in Xcode
open ios/*.xcworkspace
```

Then build and run directly from Xcode to your connected device.

### Getting on the App Store

1. **Apple Developer Program** - Enroll at developer.apple.com ($99/year)
2. **Configure app.json** - Add bundle identifier, version, etc.
3. **Build with EAS** - `eas build --platform ios`
4. **Submit** - `eas submit --platform ios`

---

## Dynamic Island (Live Activities)

The Dynamic Island is that pill-shaped area at the top of iPhone 14 Pro and later. Apps can display real-time info there using **Live Activities**.

### How It Works

Live Activities use Apple's ActivityKit framework. In React Native/Expo, you have a few options:

### Option A: expo-live-activity (Community Package)

```bash
npx expo install expo-live-activity
```

This package wraps ActivityKit but is still maturing. You'd need to:

1. Create a Widget Extension in Xcode (native Swift code)
2. Define your Live Activity UI in SwiftUI
3. Use the expo-live-activity bridge to start/update activities from JS

### Option B: Native Module Approach

More control but more work:

1. Run `npx expo prebuild` to eject native code
2. In Xcode, add a Widget Extension target
3. Write SwiftUI for the Dynamic Island UI:

```swift
// In your Widget Extension
struct TimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TimerAttributes.self) { context in
            // Lock Screen banner view
            VStack {
                Text(context.state.segmentName)
                Text(context.state.remainingTime)
                    .font(.largeTitle.monospacedDigit())
            }
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view (when held)
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.remainingTime)
                        .font(.title.monospacedDigit())
                }
            } compactLeading: {
                // Compact left side
                Image(systemName: "timer")
            } compactTrailing: {
                // Compact right side  
                Text(context.state.remainingTime)
            } minimal: {
                // Minimal view (when other activities present)
                Image(systemName: "timer")
            }
        }
    }
}
```

4. Bridge to JavaScript using a native module

### What Users See

- **Compact Mode**: Small pill showing timer countdown
- **Expanded Mode**: When tapped/held, shows segment name, progress, controls
- **Lock Screen**: Banner widget below time showing timer status

### Implementation Complexity

This is the most complex feature to implement because:
- Requires native Swift/SwiftUI code
- Must handle app background states
- Needs separate widget extension target
- Communication between app and widget is limited

**Recommendation**: Start with the core app features, then add Live Activities as a v2 enhancement once the app is stable.

---

## Lock Screen Widgets

Different from Live Activities, Lock Screen widgets are static or semi-updating widgets that persist on the lock screen.

### Types

1. **Circular** - Small round widget
2. **Rectangular** - Medium horizontal widget  
3. **Inline** - Text above the time

### Implementation

Same native approach as Dynamic Island - requires a Widget Extension:

```swift
struct TimerWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TimerWidget", provider: Provider()) { entry in
            TimerWidgetView(entry: entry)
        }
        .configurationDisplayName("Timer")
        .description("Quick access to your timers")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
```

### Use Cases for Timer App

- **Circular**: Show a play button to quick-start favorite timer
- **Rectangular**: Show next scheduled timer or last used timer with tap-to-start
- **Inline**: "25m Focus Session" text

---

## Background Audio & Notifications

For timers to work when the app is backgrounded:

### Option 1: Background Audio Mode

Keep a silent audio track playing to prevent iOS from suspending your app:

```javascript
// In app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    }
  }
}
```

This keeps your timer running but uses more battery.

### Option 2: Local Notifications (Recommended)

Schedule notifications for each segment transition when timer starts:

```bash
npx expo install expo-notifications
```

```javascript
import * as Notifications from 'expo-notifications';

// When timer starts, schedule all transition notifications
async function scheduleTimerNotifications(segments) {
  let delay = 0;
  for (const segment of segments) {
    delay += segment.durationSeconds;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up!",
        body: `${segment.name} complete. Next: ${nextSegment.name}`,
        sound: 'bell.wav', // Custom sound file
      },
      trigger: { seconds: delay },
    });
  }
}
```

This is more battery-efficient and works even if the app is killed.

---

## Apple Watch App

For a companion Watch app:

### Using React Native

There's no official React Native for watchOS. Options:

1. **Native Swift** - Write a separate watchOS app that syncs with your iOS app via WatchConnectivity
2. **expo-watch-connectivity** - Community package for basic communication

### What to Show on Watch

- Current timer segment and countdown
- Play/pause controls
- Haptic taps on transitions (watch haptics are great for this!)
- Skip to next segment

---

## Recommended Implementation Order

1. **Now (v1.0)**: Core timer functionality (done!)
2. **v1.1**: Local notifications for background timer alerts
3. **v1.2**: Home Screen widget (easier than Lock Screen)
4. **v2.0**: Live Activities / Dynamic Island
5. **v2.1**: Apple Watch companion
6. **v2.2**: Lock Screen widgets

---

## Development Setup for Native Features

When you're ready to add native iOS features:

```bash
# 1. Prebuild to generate native projects
npx expo prebuild --platform ios

# 2. Open in Xcode
open ios/*.xcworkspace

# 3. Add Widget Extension
# In Xcode: File > New > Target > Widget Extension

# 4. Write your SwiftUI widget code

# 5. Build with native code
npx expo run:ios --device
```

### Key Files After Prebuild

```
ios/
├── YourApp/
│   ├── AppDelegate.mm
│   └── Info.plist
├── YourApp.xcworkspace    # Open this in Xcode
├── YourAppWidget/         # Your widget extension (after adding)
│   ├── YourAppWidget.swift
│   └── Assets.xcassets
└── Podfile
```

---

## Useful Resources

- [Apple Live Activities Documentation](https://developer.apple.com/documentation/activitykit)
- [SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [expo-live-activity package](https://github.com/nickcyran/expo-live-activity)
- [React Native Background Tasks](https://docs.expo.dev/versions/latest/sdk/background-fetch/)

---

## Quick Wins Without Native Code

Some things you can do today in pure JS:

1. **expo-notifications**: Schedule sounds for timer transitions even when backgrounded
2. **expo-haptics**: Already using this - great!
3. **expo-keep-awake**: Prevent screen dimming during workout
4. **expo-brightness**: Auto-dim screen during rest periods

```bash
npx expo install expo-notifications expo-keep-awake expo-brightness
```

These give you 80% of the functionality without touching native code.


