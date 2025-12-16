🧠 Sistem Layanan Cerdas (Smart Customer Service)

Hybrid Chatbot yang menggabungkan AI Assistant & Live Operator, dibangun menggunakan:

Laravel (Backend API)

Laravel Reverb (Real-time WebSocket)

React + Vite (Frontend)

MySQL/MariaDB (Database)

📌 1. Prasyarat Sistem (Requirements)

Pastikan perangkat telah menginstal:

PHP ≥ 8.2

Composer

Node.js ≥ 18.x & NPM

MySQL / MariaDB

Git

📌 2. Instalasi & Konfigurasi
A. Setup Backend (Laravel)

Masuk ke folder backend

cd backend


Install dependensi PHP

composer install


Setup file environment .env

cp .env.example .env


Konfigurasikan:

DB_DATABASE

REVERB_APP_KEY

DOCSBOT_API_KEY

Generate application key

php artisan key:generate


Migrasi & seeding database

php artisan migrate:fresh --seed


Bersihkan cache

php artisan optimize:clear
composer dump-autoload

B. Setup Frontend (React + Vite)

Masuk ke folder frontend

cd frontend


Install dependensi Node

npm install

📌 3. Cara Menjalankan Aplikasi

Untuk menjalankan aplikasi secara lengkap Anda membutuhkan 3–4 terminal sekaligus:

🟦 Terminal 1 — Backend Laravel

Menjalankan API server.

php artisan serve


Server berjalan di:
http://127.0.0.1:8000

🟩 Terminal 2 — WebSocket (Laravel Reverb)
php artisan reverb:start

🟧 Terminal 3 — Frontend React (Vite)
npm run dev


Akses aplikasi:
http://localhost:5173

🟥 Terminal 4 (Opsional) — Queue Worker

Untuk background job (disarankan):

php artisan queue:listen

📌 4. Akun Demo (Setelah migrate:fresh --seed)
👮 Administrator / Operator

Email: admin@stupen.com

Password: password

👤 User Mahasiswa

Email: mahasiswa@test.com

Password: password

📌 5. Troubleshooting (Masalah Umum)
❓ Chat tidak real-time / harus refresh?

✔ Pastikan Reverb berjalan
✔ Cek apakah REVERB_APP_KEY pada backend sama dengan yang digunakan di frontend (src/lib/echo.js)

❓ Gagal Login ("Unauthorized") atau Error 500

Coba clear cache:

php artisan config:clear
php artisan route:clear
php artisan cache:clear

❓ Halaman Admin blank atau gagal load data

Token lama mungkin invalid karena DB di-reset.

Solusi:

Buka DevTools → Application → Local Storage

Klik Clear

Login ulang

📁 Struktur Folder Penting
Backend

app/Http/Controllers/Api/ChatController.php — Logika chatbot user & AI

app/Http/Controllers/Api/OperatorController.php — Login admin & manajemen operator

app/Events/NewMessageSent.php — Event broadcast pesan

routes/api.php — Endpoint API

routes/channels.php — Otorisasi WebSocket channel

Frontend

src/pages/ — Halaman Chat, Dashboard, Login

src/context/AuthContext.jsx — Manajemen token & auth state