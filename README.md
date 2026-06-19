# 🍜 Nakam - Solusi Kelaparan Mahasiswa Akhir Bulan

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**Nakam** adalah web app revolusioner yang dirancang khusus untuk mahasiswa Malang (UMM, UM, UB, UNISMA) yang sering kebingungan nyari makan enak tapi dompet lagi krisis. 

Bukan cuma sekadar direktori tempat makan biasa, Nakam menggabungkan fitur **peta interaktif (GPS)**, **pelacak *budget* bulanan**, dan **dashboard interaktif** khusus untuk pemilik warung (Merchant).

---

## 🚨 Kenapa Nakam Dibikin? (Urgensi)

Pernah ngerasain uang bulanan sisa Rp 50.000 tapi masih harus bertahan hidup 5 hari lagi? Terus bingung mau makan di mana karena takut *overbudget*? Lo nggak sendirian.

Ada beberapa masalah nyata yang jadi alasan utama kenapa Nakam ini wajib ada:
1. **Blind Spot Warung Murah**: Banyak warung makan murah (*hidden gems*) di sekitar area kampus yang nggak terdaftar di aplikasi ojol besar atau Google Maps karena alasan potongan biaya.
2. **Manajemen Keuangan Amburadul**: Mahasiswa sering nggak sadar pengeluaran makan harian mereka udah kelewat batas dari jatah bulanan.
3. **Pemberdayaan UMKM Lokal**: Ibu-ibu penjual nasi bungkus, lalapan, atau warkop butuh platform gratis dan gampang dipakai buat narik pelanggan mahasiswa tanpa potongan komisi yang mencekik.

Dengan Nakam, masalah di atas bisa kelar. Mahasiswa bisa nemu makanan sesuai sisa saldo mereka di peta, dan pemilik warung bisa nambahin lapak mereka secara akurat. Win-win solution.

---

## ✨ Fitur Utama

- 🗺 **Peta Warung Real-time**: Peta interaktif berbasis OpenStreetMap & Leaflet. Menampilkan lokasi warung secara akurat dengan kalkulasi jarak GPS di sekitar kampusmu.
- 💸 **Smart Budget Tracker**: Atur *budget* bulanan, catat pengeluaran tiap habis jajan, dan Nakam bakal ngasih peringatan kalau saldo lo udah di batas bahaya.
- 🏪 **Merchant Mode (Untuk Pemilik Usaha)**: Bebas mendaftar, tentukan *Pin* lokasi toko langsung di peta, dan atur ketersediaan menu jualan secara *real-time*.
- 📱 **UI/UX Sekelas Mobile App**: Tampilan sangat rapi, responsif, dengan animasi perpindahan layar yang super *smooth* (Framer Motion). Berasa buka *native app*!

---

## 🛠 Tech Stack

Proyek ini dibangun pake teknologi modern biar ngebut dan *scalable*:
- **Frontend**: React + TypeScript, Vite
- **Styling & UI**: Tailwind CSS, Framer Motion, Lucide Icons, Recharts
- **Map & Geospatial**: React Leaflet, OpenStreetMap
- **State Management**: Zustand
- **Backend & Database**: Supabase (PostgreSQL)

---

## 🚀 Cara Menjalankan Project

Buat lo yang mau nge-clone atau ngembangin lagi project ini secara lokal, gampang banget:

1. Clone repository ini:
   ```bash
   git clone https://github.com/username-lo/nakam.git
   cd nakam
   ```
2. Install semua dependencies:
   ```bash
   npm install
   ```
3. Setup Environment Variables:
   Copy file `.env.example` menjadi `.env.local` dan isi *keys* dari Supabase lo.
4. Jalankan *development server*:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:5173` di browser.

---

## 👨‍💻 Kreator

Dibuat dengan keringat, air mata, dan banyak kopi oleh **Lanciuy**. 

Kalau lo ngerasa project ini ngebantu, jangan lupa kasih ⭐ (*star*) di repo ini ya!