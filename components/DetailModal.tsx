import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, API_BASE } from '../constants/theme';
import { Laporan } from '../app/(tabs)/beranda';

const CAT_COLOR: Record<string, string> = { Kecelakaan: C.kec, Kriminal: C.kri, 'Bencana Alam': C.ben, Pembangunan: C.pem, Lainnya: C.lain };

function fmt(ts: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Props { item: Laporan; onClose: () => void; onEdit: () => void; onDelete: () => void; }

export default function DetailModal({ item, onClose, onEdit, onDelete }: Props) {
  const imgUrl = item.gambar ? `${API_BASE}/api/uploads/${item.gambar.split('/').pop()}` : null;
  const col = CAT_COLOR[item.kategori] || C.muted;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable onPress={onClose} style={s.closeBtn}><Ionicons name="close" size={20} color={C.muted} /></Pressable>
          <Text style={s.title}>Detail Laporan</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {imgUrl && <Image source={{ uri: imgUrl }} style={s.photo} resizeMode="cover" />}
          <View style={{ marginBottom: 16 }}>
            <View style={{ backgroundColor: col + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: col }}>{item.kategori}</Text>
            </View>
            <Text style={s.detTitle}>{item.judul}</Text>
          </View>
          {[
            { label: 'Keterangan', value: item.keterangan },
            { label: 'Pelapor', value: item.nama },
            { label: 'No HP', value: item.nohp || '—' },
            { label: 'Tanggal', value: fmt(item.tanggal) },
          ].map((r, i, arr) => (
            <View key={i} style={[s.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowValue}>{r.value}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={s.footer}>
          <Pressable style={s.cancelBtn} onPress={onClose}><Text style={s.cancelTxt}>Tutup</Text></Pressable>
          <Pressable style={s.editBtn} onPress={onEdit}>
            <Ionicons name="pencil" size={14} color={C.primary} />
            <Text style={s.editTxt}>Edit</Text>
          </Pressable>
          <Pressable style={s.delBtn} onPress={onDelete}>
            <Ionicons name="trash" size={14} color="#fff" />
            <Text style={s.delTxt}>Hapus</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: C.text },
  body: { padding: 18, paddingBottom: 24 },
  photo: { width: '100%', height: 190, borderRadius: 12, marginBottom: 18 },
  detTitle: { fontSize: 20, fontWeight: '800', color: C.text, lineHeight: 27 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', gap: 12 },
  rowLabel: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, width: 86, flexShrink: 0, paddingTop: 1 },
  rowValue: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
  footer: { flexDirection: 'row', gap: 10, padding: 18, borderTopWidth: 1, borderTopColor: C.border },
  cancelBtn: { flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: C.muted },
  editBtn: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: C.primaryBg, borderWidth: 1.5, borderColor: C.primary },
  editTxt: { fontSize: 14, fontWeight: '700', color: C.primary },
  delBtn: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: C.danger },
  delTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
