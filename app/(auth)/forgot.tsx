import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Dimensions, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, API_BASE } from '../../constants/theme';
import { Image } from 'react-native';

const { width, height } = Dimensions.get('window');
const BG = require('../../assets/bg.jpg');

export default function ForgotScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) { setError('Email wajib diisi'); return; }
    setLoading(true);
    try {
      const fd = new FormData(); fd.append('email', email.trim());
      await fetch(`${API_BASE}/auth/process_forgot.php`, { method: 'POST', body: fd });
      setSent(true);
    } catch { Alert.alert('Error', 'Gagal mengirim.'); }
    finally { setLoading(false); }
  }

  return (
    <ImageBackground source={BG} style={{ flex: 1, width, minHeight: height }} resizeMode="cover">
      <LinearGradient colors={['rgba(5,8,20,0.60)', 'rgba(10,15,40,0.52)']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <BlurView intensity={40} tint="dark" style={s.card}>
            <View style={s.cardInner}>
              <Pressable style={s.back} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.6)" />
                <Text style={s.backTxt}>Kembali</Text>
              </Pressable>
              <View style={s.logoWrap}>
                <Image
                  source={require('../../assets/LogoLaporKu.jpg')}
                  style={{ width: 175, height: 70 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={s.heading}>Lupa Kata Sandi?</Text>
              <Text style={s.subtitle}>Masukkan email kamu untuk mendapatkan instruksi reset kata sandi.</Text>
              {sent ? (
                <View style={s.successBox}>
                  <Ionicons name="checkmark-circle" size={20} color="#86efac" />
                  <Text style={s.successTxt}>Instruksi reset telah dikirim. Cek inbox & folder spam kamu.</Text>
                </View>
              ) : (
                <>
                  <Text style={s.label}>Alamat Email</Text>
                  <View style={[s.field, !!error && s.fieldErr]}>
                    <Ionicons name="mail-outline" size={15} color="rgba(255,255,255,0.45)" />
                    <TextInput style={s.fi} placeholder="contoh@email.com" placeholderTextColor="rgba(255,255,255,0.3)" value={email} onChangeText={v => { setEmail(v); setError(''); }} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                  {!!error && <Text style={s.ferr}>{error}</Text>}
                  <Pressable onPress={handleSend} disabled={loading} style={[s.btn, { marginTop: 16 }]}>
                    <LinearGradient colors={['#4f8ef7', '#7c5cf7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btnGrad}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Kirim Instruksi Reset</Text>}
                    </LinearGradient>
                  </Pressable>
                </>
              )}
              <Pressable onPress={() => router.replace('/(auth)/login')} style={{ alignItems: 'center', marginTop: 14 }}>
                <Text style={s.link}>← Kembali ke login</Text>
              </Pressable>
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
  heading: { textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.48)', marginBottom: 22, lineHeight: 18 },
  label: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', height: 46, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, gap: 8 },
  fieldErr: { borderColor: 'rgba(239,68,68,0.65)' },
  fi: { flex: 1, color: '#fff', fontSize: 14 },
  ferr: { fontSize: 11, color: '#fca5a5', marginTop: 3, paddingLeft: 2 },
  successBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)', borderRadius: 12, padding: 14, marginBottom: 14 },
  successTxt: { flex: 1, color: '#86efac', fontSize: 13, lineHeight: 19 },
  btn: { borderRadius: 13, overflow: 'hidden', marginBottom: 4 },
  btnGrad: { height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { fontSize: 13, color: '#7ab4ff', fontWeight: '600' },
});
