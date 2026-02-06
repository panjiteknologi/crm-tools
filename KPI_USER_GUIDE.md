# Panduan Penggunaan KPI Annual Tracker

## Overview
KPI Annual Tracker adalah fitur untuk mengelola Key Performance Indicator tahunan dengan kemampuan merge cells dan timeline coloring seperti Excel.

Dibuat menggunakan **native HTML Table** dengan React (bukan Handsontable) untuk performa yang lebih baik dan kontrol penuh over styling.

## Cara Mengakses
1. Login ke sistem
2. Buka sidebar navigation
3. Klik menu **"KPI Tracker"** (ikon 🏆)
4. Anda akan diarahkan ke halaman: `http://localhost:3000/dashboard-manager/kpi`

## Fitur Utama

### 1. Membuat KPI Baru
- Klik tombol **"Buat KPI Baru"** di bagian atas
- Isi form:
  - **Nama KPI**: Contoh: "Sales Performance 2025"
  - **Tahun**: Pilih tahun dari dropdown (2020-2030)
  - **Nama Karyawan**: Masukkan nama lengkap karyawan
- Klik **"Buat"** untuk membuat tabel KPI baru

### 2. Struktur Tabel KPI
Tabel KPI memiliki kolom-kolom berikut:
- **No**: Nomor urut (auto, read-only)
- **KRA**: Key Result Area (kategori utama)
- **KPI**: Key Performance Indicator (indikator spesifik)
- **Target**: Target yang harus dicapai
- **Bobot**: Persentase bobot (contoh: 20%)
- **Jan-Des**: Kolom bulan untuk timeline
- **Realisasi**: Hasil aktual
- **%**: Persentase pencapaian
- **Score**: Nilai akhir

### 3. Merge Cells (Menggabungkan Cell)
Merge cells berguna untuk menggabungkan KRA yang sama:

**Langkah-langkah:**
1. **Pilih cell pertama** yang ingin digabungkan
2. **Tahan Shift dan klik** cell terakhir untuk memilih range (multi-select)
3. Klik tombol **"Merge Cells"** di toolbar
4. Cell akan tergabung menjadi satu

**Contoh penggunaan:**
- Merge cell di kolom "KRA" untuk KPI yang memiliki KRA sama
- Merge cell di kolom "Target" atau "Bobot"

**Tips:** Cell yang terseleksi akan memiliki border biru (ring)

### 4. Mewarnai Timeline
Warnai cell bulan untuk menandai progress:

**Warna yang tersedia:**
- 🟢 **Completed** (Hijau) - Target sudah tercapai
- 🔵 **In Progress** (Biru) - Sedang dikerjakan
- 🟡 **Planning** (Kuning) - Masih perencanaan
- 🔴 **Delayed** (Merah) - Terlambat dari jadwal
- 🟣 **On Hold** (Ungu) - Ditunda
- ⚪ **Clear** (Transparan) - Menghapus warna

**Langkah-langkah:**
1. Pilih atau block cell di kolom bulan (Jan-Des)
2. Klik tombol **"Warnai Cell"** di toolbar
3. Pilih warna yang sesuai dengan status
4. Cell akan berubah warna sesuai pilihan

### 5. Edit Data
- **Double-click** pada cell untuk mengedit isinya
- Ketik untuk mengubah value
- Tekan **Enter** untuk simpan, **Escape** untuk batal
- Header (baris pertama) dan kolom No bersifat read-only
- Semua cell lain bisa diedit

### 6. Menambah Baris
- Klik tombol **"Tambah Baris"** di toolbar
- Baris baru akan ditambahkan di bagian bawah

### 7. Menghapus Baris
1. Klik pada nomor baris yang ingin dihapus
2. Klik tombol **"Hapus Baris"** di toolbar

### 9. Mengelola Multiple KPI
- Gunakan dropdown **"Pilih KPI"** di bagian atas untuk berpindah antar tabel KPI
- Badge akan menampilkan tahun dan nama karyawan
- Klik ikon 🗑️ untuk menghapus tabel KPI

### 10. Import & Export
- **Import Excel**: Klik tombol "Import Excel" untuk mengimpor dari file Excel
- **Export**: Klik tombol "Export" untuk mengekspor ke format Excel

## Contoh Penggunaan

### Contoh 1: KPI Sales
```
No | KRA                | KPI                      | Target        | Bobot |
1  | Business Growth    | Revenue Growth           | Rp 1 Miliar   | 20%   |
   |                    | New Customer Acquisition | 50 Customers  | 15%   |
2  | Customer Service   | Customer Satisfaction    | 4.5/5         | 15%   |
```

### Contoh 2: Timeline Progress
- **Jan**: 🟢 Completed (Revenue tercapai)
- **Feb**: 🔵 In Progress (Sedang meng chase new customers)
- **Mar**: 🟡 Planning (Masih perencanaan campaign)
- **Apr**: 🔴 Delayed (Campaign terlambat)

## Tips & Best Practices

1. **Merge KRA**: Selalu merge cell KRA untuk KPI yang sejenis agar mudah dibaca
2. **Consistent Timeline**: Gunakan warna yang konsisten untuk status yang sama
3. **Auto Calculate**: Kolom "%" dan "Score" bisa dihitung secara manual
4. **Backup**: Export data secara berkala untuk backup
5. **Multiple KPI**: Buat KPI terpisah untuk setiap karyawan dan tahun

## Keyboard Shortcuts
- **Click**: Pilih cell
- **Shift + Click**: Seleksi multiple cell (range selection)
- **Double Click**: Edit cell
- **Enter**: Simpan edit
- **Escape**: Batal edit

## Troubleshooting

### Issue: Tidak bisa merge cells
**Solution**: Pilih minimal 2 cell dengan Shift+Click sebelum mengklik tombol Merge Cells

### Issue: Warna tidak berubah
**Solution**: Pilih cell terlebih dahulu (klik), lalu pilih warna dari dropdown

### Issue: Data hilang saat refresh
**Solution**: Saat ini data hanya tersimpan di memory. Fitur persistence akan ditambahkan nanti.

### Issue: Tampilan tidak responsive
**Solution**: Table memiliki overflow-x scroll untuk layar kecil. Pastikan browser window tidak terlalu kecil.

## Future Enhancements
- [ ] Simpan ke database (Convex)
- [ ] Auto-calculate realisasi dan score
- [ ] Template KPI yang bisa dipilih
- [ ] Export ke PDF
- [ ] Comment/notes per cell
- [ ] Revision history

---

**Dibuat dengan ❤️ menggunakan Handsontable & Next.js**
