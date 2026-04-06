import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('@lk_user');
      const inAuth = segments[0] === '(auth)';
      if (raw && inAuth) {
        router.replace('/(tabs)/beranda');
      } else if (!raw && !inAuth) {
        router.replace('/(auth)/login');
      }
      setChecked(true);
    })();
  }, [segments]);

  return (
    <GestureHandlerRootView style={s.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({ root: { flex: 1 } });
