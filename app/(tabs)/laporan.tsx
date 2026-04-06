import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, Alert, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, API_BASE } from '../../constants/theme';
import { Laporan } from './beranda';
import FormModal from '../../components/FormModal';
import DetailModal from '../../components/DetailModal';

const CAT_ICO: Record<string, string> = {
  Kecelakaan: '🚨', Kriminal: '🔒',
  'Bencana Alam': '🌊', Pembangunan: '🏗️', Lainnya: '📋'
};
const CAT_COLOR: Record<string, string> = {
  Kecelakaan: C.kec, Kriminal: C.kri,
  'Bencana Alam': C.ben, Pembangunan: C.pem, Lainnya: C.lain
};

function ago(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (isNaN(m) || m < 0) return '—';
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default function LaporanSayaScreen() {
  const [data, setData] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editItem, setEditItem] = useState<Laporan | undefined>();
  const [detailItem, setDetailItem] = useState<Laporan | undefined>();
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', ok: true });
  const timer = useRef<any>();

  useEffect(() => { load(); }, []);

  // ─── Toast helper — HARUS didefinisikan sebelum fungsi lain ───
  function showToast(msg: string, ok = true) {
    clearTimeout(timer.current);
    setToast({ show: true, msg, ok });
    timer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  // ─── Load data dari Node.js server ───
  async function load() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@lk_token');
      const res = await fetch(`${API_BASE}/api/laporan`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      setData(Array.isArray(json.data) ? json.data : []);
    } catch {
      showToast('Gagal memuat data', false);
    } finally {
      setLoading(false);
    }
  }

  // ─── Hapus laporan ───
  async function doDelete(id: string) {
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem('@lk_token');
      const res = await fetch(`${API_BASE}/api/laporan/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast('Laporan berhasil dihapus');
        load();
        if (detailItem?.id === id) setDetailItem(undefined);
      } else {
        showToast('Gagal hapus: ' + (json.message || ''), false);
      }
    } catch {
      showToast('Koneksi gagal', false);
    } finally {
      setDeleting(false);
      setDelTarget(null);
    }
  }

  // ─── Simpan / Edit laporan ───
  async function doSave(fields: Partial<Laporan>, imageUri?: string) {
    try {
      const token = await AsyncStorage.getItem('@lk_token');
      const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};

      const fd = new FormData();
      fd.append('judul', fields.judul || '');
      fd.append('kategori', fields.kategori || '');
      fd.append('keterangan', fields.keterangan || '');
      fd.append('nama', fields.nama || '');
      fd.append('nohp', fields.nohp || '');

      if (imageUri) {
        const name = imageUri.split('/').pop() || 'photo.jpg';
        fd.append('gambar', { uri: imageUri, name, type: 'image/jpeg' } as any);
      }

      // Edit pakai PUT, baru pakai POST
      const isEdit = !!fields.id;
      const url = isEdit ? `${API_BASE}/api/laporan/${fields.id}` : `${API_BASE}/api/laporan`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: fd });
      const json = await res.json();

      if (json.status !== 'success') throw new Error(json.message || 'Gagal simpan');

      showToast(isEdit ? 'Laporan diperbarui ✓' : 'Laporan berhasil disimpan ✓');
      load();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan laporan', false);
      throw err;
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Laporan Saya 📋</Text>
          <Text style={s.headerSub}>Semua laporan yang telah kamu buat</Text>
        </View>
        <Pressable
          onPress={() => { setEditItem(undefined); setFormVisible(true); }}
          style={{ borderRadius: 10, overflow: 'hidden' }}
        >
          <LinearGradient colors={[C.accent, '#e0951b']} style={s.addBtn}>
            <Ionicons name="add" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* List laporan */}
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} colors={[C.primary]} tintColor={C.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const col = CAT_COLOR[item.kategori] || C.muted;
          return (
            <Pressable style={s.card} onPress={() => setDetailItem(item)}>
              <View style={s.thumb}>
                {item.gambar
                  ? <Image source={{ uri: `${API_BASE}/uploads/${item.gambar.split('/').pop()}` }} style={s.thumbImg} />
                  : <Text style={{ fontSize: 26 }}>{CAT_ICO[item.kategori] || '📋'}</Text>
                }
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.judul}</Text>
                <Text style={s.cardMeta}>{item.nama} · {ago(item.tanggal)}</Text>
                <View style={{
                  backgroundColor: col + '20', paddingHorizontal: 7,
                  paddingVertical: 2, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: col }}>{item.kategori}</Text>
                </View>
              </View>
              <Pressable style={s.delBtn} onPress={() => setDelTarget(item.id)} hitSlop={6}>
                <Ionicons name="trash-outline" size={14} color={C.danger} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={!loading ? (
          <View style={s.empty}>
            <View style={s.emptyIco}>
              <Text style={{ fontSize: 34 }}>📋</Text>
            </View>
            <Text style={s.emptyTitle}>Belum ada laporan</Text>
            <Text style={s.emptyDesc}>Kamu belum membuat laporan apapun.</Text>
            <Pressable
              style={s.emptyBtn}
              onPress={() => { setEditItem(undefined); setFormVisible(true); }}
            >
              <Text style={s.emptyBtnTxt}>Buat Laporan Pertama</Text>
            </Pressable>
          </View>
        ) : null}
      />

      {/* Modal Form */}
      <FormModal
        visible={formVisible}
        editItem={editItem}
        onClose={() => { setFormVisible(false); setEditItem(undefined); }}
        onSave={doSave}
      />

      {/* Modal Detail */}
      {detailItem && (
        <DetailModal
          item={detailItem}
          onClose={() => setDetailItem(undefined)}
          onEdit={() => { setDetailItem(undefined); setEditItem(detailItem); setFormVisible(true); }}
          onDelete={() => { setDelTarget(detailItem.id); setDetailItem(undefined); }}
        />
      )}

      {/* Modal Konfirmasi Hapus */}
      <Modal visible={!!delTarget} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.confirm}>
            <Text style={{ fontSize: 38, marginBottom: 10 }}>🗑️</Text>
            <Text style={s.confirmTitle}>Hapus Laporan?</Text>
            <Text style={s.confirmDesc}>Tindakan ini tidak dapat dibatalkan.</Text>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Pressable style={s.cancelBtn} onPress={() => setDelTarget(null)}>
                <Text style={s.cancelTxt}>Batal</Text>
              </Pressable>
              <Pressable
                style={s.delConfirmBtn}
                onPress={() => delTarget && doDelete(delTarget)}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Ya, Hapus</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast notifikasi */}
      {toast.show && (
        <View style={[s.toast, { backgroundColor: toast.ok ? '#111827' : C.danger }]}>
          <Text style={{ color: toast.ok ? C.success : '#fff', fontWeight: '800', fontSize: 14 }}>
            {toast.ok ? '✓' : '✕'}
          </Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', flex: 1 }}>
            {toast.msg}
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: C.white, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
  thumb: { width: 58, height: 58, borderRadius: 9, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  cardMeta: { fontSize: 10, color: C.muted },
  delBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIco: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: C.muted, marginBottom: 20 },
  emptyBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirm: { backgroundColor: C.white, borderRadius: 22, padding: 28, alignItems: 'center', width: '100%', maxWidth: 300 },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },
  confirmDesc: { fontSize: 13, color: C.muted, marginBottom: 22, textAlign: 'center' },
  cancelBtn: { flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
  cancelTxt: { fontSize: 14, fontWeight: '700', color: C.muted },
  delConfirmBtn: { flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: C.danger },
  toast: { position: 'absolute', bottom: 28, left: 16, right: 16, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 9999 },
});