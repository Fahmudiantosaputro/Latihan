import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../constants/theme';

function Icon({ name, focused }: { name: any; focused: boolean }) {
  return (
    <View style={{ width: 40, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: focused ? C.primaryBg : 'transparent' }}>
      <Ionicons name={name} size={22} color={focused ? C.primary : C.muted} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: C.white,
        borderTopColor: C.border,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 84 : 64,
        paddingBottom: Platform.OS === 'ios' ? 26 : 8,
        paddingTop: 6,
        elevation: 10,
      },
      tabBarActiveTintColor: C.primary,
      tabBarInactiveTintColor: C.muted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
    }}>
      <Tabs.Screen name="beranda" options={{ title: 'Beranda', tabBarIcon: ({ focused }) => <Icon name="home" focused={focused} /> }} />
      <Tabs.Screen name="laporan" options={{ title: 'Laporan Saya', tabBarIcon: ({ focused }) => <Icon name="document-text" focused={focused} /> }} />
      <Tabs.Screen name="profil" options={{ title: 'Profil', tabBarIcon: ({ focused }) => <Icon name="person-circle" focused={focused} /> }} />
    </Tabs>
  );
}
