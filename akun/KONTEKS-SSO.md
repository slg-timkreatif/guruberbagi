=====================================================
KONTEKS PROJECT: EKOSISTEM GURU BERBAGI SELOGIRI (v4)
=====================================================

[1. LATAR BELAKANG]
- Database akun GTK (±258 orang / 31 sekolah), migrasi dari Google
  Apps Script (spreadsheet) ke Supabase.
- Project ini adalah PUSAT IDENTITAS (identity provider) untuk semua
  aplikasi saya ("SSO lite"). Aplikasi baru WAJIB login melalui
  endpoint login-guru (Email + PIN); JANGAN membuat sistem login
  guru terpisah.
- Repo frontend: github slg-timkreatif/app (GitHub Pages):
  index.html (pintu depan), daftar.html (form pendaftaran),
  guru.html (Pusat Akun), admin.html (dashboard admin).

[2. KREDENSIAL & ENDPOINT]
- URL  : https://qamqqwfzhyiihqyzliwq.supabase.co
- Anon : sb_publishable_O_qwmOBPSU8dylEPCrPRAA_GC25Ii5x
- Semua panggilan Edge Function menyertakan header:
  apikey: <anon>  (+ Authorization: Bearer <token> bila perlu sesi)
- Edge Functions:
  * register-guru  POST {nama,nip,jabatan,satuan,npsn,email}
      -> {status:"sukses"|"duplikat", nama, pin} | {error}
      (duplikat dicek via email serta npsn+nama; PIN auto:
       3 digit akhir NPSN + urutan 2 digit; Non-ASN nip=null)
  * login-guru     POST {email,pin} -> {token, profile}
      profile: {nama,email,nip,status_kepegawaian,sekolah,sekolah_id,
                npsn,jabatan,jenis_gtk,role,role_level,
                penugasan:[{jenis,sekolah,npsn,jabatan}]}
  * verify-guru    Bearer <token> -> {valid, profile}
  * ganti-pin      Bearer + {pin_lama,pin_baru}
  * ambil-pin-saya Bearer -> {pin}
  * pulihkan-akun  POST {mode:"cari",email,sekolah}
        -> {nama, email_masked, pin}  (men-set guru.pin_dilihat_pada)
      POST {mode:"reset",email,sekolah,pin_baru}
      (rate limit 5 percobaan/10 menit via tabel rate_limit)
  * ult-guru       Bearer + {aksi:"daftar"|"detail"|"buat"|"balas",...}
  * simpan-foto-gtk Bearer (token SSO = foto sendiri) ATAU sesi
      Supabase Auth (admin, wajib kirim guru_id) + {foto,thumb}
      base64 dataURL (maks 500KB masing-masing) -> {url,thumb_url}
- Login admin dashboard via Supabase Auth (bukan tabel guru).

[3. SKEMA DATABASE]
- guru: id, waktu_input, nama_lengkap, nip (NULL utk Non-ASN),
  jabatan, satuan_pendidikan, npsn, email UNIQUE, pin UNIQUE (5 digit),
  status_akun (Aktif|Non Aktif), pin_ver INT, sekolah_id FK,
  jabatan_id FK, role_id FK, jenis_gtk, status_kepegawaian, tmt_tugas,
  pin_dilihat_pada TIMESTAMPTZ, baris_bayangan BOOL DEFAULT false,
  bayangan_dari INT FK guru(id) ON DELETE CASCADE
- sekolah: id, nama UNIQUE, npsn, jenjang, status_sekolah, alamat,
  kecamatan, email_sekolah, aktif BOOL
- jabatan: id, nama UNIQUE, kategori (Kepala Sekolah|Guru|Tenaga
  Kependidikan), level (1|2|3)
- role: id, kode UNIQUE (super_admin|kepala_sekolah|gtk), nama, level,
  deskripsi  (RLS: baca terbuka, tulis hanya service role)
- penugasan: id, guru_id FK, sekolah_id FK, jabatan_id FK,
  jenis (Induk|Rangkap), tmt, aktif BOOL;
  UNIQUE (guru_id, sekolah_id, jabatan_id); RLS admin-manage
- ult_tiket: id, guru_id, kategori, subjek, pesan,
  status (Baru|Diproses|Selesai|Ditutup), dibuat_pada, diperbarui_pada
- ult_pesan: id, tiket_id, pengirim (guru|admin), pesan, waktu
- rate_limit: key PK, attempts, window_start (RLS aktif tanpa policy
  = hanya service role)
- Storage bucket: foto-gtk (PUBLIC read; tulis HANYA via Edge Function)

[4. TRIGGER & VIEW]
- sync_guru_denorm: kolom teks (satuan_pendidikan, npsn, jabatan,
  jenis_gtk) selalu sinkron dari FK master saat sekolah_id/jabatan_id
  berubah.
- sync_penugasan_induk: melewatkan baris_bayangan; membuat/memperbarui
  penugasan Induk mengikuti baris guru; menghapus Rangkap yang bentrok.
- sync_bayangan_ks: memelihara BARIS BAYANGAN otomatis dari penugasan
  Rangkap ber-jabatan Kepala Sekolah:
  email bayangan = lokal+"+plt"+sekolah_id+"@"+domain;
  pin bayangan = "BAYANGAN-<guru_id>-<sekolah_id>" (tak bisa login).
- sync_bayangan_identitas: nama/NIP bayangan mengikuti baris asli.
- VIEW v_penugasan_aktif & v_kepala_sekolah (security_invoker=true);
  kolom adalah_plt = (jenis='Rangkap' AND kategori='Kepala Sekolah').

[5. ATURAN SSO & RBAC]
- Token HMAC-SHA256 (secret: GURU_SSO_SECRET), berlaku 7 hari,
  memuat field ver (= pin_ver). Ganti/reset PIN menaikkan pin_ver
  -> SEMUA sesi lama gugur di semua aplikasi.
- Role otomatis: jabatan Kepala Sekolah -> role kepala_sekolah;
  lainnya -> gtk; admin dashboard -> super_admin.
- Cakupan akses aplikasi: super_admin (semua), kepala_sekolah
  (semua sekolah pada penugasannya, lihat profile.penugasan),
  gtk (diri sendiri).

[6. PIN & PEMULIHAN]
- PIN = identitas orang (bukan sekolah); tidak berubah saat mutasi.
- Pemulihan (guru.html, juga ?pemulihan=1) dua jalur:
  (A) LIHAT PIN lama: verifikasi email+sekolah -> centang pernyataan
      pemilik -> tampilkan PIN (+Salin / +Catat via WhatsApp);
      menulis guru.pin_dilihat_pada (jejak audit, tampil di modal PIN
      admin).
  (B) GANTI PIN baru: verifikasi sama -> set PIN baru (pin_ver naik).
- Admin dapat melihat/mengganti PIN dari dashboard (modal PIN).

[7. PENUGASAN, KS PLT, MUTASI, BARIS BAYANGAN]
- SATU orang = SATU akun (email+PIN unik). Jabatan rangkap/Plt
  dimodelkan sebagai penugasan Rangkap, BUKAN akun kedua.
- Agar aplikasi LAMA (yang membaca tabel guru per sekolah) tetap
  melihat KS di dua sekolah, trigger membuat baris bayangan
  (baris_bayangan=true) di sekolah Plt. Baris asli tetap di sekolah
  induk.
- Mutasi = edit baris guru (sekolah+jabatan); riwayat tugas lama
  disimpan sebagai penugasan Rangkap; mengakhiri Plt = hapus baris
  Rangkap (bayangan terhapus otomatis).
- Aplikasi BARU disarankan membaca v_kepala_sekolah /
  profile.penugasan, bukan tabel guru, untuk deteksi KS.

[8. ULT (UNIT LAYANAN TERPADU)]
- Tiket layanan guru<->admin. Kategori: Akun & PIN, Perbaikan Data,
  Mutasi / Penugasan, Kendala Pendaftaran, Lainnya.
- Status: Baru -> Diproses -> Selesai / Ditutup (bisa Buka Kembali).
- Guru: ajukan/pantau/balas via guru.html (ult-guru, token SSO).
- Admin: menu Layanan (badge tiket Baru), balas & ubah status
  (balasan pertama admin otomatis Baru->Diproses).

[9. FOTO PROFIL (konvensi lintas aplikasi)]
- Bucket publik; path deterministik (TANPA kolom di DB):
  FOTO_BASE = {URL}/storage/v1/object/public/foto-gtk
  detail : FOTO_BASE/{guru_id}.webp   (512px, ±40-60 KB)
  thumb  : FOTO_BASE/{guru_id}_t.webp (96px, ±6-10 KB)
- guru_id = profile.sub (SSO) atau guru.id.
- Kompresi WAJIB di klien (canvas -> webp/jpeg) sebelum upload.
- cacheControl 86400 (1 hari); paksa segar dengan ?v=<timestamp>.
- Fallback inisial bila foto belum ada (img onerror disembunyikan,
  BUKAN dihapus dari DOM).
- Snippet siap pakai di aplikasi lain:
  const FOTO_BASE="https://qamqqwfzhyiihqyzliwq.supabase.co/storage/v1/object/public/foto-gtk";
  function renderFotoGtk(id,nama,ukuran="t",size=40){
    const init=(nama||"G").trim().charAt(0).toUpperCase();
    const suf=ukuran==="t"?"_t":"";
    return `<span class="foto-wrap" style="width:${size}px;height:${size}px">${init}<img loading="lazy" src="${FOTO_BASE}/${id}${suf}.webp" onerror="this.style.display='none'" onload="this.style.display=''"></span>`;
  }
  CSS: .foto-wrap{border-radius:50%;background:#CCFBF1;color:#0F766E;
  display:inline-flex;align-items:center;justify-content:center;
  font-weight:800;position:relative;overflow:hidden}
  .foto-wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}

[10. HALAMAN & PERILAKU]
- index.html : pintu depan sadar-sesi (Daftar / Masuk / Lupa PIN;
  jika token valid -> sapaan + tombol Lanjut ke Pusat Akun).
- daftar.html: form pendaftaran + korektor email cerdas + penjaga
  sesi (yang sudah punya akun dilempar ke guru.html).
- guru.html  : Pusat Akun (profil+foto unggah mandiri, PIN lihat/
  ganti, ULT, pemulihan dua jalur).
- admin.html : dashboard (Beranda, Data GTK [thumbnail foto, badge
  Rangkap, edit+penugasan+foto, nonaktif, hapus permanen ber-ketik
  email], Sekolah, Master Jabatan/Role, Analitik, Kesehatan Data,
  Layanan ULT, cetak kartu, ekspor CSV/salin email, ganti password).

[11. TEMA & DESAIN]
- Warna ekosistem: primary #0D9488; gelap #0F766E; soft #CCFBF1;
  gradien teal->cyan (#0D9488 -> #0891B2).
- IKON: HANYA Lucide (data-lucide) — dilarang emoji sebagai ikon.
- Font Inter; UI kartu membulat; responsif (sidebar desktop,
  bottom-nav + drawer di HP; tabel -> kartu di layar kecil).

[12. PRINSIP]
- HEMAT KUOTA: tanpa layanan email/blast; foto dikompresi klien +
  lazy-load + cache; path foto deterministik (nol kolom DB tambahan);
  fitur berat dihindari di Supabase.
- SATU orang SATU akun; tanpa PIN/email baru untuk Plt/rangkap.
- Service Role Key & GURU_SSO_SECRET JANGAN pernah ditulis di
  frontend, file publik, atau chat.
- Korektor domain email (fixDomain): g.mail.com/gmailcom/gmail.co/
  gmail.con->gmail.com; addmin.sd.belajar.id->admin.sd.belajar.id;
  dst. (dipakai di daftar.html & Kesehatan Data).

[13. JAHITAN DIKETAHUI (jangan kaget)]
- Baris bayangan ikut tampil di tabel/statistik/CSV/cetak admin
  (PIN-nya ber-marker "BAYANGAN-..." -> abaikan saat rekap; atau
  filter baris_bayangan=false bila perlu presisi).
- Foto ter-cache s.d. 1 hari di aplikasi lain setelah perubahan.
- Aplikasi lama mendeteksi KS via tabel guru (bekerja berkat baris
  bayangan); aplikasi baru disarankan pakai v_kepala_sekolah.

[14. INSTRUKSI UNTUK AI]
- Setelah membaca konteks ini, tunggu perintah saya berikutnya.
- Tabel data aplikasi baru dibuat di project pusat dengan kolom
  pemilik merujuk guru(id)/email; pembatasan akses memakai
  profile.role, profile.sekolah_id, dan profile.penugasan dari
  verify-guru; foto memakai konvensi bagian [9]; deteksi KS memakai
  view bagian [4].
=====================================================