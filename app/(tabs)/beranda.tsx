import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  RefreshControl, ScrollView, Image, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, API_BASE } from '../../constants/theme';
import FormModal from '../../components/FormModal';
import DetailModal from '../../components/DetailModal';

export interface Laporan {
  id: string; judul: string; kategori: string;
  keterangan: string; nama: string; nohp?: string;
  gambar?: string; tanggal: string;
}

const CATS = ['Semua', 'Kecelakaan', 'Kriminal', 'Bencana Alam', 'Pembangunan', 'Lainnya'];
const CAT_COLOR: Record<string, string> = {
  Kecelakaan: C.kec, Kriminal: C.kri,
  'Bencana Alam': C.ben, Pembangunan: C.pem, Lainnya: C.lain
};
const CAT_ICO: Record<string, string> = {
  Kecelakaan: '🚨', Kriminal: '🔒',
  'Bencana Alam': '🌊', Pembangunan: '🏗️', Lainnya: '📋'
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

function Badge({ kat }: { kat: string }) {
  const bg  = CAT_COLOR[kat] ? CAT_COLOR[kat] + '20' : '#9ca3af20';
  const col = CAT_COLOR[kat] || C.muted;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: col }}>{kat}</Text>
    </View>
  );
}

export default function BerandaScreen() {
  const [data,        setData]        = useState<Laporan[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [filter,      setFilter]      = useState('Semua');
  const [search,      setSearch]      = useState('');
  const [userName,    setUserName]    = useState('W');
  const [toast,       setToast]       = useState({ show: false, msg: '', ok: true });
  const [formVisible, setFormVisible] = useState(false);
  const [editItem,    setEditItem]    = useState<Laporan | undefined>();
  const [detailItem,  setDetailItem]  = useState<Laporan | undefined>();
  const [delTarget,   setDelTarget]   = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const timer = useRef<any>();

  useEffect(() => {
    load();
    AsyncStorage.getItem('@lk_user').then(r => {
      if (r) {
        const u = JSON.parse(r);
        setUserName(u.name?.[0]?.toUpperCase() || 'W');
      }
    });
  }, []);

  // ─── Toast helper ───
  function showToast(msg: string, ok = true) {
    clearTimeout(timer.current);
    setToast({ show: true, msg, ok });
    timer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  // ─── GET semua laporan — Node.js ───
  async function load() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('@lk_token');
      const res   = await fetch(`${API_BASE}/api/laporan`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const json = await res.json();
      // Node.js mengembalikan { status, data: [...] }
      setData(Array.isArray(json.data) ? json.data : []);
    } catch {
      showToast('Gagal memuat data dari server', false);
    } finally {
      setLoading(false);
    }
  }

  const filtered = data.filter(r => {
    if (filter !== 'Semua' && r.kategori !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [r.judul, r.keterangan, r.nama].some(f => f?.toLowerCase().includes(q));
    }
    return true;
  });

  const stats = [
    { ico: '📋', lbl: 'Total',      n: data.length,                                      col: C.primary },
    { ico: '🚨', lbl: 'Kecelakaan', n: data.filter(x => x.kategori === 'Kecelakaan').length, col: C.kec },
    { ico: '🔒', lbl: 'Kriminal',   n: data.filter(x => x.kategori === 'Kriminal').length,   col: C.kri },
    { ico: '🌊', lbl: 'Bencana',    n: data.filter(x => x.kategori === 'Bencana Alam').length,col: C.ben },
  ];

  // ─── DELETE laporan — Node.js ───
  async function doDelete(id: string) {
    setDeleting(true);
    try {
      const token = await AsyncStorage.getItem('@lk_token');
      const res   = await fetch(`${API_BASE}/api/laporan/${id}`, {
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
      showToast('Gagal terhubung ke server', false);
    } finally {
      setDeleting(false);
      setDelTarget(null);
    }
  }

  // ─── POST/PUT laporan — Node.js ───
  async function doSave(fields: Partial<Laporan>, imageUri?: string) {
    try {
      const token   = await AsyncStorage.getItem('@lk_token');
      const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};

      const fd = new FormData();
      fd.append('judul',      fields.judul      || '');
      fd.append('kategori',   fields.kategori   || '');
      fd.append('keterangan', fields.keterangan || '');
      fd.append('nama',       fields.nama       || '');
      fd.append('nohp',       fields.nohp       || '');

      if (imageUri) {
        const name = imageUri.split('/').pop() || 'photo.jpg';
        fd.append('gambar', { uri: imageUri, name, type: 'image/jpeg' } as any);
      }

      // Edit pakai PUT, baru pakai POST
      const isEdit = !!fields.id;
      const url    = isEdit
        ? `${API_BASE}/api/laporan/${fields.id}`
        : `${API_BASE}/api/laporan`;
      const method = isEdit ? 'PUT' : 'POST';

      const res  = await fetch(url, { method, headers, body: fd });
      const json = await res.json();

      if (json.status !== 'success') throw new Error(json.message || 'Gagal simpan');

      showToast(isEdit ? 'Laporan diperbarui ✓' : 'Laporan berhasil disimpan ✓');
      load();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan', false);
      throw err;
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Topbar */}
      <View style={s.topbar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.ava}>
            <Text style={s.avaLetter}>{userName}</Text>
          </View>
          <View>
            <Text style={s.greeting}>Selamat Datang 👋</Text>
            <Text style={s.name}>Warga Surabaya</Text>
          </View>
        </View>
        <Pressable
          onPress={() => { setEditItem(undefined); setFormVisible(true); }}
          style={s.newBtnWrap}
        >
          <LinearGradient
            colors={[C.accent, '#e0951b']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.newBtn}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.newBtnTxt}>Laporan</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* List laporan */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} colors={[C.primary]} tintColor={C.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View>
            {/* Stats */}
            <View style={s.statsRow}>
              {stats.map(st => (
                <View key={st.lbl} style={s.statCard}>
                  <Text style={s.statIco}>{st.ico}</Text>
                  <Text style={[s.statN, { color: st.col }]}>{st.n}</Text>
                  <Text style={s.statLbl}>{st.lbl}</Text>
                </View>
              ))}
            </View>

            {/* Search */}
            <View style={s.search}>
              <Ionicons name="search-outline" size={15} color={C.muted} />
              <TextInput
                style={s.searchInput}
                placeholder="Cari laporan..."
                placeholderTextColor={C.muted}
                value={search}
                onChangeText={setSearch}
              />
              {!!search && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={C.muted} />
                </Pressable>
              )}
            </View>

            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 14 }}
              contentContainerStyle={{ gap: 7 }}
            >
              {CATS.map(cat => {
                const active = filter === cat;
                const col = cat === 'Semua' ? C.primary : (CAT_COLOR[cat] || C.muted);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setFilter(cat)}
                    style={[s.chip, active && { backgroundColor: col, borderColor: col }]}
                  >
                    {cat !== 'Semua' && (
                      <View style={[s.dot, { backgroundColor: active ? '#fff' : col }]} />
                    )}
                    <Text style={[s.chipTxt, active && { color: '#fff' }]}>{cat}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Section header */}
            <View style={s.secHead}>
              <Text style={s.secTitle}>Laporan Terbaru</Text>
              <View style={s.countBadge}>
                <Text style={s.countTxt}>{filtered.length} laporan</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => setDetailItem(item)}>
            <View style={s.thumb}>
              {item.gambar
                ? <Image
                    source={{ uri: `${API_BASE}/uploads/${item.gambar.split('/').pop()}` }}
                    style={s.thumbImg}
                  />
                : <Text style={{ fontSize: 26 }}>{CAT_ICO[item.kategori] || '📋'}</Text>
              }
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.cardTitle} numberOfLines={1}>{item.judul}</Text>
              <Text style={s.cardMeta}>{item.nama} · {ago(item.tanggal)}</Text>
              <Text style={s.cardDesc} numberOfLines={2}>{item.keterangan}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Badge kat={item.kategori} />
              <Pressable
                style={s.delBtn}
                onPress={() => setDelTarget(item.id)}
                hitSlop={4}
              >
                <Ionicons name="trash-outline" size={13} color={C.danger} />
              </Pressable>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={!loading ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>📭</Text>
            <Text style={s.emptyTitle}>Belum ada laporan</Text>
            <Text style={s.emptyDesc}>Jadilah yang pertama melapor!</Text>
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
                  : <Text style={s.delConfirmTxt}>Ya, Hapus</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
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
  safe:         { flex: 1, backgroundColor: C.bg },
  topbar:       { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 },
  ava:          { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primaryBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.primary + '33' },
  avaLetter:    { fontSize: 15, fontWeight: '800', color: C.primary },
  greeting:     { fontSize: 10, color: C.muted, fontWeight: '600' },
  name:         { fontSize: 14, fontWeight: '800', color: C.text },
  newBtnWrap:   { borderRadius: 10, overflow: 'hidden' },
  newBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 9 },
  newBtnTxt:    { color: '#fff', fontSize: 13, fontWeight: '700' },
  list:         { padding: 16, paddingBottom: 32 },
  statsRow:     { flexDirection: 'row', gap: 9, marginBottom: 14 },
  statCard:     { flex: 1, backgroundColor: C.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 2 },
  statIco:      { fontSize: 16 },
  statN:        { fontSize: 19, fontWeight: '800', lineHeight: 22 },
  statLbl:      { fontSize: 8, color: C.muted, fontWeight: '700', textAlign: 'center' },
  search:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.white, borderRadius: 30, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 14, color: C.text },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: C.white, borderRadius: 30, borderWidth: 1.5, borderColor: C.border },
  dot:          { width: 6, height: 6, borderRadius: 3 },
  chipTxt:      { fontSize: 11, fontWeight: '700', color: C.muted },
  secHead:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  secTitle:     { fontSize: 14, fontWeight: '800', color: C.text },
  countBadge:   { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 30, paddingHorizontal: 9, paddingVertical: 3 },
  countTxt:     { fontSize: 10, color: C.muted, fontWeight: '700' },
  card:         { backgroundColor: C.white, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border },
  thumb:        { width: 58, height: 58, borderRadius: 9, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexShrink: 0 },
  thumbImg:     { width: '100%', height: '100%' },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 3 },
  cardMeta:     { fontSize: 10, color: C.muted, marginBottom: 3 },
  cardDesc:     { fontSize: 11, color: '#555', lineHeight: 16 },
  delBtn:       { width: 26, height: 26, borderRadius: 7, backgroundColor: C.dangerBg, justifyContent: 'center', alignItems: 'center' },
  empty:        { alignItems: 'center', paddingVertical: 50 },
  emptyTitle:   { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptyDesc:    { fontSize: 13, color: C.muted },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirm:      { backgroundColor: C.white, borderRadius: 22, padding: 28, alignItems: 'center', width: '100%', maxWidth: 300 },
  confirmTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },
  confirmDesc:  { fontSize: 13, color: C.muted, marginBottom: 22, textAlign: 'center' },
  cancelBtn:    { flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: C.border },
  cancelTxt:    { fontSize: 14, fontWeight: '700', color: C.muted },
  delConfirmBtn:{ flex: 1, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: C.danger },
  delConfirmTxt:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  toast:        { position: 'absolute', bottom: 28, left: 16, right: 16, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 9999 },
});