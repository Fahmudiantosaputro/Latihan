import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, API_BASE } from '../../constants/theme';

export default function ProfilScreen() {
  const router = useRouter();
  const [user, setUser] = useState({ name: 'Warga', email: '' });
  const [stats, setStats] = useState({ total: 0, kategori: 0 });

  useEffect(() => {
    AsyncStorage.getItem('@lk_user').then(r => { if (r) setUser(JSON.parse(r)); });
    fetch(`${API_BASE}/api/get_laporan.php`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setStats({ total: data.length, kategori: new Set(data.map((x: any) => x.kategori)).size });
    }).catch(() => {});
  }, []);

  function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => { await AsyncStorage.removeItem('@lk_user'); router.replace('/(auth)/login'); } },
    ]);
  }

  const statItems = [
    { n: stats.total, l: 'Total Laporan' },
    { n: stats.kategori, l: 'Kategori Aktif' },
    { n: stats.total, l: 'Laporan Aktif' },
  ];

  const menuItems = [
    { icon: 'shield-checkmark-outline' as const, label: 'Keamanan Akun', sub: 'Ubah kata sandi', onPress: () => router.push('/(auth)/forgot') },
    { icon: 'notifications-outline' as const, label: 'Notifikasi', sub: 'Atur preferensi notifikasi', onPress: () => {} },
    { icon: 'help-circle-outline' as const, label: 'Bantuan & FAQ', sub: 'Pusat bantuan LaporKu', onPress: () => {} },
    { icon: 'information-circle-outline' as const, label: 'Tentang Aplikasi', sub: 'Versi Mobile 1.0.0', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <LinearGradient colors={['#1a3a8f', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
          <View style={s.ava}><Text style={s.avaLetter}>{user.name?.[0]?.toUpperCase() || 'W'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerName}>{user.name}</Text>
            <Text style={s.bannerEmail}>{user.email || 'Kontributor Aktif'}</Text>
          </View>
          <Pressable style={s.logoutBannerBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={14} color="#fff" />
            <Text style={s.logoutBannerTxt}>Keluar</Text>
          </Pressable>
          <Text style={s.deco}>🏙️</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={s.statsRow}>
          {statItems.map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statN}>{st.n}</Text>
              <Text style={s.statL}>{st.l}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          {menuItems.map((item, i) => (
            <Pressable key={i} style={[s.menuItem, i < menuItems.length - 1 && s.menuItemBorder]} onPress={item.onPress}>
              <View style={s.menuIco}><Ionicons name={item.icon} size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={C.muted} />
            </Pressable>
          ))}
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Ionicons name="shield-checkmark" size={16} color={C.primary} />
            <Text style={s.infoTitle}>Tentang LaporKU</Text>
          </View>
          <Text style={s.infoTxt}>Platform pelaporan masyarakat resmi Pemerintah Kota Surabaya. Setiap laporan ditindaklanjuti dalam 1×24 jam.</Text>
          <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>© 2025 Pemerintah Kota Surabaya · Versi Mobile 1.0.0</Text>
        </View>

        {/* Logout */}
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={17} color={C.danger} />
          <Text style={s.logoutTxt}>Keluar dari Akun</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },
  banner: { margin: 16, marginBottom: 0, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden', position: 'relative' },
  ava: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avaLetter: { fontSize: 20, fontWeight: '800', color: '#fff' },
  bannerName: { fontSize: 15, fontWeight: '800', color: '#fff' },
  bannerEmail: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  logoutBannerBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  logoutBannerTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  deco: { position: 'absolute', right: 14, bottom: -6, fontSize: 48, opacity: 0.15 },
  statsRow: { flexDirection: 'row', gap: 10, margin: 16, marginBottom: 0 },
  statCard: { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statN: { fontSize: 22, fontWeight: '800', color: C.primary },
  statL: { fontSize: 9, color: C.muted, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  menuCard: { backgroundColor: C.white, borderRadius: 16, margin: 16, marginBottom: 0, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuIco: { width: 34, height: 34, borderRadius: 9, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  menuLabel: { fontSize: 13, fontWeight: '700', color: C.text },
  menuSub: { fontSize: 11, color: C.muted, marginTop: 1 },
  infoCard: { backgroundColor: C.white, borderRadius: 16, margin: 16, marginBottom: 0, padding: 18, borderWidth: 1, borderColor: C.border },
  infoTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  infoTxt: { fontSize: 13, color: C.muted, lineHeight: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, borderRadius: 12, height: 48, backgroundColor: C.dangerBg, borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.25)' },
  logoutTxt: { fontSize: 14, fontWeight: '700', color: C.danger },
});
