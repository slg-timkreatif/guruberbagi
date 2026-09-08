=====================================================
KONTEKS PROJECT: EKOSISTEM GURU BERBAGI SELOGIRI (v3)
=====================================================
[1. LATAR BELAKANG]
- Database akun GTK (±250 orang / 31 sekolah), migrasi dari GAS ke Supabase.
- Project ini PUSAT IDENTITAS semua aplikasi saya (SSO lite).
- Aplikasi baru WAJIB login via endpoint login-guru (Email + PIN);
  jangan buat sistem login guru terpisah.

[2. KREDENSIAL & ENDPOINT]
- URL  : https://qamqqwfzhyiihqyzliwq.supabase.co
- Anon : sb_publishable_O_qwmOBPSU8dylEPCrPRAA_GC25Ii5x
- Edge Functions (header apikey = anon key):
  * register-guru  POST {nama,nip,jabatan,satuan,npsn,email}
  * login-guru     POST {email,pin} -> {token, profile}
  * verify-guru    Bearer <token> -> {valid, profile}
  * ganti-pin      Bearer + {pin_lama,pin_baru}
  * pulihkan-akun  POST {mode:"cari"|"reset", email, sekolah, pin_baru}
  * ambil-pin-saya Bearer -> {pin}
- Login dashboard admin via Supabase Auth (bukan tabel guru).

[3. SKEMA (v2)]
- guru: id, waktu_input, nama_lengkap, nip, jabatan, satuan_pendidikan,
  npsn, email unique, pin unique, status_akun, pin_ver, sekolah_id FK,
  jabatan_id FK, role_id FK, jenis_gtk, status_kepegawaian, tmt_tugas
- sekolah: id, nama unique, npsn, jenjang, status_sekolah, alamat,
  kecamatan, email_sekolah, aktif
- jabatan: id, nama unique, kategori (Kepala Sekolah|Guru|Tenaga
  Kependidikan), level (1|2|3)
- role: id, kode unique (super_admin|kepala_sekolah|gtk), nama, level, deskripsi
- rate_limit: key, attempts, window_start
- Trigger sync_guru_denorm: kolom teks & FK sinkron dua arah.
  Mutasi = UPDATE guru SET sekolah_id = id baru (teks+NPSN ikut, PIN tetap).

[4. ATURAN SSO & RBAC]
- Token HMAC-SHA256 (secret GURU_SSO_SECRET), berlaku 7 hari.
- Token & profile memuat: sub, email, nama, sekolah, sekolah_id, npsn,
  jabatan, jenis_gtk, role, role_level, ver.
- Ganti/reset PIN menaikkan pin_ver -> token lama gugur di semua aplikasi.
- Hierarki: super_admin (semua) > kepala_sekolah (sekolah sendiri,
  filter via sekolah_id) > gtk (diri sendiri).
- Pemulihan: email + sekolah -> email tersamar + PIN lama; rate limit 5/10 menit.
- PIN 5 digit unik; generator otomatis: 3 digit akhir NPSN + urutan.

[5. HALAMAN (GitHub Pages)]
- index.html : pendaftaran + korektor email + tautan guru/admin.
- guru.html  : portal guru (login, profil, PIN ikon mata, ganti PIN, pemulihan).
- admin.html : dashboard (statistik, tabel, edit, nonaktifkan, lihat/salin/WA/
  ganti PIN, ekspor CSV, salin email, analitik, kesehatan data, cetak kartu).

[6. PREFERENSI TEKNIS]
- HTML/CSS/JS satu file tanpa build; CDN supabase-js + Lucide; font Inter.
- TEMA EKOSISTEM: primary #0D9488, gelap #0F766E, soft #CCFBF1,
  gradien teal→cyan (#0D9488→#0891B2); bahasa Indonesia.

[7. PRINSIP]
- HEMAT KUOTA: tanpa blast email/fitur berat di Supabase; utamakan
  client-side atau layanan eksternal.
- Service Role Key & GURU_SSO_SECRET jangan pernah ditulis di frontend,
  file publik, atau chat.

[8. INSTRUKSI]
- Setelah membaca konteks ini, tunggu perintah saya berikutnya.
- Tabel data aplikasi baru dibuat di project pusat dengan kolom pemilik
  merujuk guru(id)/email; pembatasan akses pakai profile.role dan
  profile.sekolah_id dari verify-guru.
=====================================================