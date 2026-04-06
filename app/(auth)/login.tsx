import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ImageBackground,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, API_BASE } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
const BG = require('../../assets/bg.jpg');

function GlassField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secure = false,
  keyboardType = 'default',
  error,
}: any) {
  const [show, setShow] = useState(false);

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>

      <View style={[s.field, error ? s.fieldErr : null]}>
        <Ionicons name={icon} size={15} color="rgba(255,255,255,0.45)" />

        <TextInput
          style={s.fieldInput}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !show}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          importantForAutofill="yes"
          textContentType={secure ? 'password' : 'emailAddress'}
        />

        {secure && (
          <Pressable onPress={() => setShow(v => !v)}>
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={17}
              color="rgba(255,255,255,0.4)"
            />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={s.ferr}>{error}</Text>}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: any = {};
    if (!username.trim()) e.username = 'Username atau email wajib diisi';
    if (!password.trim()) e.password = 'Kata sandi wajib diisi';
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function handleLogin() {
    console.log('=== TOMBOL MASUK DIKLIK ===');  // ← tambah ini
    if (!validate()) {
      console.log('Validasi gagal');  // ← tambah ini
      return;
    }
    console.log('Validasi OK, mulai login...');  // ← tambah ini
    setLoading(true);
    
    if (!validate()) return;
    setLoading(true);

    try {
      console.log('Mencoba login ke:', `${API_BASE}/api/auth/login`);

      // ─── 1. Kirim request ke server ───
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      console.log('Status response:', res.status);

      // ─── 2. Baca response ───
      const text = await res.text();
      console.log('Response server:', text);

      if (!text) {
        Alert.alert('Login gagal', 'Server tidak memberikan respon');
        return;
      }

      // ─── 3. Parse JSON ───
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        Alert.alert('Login gagal', 'Format respon server bukan JSON:\n' + text);
        return;
      }

      // ─── 4. Cek status response ───
      if (json.status === 'success') {

        // ─── 5. Simpan data user & token ───
        await AsyncStorage.setItem('@lk_user', JSON.stringify({
          name: json.user.name || 'Warga',
          email: json.user.email || '',
          picture: json.user.avatar || '',
        }));

        await AsyncStorage.setItem('@lk_token', json.token || '');

        console.log('Login berhasil, navigasi ke beranda...');

        // ─── 6. Navigasi ke dashboard ───
        router.replace('/(tabs)/beranda');

      } else {
        Alert.alert('Login gagal', json.message || 'Username atau password salah');
      }

    } catch (err) {
      console.log('Error login:', err);
      Alert.alert(
        'Koneksi Gagal',
        `Tidak bisa terhubung ke server.\nPastikan server Node.js sudah jalan.\n\nAPI: ${API_BASE}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={BG} style={s.bg} resizeMode="cover">
      <LinearGradient
        colors={['rgba(5,8,20,0.60)', 'rgba(10,15,40,0.52)']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={40} tint="dark" style={s.card}>
            <View style={s.cardInner}>

              <View style={s.logoWrap}>
                <Image
                  source={require('../../assets/LogoLaporKu.jpg')}
                  style={{ width: 175, height: 50 }}
                  resizeMode="contain"
                />
              </View>

              <Text style={s.heading}>Selamat Datang</Text>
              <Text style={s.subtitle}>Masuk ke platform pelaporan warga Surabaya</Text>

              <GlassField
                label="Username / Email"
                icon="person-outline"
                placeholder="contoh@email.com"
                value={username}
                onChangeText={(v: string) => {
                  setUsername(v);
                  setErrors((e: any) => ({ ...e, username: undefined }));
                }}
                error={errors.username}
                keyboardType="email-address"
              />

              <GlassField
                label="Kata Sandi"
                icon="lock-closed-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={(v: string) => {
                  setPassword(v);
                  setErrors((e: any) => ({ ...e, password: undefined }));
                }}
                error={errors.password}
                secure
              />

              <Pressable
                onPress={() => router.push('/(auth)/forgot')}
                style={{ alignItems: 'flex-end', marginTop: -6, marginBottom: 18 }}
              >
                <Text style={s.forgot}>Lupa kata sandi?</Text>
              </Pressable>

              <Pressable onPress={handleLogin} disabled={loading} style={s.btn}>
                <LinearGradient
                  colors={['#4f8ef7', '#7c5cf7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.btnText}>Masuk</Text>
                  )}
                </LinearGradient>
              </Pressable>

              <View style={s.row}>
                <Text style={s.rowTxt}>Belum punya akun? </Text>
                <Pressable onPress={() => router.push('/(auth)/register')}>
                  <Text style={s.link}>Daftar sekarang</Text>
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
  bg: { flex: 1, width, minHeight: height },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  cardInner: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 28, paddingTop: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 10 },
  heading: { textAlign: 'center', fontSize: 26, fontWeight: '800', color: C.white, marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.48)', marginBottom: 26, lineHeight: 19 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', height: 48, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 13, gap: 9 },
  fieldErr: { borderColor: 'rgba(239,68,68,0.65)' },
  fieldInput: { flex: 1, color: C.white, fontSize: 15 },
  ferr: { fontSize: 11, color: '#fca5a5', marginTop: 4, paddingLeft: 3 },
  forgot: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  btn: { borderRadius: 13, overflow: 'hidden', marginBottom: 18 },
  btnGrad: { height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'center' },
  rowTxt: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  link: { fontSize: 13, color: '#7ab4ff', fontWeight: '700' },
});