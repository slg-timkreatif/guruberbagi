=====================================================
KONTEKS PROJECT: EKOSISTEM GURU BERBAGI SELOGIRI (v2)
=====================================================
[1. LATAR BELAKANG]
- Database akun ±250 guru / 31 sekolah SD, migrasi dari GAS ke Supabase.
- Project ini adalah PUSAT IDENTITAS (identity provider) untuk semua
  aplikasi saya. Aplikasi baru WAJIB pakai SSO lite (Email + PIN),
  jangan buat sistem login guru terpisah.

[2. KREDENSIAL & ENDPOINT]
- URL   : https://qamqqwfzhyiihqyzliwq.supabase.co
- Anon  : sb_publishable_O_qwmOBPSU8dylEPCrPRAA_GC25Ii5x
- Endpoint Edge Functions (semua pakai header apikey = anon key):
  * register-guru  POST {nama,nip,jabatan,satuan,npsn,email}
  * login-guru     POST {email,pin} -> {token, profile}
  * verify-guru    GET/POST + Authorization: Bearer <token> -> {valid, profile}
  * ganti-pin      POST + Bearer token + {pin_lama,pin_baru}
  * pulihkan-akun  POST {mode:"cari"|"reset", nip|nama, sekolah, pin_baru}
- Admin login via Supabase Auth (bukan tabel manual).

[3. SKEMA]
- guru: id, waktu_input, nama_lengkap, nip, jabatan, satuan_pendidikan,
  npsn, email (unique), pin (unique), status_akun, pin_ver (int, default 1)
- sekolah(nama,npsn), jabatan(nama), rate_limit(key,attempts,window_start)
- RLS: publik hanya baca sekolah/jabatan; guru via service role & admin auth.

[4. ATURAN SSO]
- Token HMAC-SHA256 (secret: GURU_SSO_SECRET), berlaku 7 hari.
- Token memuat "ver"; setiap ganti/reset PIN menaikkan pin_ver
  sehingga token lama OTOMATIS gugur.
- PIN = 5 digit angka, unik. Generator otomatis: 3 digit akhir NPSN + urutan.
- Pemulihan akun: NIP+sekolah atau nama+sekolah -> email tersamar -> PIN baru.
  Rate limit 5 percobaan/10 menit.

[5. HALAMAN (GitHub Pages, satu file per halaman)]
- index.html : form pendaftaran + korektor email cerdas + tautan guru/admin.
- guru.html  : portal guru (login SSO, profil, ganti PIN, pemulihan akun).
- admin.html : dashboard (statistik, tabel, edit, nonaktifkan, lihat/salin/WA/
  ganti PIN, ekspor CSV, salin email, analitik, kesehatan data, cetak kartu).

[6. PREFERENSI TEKNIS]
- HTML/CSS/JS satu file tanpa build; CDN @supabase/supabase-js + Lucide;
  font Inter; UI modern; bahasa Indonesia.

[7. PRINSIP]
- HEMAT KUOTA: jangan tambah fitur berat (blast email dsb.) ke Supabase;
  utamakan solusi client-side atau layanan eksternal.
- JANGAN pernah menulis Service Role Key / GURU_SSO_SECRET di frontend,
  file publik, atau chat.

[8. INSTRUKSI]
Setelah membaca konteks ini, tunggu perintah saya. Tabel data aplikasi baru
dibuat di project pusat dengan kolom pemilik merujuk id/email guru.
=====================================================
