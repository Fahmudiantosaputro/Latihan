import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ImageBackground, Dimensions, Alert, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, API_BASE } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
const BG = require('../../assets/bg.jpg');

function GlassField({ label, icon, placeholder, value, onChangeText, secure = false, keyboardType = 'default', error }: any) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ marginBottom: 13 }}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.field, error ? s.fieldErr : null]}>
        <Ionicons name={icon} size={15} color="rgba(255,255,255,0.45)" />
        <TextInput style={s.fi} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.3)" value={value} onChangeText={onChangeText} secureTextEntry={secure && !show} keyboardType={keyboardType} autoCapitalize="none" />
        {secure && <Pressable onPress={() => setShow(v => !v)} hitSlop={8}><Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={17} color="rgba(255,255,255,0.4)" /></Pressable>}
      </View>
      {!!error && <Text style={s.ferr}>{error}</Text>}
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors((e: any) => ({ ...e, [k]: undefined })); };

  function validate() {
    const e: any = {};
    if (!form.name.trim()) e.name = 'Nama wajib diisi';
    if (!form.email.trim()) e.email = 'Email wajib diisi';
    if (!form.password.trim()) e.password = 'Kata sandi wajib diisi';
    else if (form.password.length < 8) e.password = 'Minimal 8 karakter';
    if (form.password !== form.confirm) e.confirm = 'Kata sandi tidak cocok';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      console.log('Mencoba register ke:', `${API_BASE}/api/auth/register`);

      // ─── 1. Kirim request ke Node.js server ───
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirm: form.confirm,
        }),
      });

      console.log('Status response:', res.status);

      // ─── 2. Baca response ───
      const text = await res.text();
      console.log('Response server:', text);

      // ─── 3. Parse JSON ───
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        Alert.alert('Gagal', 'Format respon server bukan JSON:\n' + text);
        return;
      }

      // ─── 4. Cek status ───
      if (json.status === 'success') {
        // ─── 5. Simpan data user & token ───
        await AsyncStorage.setItem('@lk_user', JSON.stringify({
          name: json.user.name || 'Warga',
          email: json.user.email || '',
          picture: json.user.avatar || '',
        }));

        await AsyncStorage.setItem('@lk_token', json.token || '');

        console.log('Register berhasil, navigasi ke beranda...');

        // ─── 6. Navigasi ke beranda ───
        router.replace('/(tabs)/beranda');

      } else {
        Alert.alert('Gagal', json.message || 'Terjadi kesalahan.');
      }

    } catch (err) {
      console.log('Error register:', err);
      Alert.alert('Koneksi Gagal', `Tidak dapat terhubung ke server.\nAPI: ${API_BASE}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={BG} style={{ flex: 1, width, minHeight: height }} resizeMode="cover">
      <LinearGradient colors={['rgba(5,8,20,0.60)', 'rgba(10,15,40,0.52)']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BlurView intensity={40} tint="dark" style={s.card}>
            <View style={s.cardInner}>
              <Pressable style={s.back} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={s.backTxt}>Kembali</Text>
              </Pressable>
              <View style={s.logoWrap}>
                <Image
                  source={require('../../assets/LogoLaporKu.jpg')}
                  style={{ width: 175, height: 60 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={s.heading}>Buat Akun</Text>
              <Text style={s.subtitle}>Daftar dan mulai laporkan kejadian di sekitarmu</Text>
              <GlassField label="Nama Lengkap" icon="person-outline" placeholder="Nama lengkap kamu" value={form.name} onChangeText={set('name')} error={errors.name} />
              <GlassField label="Email" icon="mail-outline" placeholder="contoh@email.com" value={form.email} onChangeText={set('email')} error={errors.email} keyboardType="email-address" />
              <GlassField label="Kata Sandi" icon="lock-closed-outline" placeholder="Min. 8 karakter" value={form.password} onChangeText={set('password')} error={errors.password} secure />
              <GlassField label="Konfirmasi Kata Sandi" icon="lock-closed-outline" placeholder="Ulangi kata sandi" value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} secure />
              <Pressable onPress={handleRegister} disabled={loading} style={[s.btn, { marginTop: 4 }]}>
                <LinearGradient colors={['#4f8ef7', '#7c5cf7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Daftar Sekarang</Text>}
                </LinearGradient>
              </Pressable>
              <View style={s.row}>
                <Text style={s.rowTxt}>Sudah punya akun? </Text>
                <Pressable onPress={() => router.replace('/(auth)/login')}>
                  <Text style={s.link}>Masuk di sini</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  cardInner: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 28, paddingTop: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backTxt: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  logoWrap: { alignItems: 'center', marginBottom: 10 },
  logoCircle: { width: 54, height: 54, borderRadius: 15, backgroundColor: 'rgba(79,142,247,0.35)', borderWidth: 1.5, borderColor: 'rgba(79,142,247,0.55)', justifyContent: 'center', alignItems: 'center' },
  heading: { textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.48)', marginBottom: 22, lineHeight: 18 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  field: { flexDirection: 'row', alignItems: 'center', height: 46, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, gap: 8 },
  fieldErr: { borderColor: 'rgba(239,68,68,0.65)' },
  fi: { flex: 1, color: '#fff', fontSize: 14 },
  ferr: { fontSize: 11, color: '#fca5a5', marginTop: 3, paddingLeft: 2 },
  btn: { borderRadius: 13, overflow: 'hidden', marginBottom: 16 },
  btnGrad: { height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'center' },
  rowTxt: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  link: { fontSize: 13, color: '#7ab4ff', fontWeight: '700' },
});
