import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { C } from '../constants/theme';
import { Laporan } from '../app/(tabs)/beranda';

const CATS = ['Kecelakaan', 'Kriminal', 'Bencana Alam', 'Pembangunan', 'Lainnya'];
const CAT_ICO: Record<string, string> = { Kecelakaan: '🚨', Kriminal: '🔒', 'Bencana Alam': '🌊', Pembangunan: '🏗️', Lainnya: '📋' };
const empty = { judul: '', kategori: '', keterangan: '', nama: '', nohp: '' };

interface Props { visible: boolean; editItem?: Laporan; onClose: () => void; onSave: (f: Partial<Laporan>, img?: string) => Promise<void>; }

export default function FormModal({ visible, editItem, onClose, onSave }: Props) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<any>({});
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editItem) { setForm({ judul: editItem.judul, kategori: editItem.kategori, keterangan: editItem.keterangan, nama: editItem.nama, nohp: editItem.nohp || '' }); }
      else setForm(empty);
      setImageUri(undefined); setErrors({});
    }
  }, [visible, editItem]);

  const set = (k: string) => (v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors((e: any) => ({ ...e, [k]: undefined })); };

  function validate() {
    const e: any = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi';
    if (!form.kategori) e.kategori = 'Pilih kategori';
    if (!form.keterangan.trim()) e.keterangan = 'Keterangan wajib diisi';
    if (!form.nama.trim()) e.nama = 'Nama pelapor wajib diisi';
    setErrors(e); return !Object.keys(e).length;
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Izin diperlukan', 'Izinkan akses galeri.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try { await onSave({ ...form, id: editItem?.id }, imageUri); onClose(); }
    catch (e: any) { Alert.alert('Gagal', e.message || 'Terjadi kesalahan.'); }
    finally { setSaving(false); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable onPress={onClose} style={s.closeBtn}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
          <Text style={s.title}>{editItem ? 'Edit Laporan' : 'Buat Laporan Baru'}</Text>
          <Pressable onPress={handleSave} disabled={saving} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            {saving ? <ActivityIndicator size="small" color={C.primary} /> : <Text style={{ fontSize: 14, fontWeight: '700', color: C.primary }}>Simpan</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Judul */}
          <View style={s.fg}>
            <Text style={s.label}>Judul Laporan <Text style={{ color: C.accent }}>*</Text></Text>
            <TextInput style={[s.input, errors.judul && s.inputErr]} placeholder="Contoh: Jalan Rusak di Jl. Pemuda" placeholderTextColor={C.muted} value={form.judul} onChangeText={set('judul')} />
            {!!errors.judul && <Text style={s.ferr}>{errors.judul}</Text>}
          </View>

          {/* Kategori */}
          <View style={s.fg}>
            <Text style={s.label}>Kategori <Text style={{ color: C.accent }}>*</Text></Text>
            <View style={s.catGrid}>
              {CATS.map(cat => {
                const active = form.kategori === cat;
                return (
                  <Pressable key={cat} style={[s.catChip, active && s.catChipActive]} onPress={() => { setForm(f => ({ ...f, kategori: cat })); setErrors((e: any) => ({ ...e, kategori: undefined })); }}>
                    <Text style={{ fontSize: 12 }}>{CAT_ICO[cat]}</Text>
                    <Text style={[s.catTxt, active && s.catTxtActive]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!!errors.kategori && <Text style={s.ferr}>{errors.kategori}</Text>}
          </View>

          {/* Nama & HP */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={[s.fg, { flex: 1 }]}>
              <Text style={s.label}>Nama Pelapor <Text style={{ color: C.accent }}>*</Text></Text>
              <TextInput style={[s.input, errors.nama && s.inputErr]} placeholder="Nama lengkap" placeholderTextColor={C.muted} value={form.nama} onChangeText={set('nama')} />
              {!!errors.nama && <Text style={s.ferr}>{errors.nama}</Text>}
            </View>
            <View style={[s.fg, { flex: 1 }]}>
              <Text style={s.label}>Nomor HP</Text>
              <TextInput style={s.input} placeholder="08xxxxxxxxxx" placeholderTextColor={C.muted} value={form.nohp} onChangeText={set('nohp')} keyboardType="phone-pad" />
            </View>
          </View>

          {/* Keterangan */}
          <View style={s.fg}>
            <Text style={s.label}>Keterangan <Text style={{ color: C.accent }}>*</Text></Text>
            <TextInput style={[s.input, s.textarea, errors.keterangan && s.inputErr]} placeholder="Jelaskan detail kejadian, lokasi, waktu..." placeholderTextColor={C.muted} value={form.keterangan} onChangeText={set('keterangan')} multiline numberOfLines={4} textAlignVertical="top" />
            {!!errors.keterangan && <Text style={s.ferr}>{errors.keterangan}</Text>}
          </View>

          {/* Foto */}
          <View style={s.fg}>
            <Text style={s.label}>Foto Bukti</Text>
            {imageUri ? (
              <View style={{ borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
                <Pressable style={s.rmImg} onPress={() => setImageUri(undefined)}><Ionicons name="close" size={16} color="#fff" /></Pressable>
              </View>
            ) : (
              <Pressable style={s.upload} onPress={pickImage}>
                <Ionicons name="image-outline" size={30} color={C.muted} />
                <Text style={{ fontSize: 13, color: C.muted, fontWeight: '600', marginTop: 6 }}>Ketuk untuk pilih foto</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>JPG, PNG — maks. 5MB</Text>
              </Pressable>
            )}
          </View>

          {/* Save button */}
          <Pressable onPress={handleSave} disabled={saving} style={{ borderRadius: 12, overflow: 'hidden', marginTop: 8 }}>
            <LinearGradient colors={[C.primary, '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 50, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark" size={16} color="#fff" /><Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{editItem ? 'Perbarui Laporan' : 'Simpan Laporan'}</Text></>}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.text },
  body: { padding: 18, paddingBottom: 40 },
  fg: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 7 },
  input: { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: C.text },
  inputErr: { borderColor: C.danger },
  textarea: { minHeight: 95, paddingTop: 11 },
  ferr: { fontSize: 11, color: C.danger, marginTop: 4, paddingLeft: 2 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 30, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  catChipActive: { backgroundColor: C.primaryBg, borderColor: C.primary },
  catTxt: { fontSize: 12, fontWeight: '700', color: C.muted },
  catTxtActive: { color: C.primary },
  upload: { borderWidth: 2, borderStyle: 'dashed', borderColor: C.border, borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: C.bg },
  rmImg: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
});
