=====================================================
KONTEKS PROJECT: EKOSISTEM GURU BERBAGI SELOGIRI
=====================================================

[1. LATAR BELAKANG]
- Saya punya database akun guru (~250 guru, 31 sekolah SD) untuk
  "Guru Berbagi - Korwilcambidik Selogiri".
- Database sudah migrasi dari Google Apps Script ke Supabase.
  Project Supabase ini adalah PUSAT (identity provider) untuk
  semua aplikasi saya sekarang dan mendatang.
- Setiap aplikasi baru WAJIB memakai "SSO lite": guru login dengan
  EMAIL + PIN dari database pusat. JANGAN buat sistem registrasi
  atau login guru yang terpisah.

[2. KREDENSIAL PUSAT (aman untuk frontend)]
- Project URL : https://qamqqwfzhyiihqyzliwq.supabase.co
- Anon key    : sb_publishable_O_qwmOBPSU8dylEPCrPRAA_GC25Ii5x
- Endpoint SSO:
  * POST {URL}/functions/v1/login-guru
      body: {"email": "...", "pin": "..."}
      sukses: {"token":"...", "profile":{"nama","email","sekolah","jabatan","npsn"}}
      gagal : 401 (email/PIN salah atau akun nonaktif)
  * {URL}/functions/v1/verify-guru
      header: Authorization: Bearer <token>
      hasil : {"valid":true,"profile":{...}} atau {"valid":false}
  (Sertakan header apikey = anon key saat memanggil endpoint di atas.)
- Jika kedua function itu belum ada, buat dulu di project pusat
  sesuai spesifikasi bagian [5] sebelum membangun aplikasi.

[3. SKEMA DATABASE PUSAT]
- Tabel guru: id, waktu_input, nama_lengkap, nip, jabatan,
  satuan_pendidikan, npsn, email (unique), pin (unique),
  status_akun ('Aktif' / 'Non Aktif')
- Tabel referensi: sekolah(nama, npsn), jabatan(nama)
- Tabel guru dilindungi RLS: publik TIDAK bisa membaca langsung;
  semua verifikasi hanya lewat Edge Function.

[4. ATURAN SSO LITE UNTUK APLIKASI BARU]
1. Form login hanya EMAIL + PIN → panggil login-guru.
2. Simpan `token` dan `profile` di localStorage.
3. Saat aplikasi dibuka / aksi penting → verifikasi token ke
   verify-guru. Jika valid:false → paksa logout ke halaman login.
4. JANGAN menyimpan PIN di aplikasi baru. PIN hanya diverifikasi
   oleh function pusat.
5. Gunakan `profile.sub` (id guru) atau `profile.email` sebagai
   identitas pemilik data di tabel aplikasi baru.
6. Hanya guru status 'Aktif' yang boleh masuk (sudah diurus
   function pusat; tidak perlu cek ulang di frontend).

[5. SPESIFIKASI TOKEN (jika function perlu dibuat ulang)]
- Token = base64(payload) + "." + base64(HMAC-SHA256(payload, secret))
- payload = {sub, email, nama, sekolah, jabatan, npsn, exp}
  (exp = masa berlaku 7 hari)
- Secret disimpan di Secrets Edge Function pusat dengan nama
  GURU_SSO_SECRET. JANGAN pernah menulis nilai secret di chat,
  frontend, atau file publik.

[6. PREFERENSI TEKNIS SAYA]
- Frontend: HTML/CSS/JS satu file (tanpa build), host di GitHub Pages.
- Supabase JS SDK + ikon Lucide via CDN; font Inter; UI modern.
- Bahasa aplikasi & komentar kode: Indonesia.
- Login admin (jika perlu): Supabase Auth project pusat.

[7. INSTRUKSI UMUM]
Setelah membaca konteks ini, tunggu perintah saya berikutnya.
Jika aplikasi butuh tabel data baru, buat di project pusat dengan
kolom pemilik data merujuk ke id/email guru.
=====================================================

- PRINSIP HEMAT KUOTA: project pusat harus tetap ramping karena
  dipakai banyak aplikasi. Jangan menambahkan fitur berat (blast
  email, dsb.) ke Supabase; prioritaskan solusi client-side atau
  layanan eksternal di luar Supabase.
