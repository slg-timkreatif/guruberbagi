# 🏫 GURU BERBAGI - Korwilcambidik Kecamatan Selogiri

Aplikasi Web berbasis **Google Apps Script** untuk berbagi media pembelajaran inovatif antar guru di Kecamatan Selogiri. Memungkinkan guru untuk membagikan kode HTML interaktif (dari AI/Gemini) atau link media luar secara rapi dan terorganisir.

## ✨ Fitur Unggulan
- **Role-Based Access Control:** Tingkatan akses untuk Admin, Moderator, Guru, dan Tamu.
- **Sistem Kurasi:** Admin/Moderator dapat menyetujui atau memberikan masukan revisi pada karya guru.
- **Live Preview:** Guru dapat melihat pratinjau media secara real-time sebelum dipublikasikan.
- **Program KAIH:** Dukungan khusus untuk konten Kebiasaan Anak Indonesia Hebat.
- **Auto-Reload:** Sinkronisasi data otomatis antar Spreadsheet dan Web App.

## 🛠️ Persiapan Teknis
1. Buat Google Spreadsheet dengan sheet: `Media`, `Users`, `Settings`, dan `Log`.
2. Masukkan kode dari folder `src/` ke Editor Google Apps Script.
3. Sesuaikan `SPREADSHEET_ID` di file `Kode.gs`.
4. Deploy sebagai Web App dengan akses "Anyone".

## 👤 Kontributor
- **Admin/Developer:** [Ekwan Nugroho/Tim Kreatif Kecamatan Selogiri]
- **Instansi:** Korwilcambidik Kecamatan Selogiri
