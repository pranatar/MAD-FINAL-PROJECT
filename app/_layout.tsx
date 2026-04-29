import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from '@/context/AuthContext';


// TODO: Replace with your actual Convex deployment URL from the Convex dashboard
// Run `npx convex dev` and paste the CONVEX_URL from the terminal output here
const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ?? 'https://your-project.convex.cloud'
);

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="skill-material" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
