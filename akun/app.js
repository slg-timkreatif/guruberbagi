// ============================================
// KONFIGURASI SUPABASE (GANTI DENGAN MILIK ANDA!)
// ============================================
const SUPABASE_URL = "https://qamqqwfzhyiihqyzliwq.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbXFxd2Z6aHlpaWhxeXpsaXdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3Njc0NDIsImV4cCI6MjEwMzM0MzQ0Mn0.s5arHGG8h9x5jNgs1SpoQmytBXC9kuiaSMXzwOaOgWs"; 
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/register-guru`;

// Inisialisasi client (gunakan nama 'db' agar tidak bentrok dengan global 'supabase')
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tunggu HTML selesai dimuat sebelum menjalankan fungsi
document.addEventListener("DOMContentLoaded", () => {
  loadDropdowns();
  setupEventListeners();
});

// ============================================
// 1. LOAD DROPDOWN JABATAN & SEKOLAH
// ============================================
async function loadDropdowns() {
  try {
    const [{ data: jabatanData }, { data: sekolahData }] = await Promise.all([
      db.from("jabatan").select("nama").order("nama"),
      db.from("sekolah").select("nama, npsn").order("nama"),
    ]);

    const jabatanSelect = document.getElementById("jabatan");
    jabatanSelect.innerHTML = '<option value="">-- Pilih Jabatan --</option>';
    jabatanData.forEach((j) => {
      jabatanSelect.innerHTML += `<option value="${j.nama}">${j.nama}</option>`;
    });
    jabatanSelect.innerHTML += '<option value="__lainnya__">Lainnya...</option>';

    const satuanSelect = document.getElementById("satuan");
    satuanSelect.innerHTML = '<option value="">-- Pilih Satuan Pendidikan --</option>';
    sekolahData.forEach((s) => {
      satuanSelect.innerHTML += `<option value="${s.nama}" data-npsn="${s.npsn}">${s.nama}</option>`;
    });

    window.sekolahMap = {};
    sekolahData.forEach((s) => (window.sekolahMap[s.nama] = s.npsn));
  } catch (err) {
    console.error("Gagal memuat dropdown:", err);
    alert("Gagal memuat data. Silakan refresh halaman.");
  }
}

// ============================================
// 2. EVENT LISTENERS
// ============================================
function setupEventListeners() {
  document.getElementById("noNip").addEventListener("change", (e) => {
    const nipInput = document.getElementById("nip");
    const emailInput = document.getElementById("email");
    if (e.target.checked) {
      nipInput.value = emailInput.value;
      nipInput.readOnly = true;
    } else {
      nipInput.value = "";
      nipInput.readOnly = false;
    }
  });

  document.getElementById("email").addEventListener("input", (e) => {
    if (document.getElementById("noNip").checked) {
      document.getElementById("nip").value = e.target.value;
    }
  });

  document.getElementById("jabatan").addEventListener("change", (e) => {
    const inputLain = document.getElementById("jabatanLainnya");
    if (e.target.value === "__lainnya__") {
      inputLain.style.display = "block";
      inputLain.required = true;
    } else {
      inputLain.style.display = "none";
      inputLain.required = false;
      inputLain.value = "";
    }
  });

  document.getElementById("satuan").addEventListener("change", (e) => {
    const nama = e.target.value;
    document.getElementById("npsn").value = window.sekolahMap[nama] || "";
  });

  document.getElementById("formDaftar").addEventListener("submit", handleSubmit);

  document.getElementById("btnTutupModal").addEventListener("click", () => {
    document.getElementById("modalPinContainer").style.display = "none";
  });
  document.getElementById("btnTutupError").addEventListener("click", () => {
    document.getElementById("modalError").style.display = "none";
  });
}

// ============================================
// 3. HANDLE SUBMIT FORM
// ============================================
async function handleSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById("btnSubmit");
  const btnText = btn.querySelector(".btn-text");
  const btnLoader = btn.querySelector(".btn-loader");

  const nama = document.getElementById("nama").value.trim();
  const email = document.getElementById("email").value.trim();
  const nip = document.getElementById("nip").value.trim();
  const jabatanRaw = document.getElementById("jabatan").value;
  const jabatanLain = document.getElementById("jabatanLainnya").value.trim();
  const satuan = document.getElementById("satuan").value;
  const npsn = document.getElementById("npsn").value.trim();

  const jabatan = jabatanRaw === "__lainnya__" ? jabatanLain : jabatanRaw;
  if (!jabatan) {
    tampilkanError("Mohon pilih atau isi jabatan.");
    return;
  }

  btn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline";

  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ nama, nip, jabatan, satuan, npsn, email }),
    });

    const result = await response.json();

    if (result.status === "sukses") {
      tampilkanModal(result.nama, result.pin, "sukses");
      document.getElementById("formDaftar").reset();
      document.getElementById("nip").readOnly = false;
      document.getElementById("jabatanLainnya").style.display = "none";
    } else if (result.status === "duplikat") {
      tampilkanModal(result.nama, result.pin, "duplikat");
    } else {
      tampilkanError(result.error || "Terjadi kesalahan tidak diketahui.");
    }
  } catch (err) {
    tampilkanError("Gagal terhubung ke server: " + err.message);
  } finally {
    btn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
}

// ============================================
// 4. MODAL HELPER
// ============================================
function tampilkanModal(nama, pin, tipe) {
  const header = document.getElementById("modalHeader");
  const pesan = document.getElementById("modalPesan");

  if (tipe === "duplikat") {
    header.querySelector("h2").textContent = "Akun Sudah Terdaftar";
    header.style.background = "#d35400";
    pesan.textContent = "Kami menemukan akun Anda. PIN Anda adalah:";
  } else {
    header.querySelector("h2").textContent = "Pendaftaran Berhasil!";
    header.style.background = "#2c3e50";
    pesan.textContent = "PIN Anda adalah:";
  }

  document.getElementById("modalNama").textContent = nama;
  document.getElementById("modalPinValue").textContent = pin;
  document.getElementById("modalPinContainer").style.display = "flex";
}

function tampilkanError(pesan) {
  document.getElementById("errorPesan").textContent = pesan;
  document.getElementById("modalError").style.display = "flex";
}
