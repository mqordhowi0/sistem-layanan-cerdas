📖 Dokumentasi API: Sistem Layanan Cerdas
Ini adalah dokumentasi resmi untuk tim Frontend.

A. Setup Awal
1. URL Utama (Base URL)
Semua endpoint API diawali dengan URL server backend kita: http://127.0.0.1:8000

2. Koneksi Real-time (WebSocket)
Kita pakai Laravel Reverb (bukan Pusher eksternal), jadi frontend harus connect ke server WebSocket lokal kita. Kredensial ini ada di file backend/.env (cari bagian VITE_...):

App Key: guejdumeefap5n7rdxeb (atau cek .env-mu)

Host: localhost

Port: 8080

Scheme: http

B. Alur Peserta (Chat Widget) 🚀
Ini adalah API publik yang tidak perlu login (token).

1. Memulai Sesi Chat Baru
Tujuan: Dipanggil saat widget chat pertama kali dibuka untuk mendaftarkan sesi.

Endpoint: POST /api/chat/start

Perlu Login? Tidak.

Body (JSON) Dikirim: (Kosong)

Body (JSON) Diterima (Sukses):

JSON

{
    "status": "success",
    "session_id": 1  // <-- Tipe: integer. Simpan ID ini di frontend!
}
2. Mengirim Pesan (sebagai Peserta)
Tujuan: Mengirim pesan dari peserta ke AI.

Endpoint: POST /api/chat/send

Perlu Login? Tidak.

Body (JSON) Dikirim:

JSON

{
    "message": "Apa itu Studi Independen?", // Tipe: string
    "session_id": 1                         // Tipe: integer (dari endpoint #1)
}
Body (JSON) Diterima (Sukses):

PENTING: Respons ini adalah balasan dari AI. Tapi, cara terbaik adalah mengabaikan respons ini dan mendengarkan dari WebSocket (Lihat Bagian D) untuk mendapatkan kedua pesan (dari user & AI) secara real-time.

3. Meminta Eskalasi ke Operator
Tujuan: Dipanggil saat peserta menekan tombol "Bicara dengan Operator".

Endpoint: POST /api/chat/request-operator

Perlu Login? Tidak.

Body (JSON) Dikirim:

JSON

{
    "session_id": 1 // Tipe: integer (dari endpoint #1)
}
Body (JSON) Diterima (Sukses):

JSON

{
    "status": "success",
    "message": "Operator requested.",
    "chat_message": { /* ... (objek pesan sistem) ... */ }
}
4. Mengambil Daftar FAQ Publik
Tujuan: Untuk menampilkan halaman FAQ Dinamis.

Endpoint: GET /api/faqs

Perlu Login? Tidak.

Body (JSON) Dikirim: (Kosong)

Body (JSON) Diterima (Sukses):

JSON

[
    {
        "id": 1,
        "question": "Apa itu Studi Independen?",     // Tipe: string
        "answer": "Ini adalah jawaban resmi...",    // Tipe: string
        "created_at": "..."                         // Tipe: timestamp
    },
    { /* ... (objek FAQ lainnya) ... */ }
]
C. Alur Operator (Dashboard Admin) 🔒
Semua API di bagian ini WAJIB menyertakan Bearer Token di Header Otorisasi.

1. Login Operator
Tujuan: Mendapatkan token untuk mengakses API aman.

Endpoint: POST /api/operator/login

Perlu Login? Tidak.

Body (JSON) Dikirim:

JSON

{
    "email": "operator1@stupen.com", // Tipe: string
    "password": "password123"        // Tipe: string
}
Body (JSON) Diterima (Sukses):

JSON

{
    "message": "Login berhasil!",
    "operator": { /* ... (objek data operator) ... */ },
    "token": "1|abcdefghijklmnopqrstuvwxyz" // <-- Tipe: string. WAJIB DISIMPAN!
}
Cara Pakai Token: Untuk semua request di bawah ini, tambahkan Header: Authorization: Bearer 1|abcdefghijklmnopqrstuvwxyz

2. Mengambil Data Operator (Cek Login)
Tujuan: Mendapatkan data operator yang sedang login.

Endpoint: GET /api/operator/me

Perlu Login? Ya (Bearer Token).

Body (JSON) Diterima (Sukses):

JSON

{
    "id": 1,
    "name": "Operator 1",  // Tipe: string
    "email": "..."        // Tipe: string
}
3. Logout Operator
Tujuan: Menghapus token yang sedang dipakai.

Endpoint: POST /api/operator/logout

Perlu Login? Ya (Bearer Token).

Body (JSON) Diterima (Sukses):

JSON

{ "message": "Logout berhasil!" }
4. Mengambil Daftar Chat yang Antri
Tujuan: Menampilkan daftar chat yang statusnya pending_operator.

Endpoint: GET /api/operator/pending-chats

Perlu Login? Ya (Bearer Token).

Body (JSON) Diterima (Sukses):

JSON

[
    {
        "id": 15,                          // Tipe: integer (Session ID)
        "status": "pending_operator",    // Tipe: string
        "created_at": "..."                // Tipe: timestamp
    },
    { /* ... (objek sesi lainnya) ... */ }
]
5. Mengambil Alih Chat
Tujuan: Mengubah status chat dari pending menjadi operator_active.

Endpoint: POST /api/operator/takeover/{sessionId}

(Ganti {sessionId} dengan ID dari endpoint #4, misal: /api/operator/takeover/15)

Perlu Login? Ya (Bearer Token).

Body (JSON) Diterima (Sukses):

JSON

{
    "status": "success",
    "message": "Chat taken over."
}
6. Mengirim Pesan (sebagai Operator)
Tujuan: Mengirim balasan sebagai operator.

Endpoint: POST /api/operator/send-message

Perlu Login? Ya (Bearer Token).

Body (JSON) Dikirim:

JSON

{
    "message": "Halo, ini Operator 1.", // Tipe: string
    "session_id": 15                  // Tipe: integer
}
Body (JSON) Diterima (Sukses):

JSON

{
    "id": 101,
    "chat_session_id": 15,
    "sender_type": "operator", // <-- Tipe: string
    "message": "Halo, ini Operator 1.",
    "created_at": "..."
}
7. Mengambil Daftar Kandidat FAQ
Tujuan: Menampilkan daftar pertanyaan yang sering ditanyakan.

Endpoint: GET /api/operator/faq-candidates

Perlu Login? Ya (Bearer Token).

Body (JSON) Diterima (Sukses):

JSON

[
    {
        "id": 1,
        "question_text": "Ini pertanyaan tes?", // Tipe: string
        "ask_count": 5,                      // Tipe: integer
        "status": "pending",                 // Tipe: string
        "created_at": "..."
    }
]
8. Menyetujui Kandidat FAQ
Tujuan: Menerbitkan kandidat FAQ menjadi FAQ publik.

Endpoint: POST /api/operator/faq-approve/{candidateId}

(Ganti {candidateId} dengan ID dari endpoint #7, misal: /api/operator/faq-approve/1)

Perlu Login? Ya (Bearer Token).

Body (JSON) Dikirim:

JSON

{
    "answer": "Ini adalah jawaban resmi dari operator." // Tipe: string
}
Body (JSON) Diterima (Sukses):

JSON

{
    "status": "success",
    "message": "FAQ approved and published."
}
9. Menolak Kandidat FAQ
Tujuan: Menyembunyikan/menolak kandidat FAQ.

Endpoint: POST /api/operator/faq-reject/{candidateId}

(Misal: /api/operator/faq-reject/2)

Perlu Login? Ya (Bearer Token).

Body (JSON) Dikirim: (Kosong)

Body (JSON) Diterima (Sukses):

JSON

{
    "status": "success",
    "message": "FAQ candidate rejected."
}
D. Petunjuk Real-time (WebSocket) 💬
Frontend harus "mendengarkan" (subscribe) ke channel WebSocket untuk mendapatkan data real-time.

1. Untuk Chat Peserta
Channel: private-chat-session.{sessionId}

(Ganti {sessionId} dengan ID sesi yang aktif, misal: private-chat-session.15)

Event: NewMessageSent

Data yang Diterima (Payload):

JSON

{
    "message": {
        "id": 101,
        "chat_session_id": 15,
        "sender_type": "user", // "user", "ai", atau "operator"
        "message": "Isi pesannya...",
        "created_at": "..."
    }
}
2. Untuk Dashboard Operator
Channel: private-operator-dashboard

Event: ChatSessionQueued

Data yang Diterima (Payload):

JSON

{
    "session": {
        "id": 16,
        "status": "pending_operator",
        "created_at": "..."
    }
}
Tujuan: Saat frontend (dashboard operator) menerima ini, dia harus otomatis "memuat ulang" daftar antrian (GET /api/operator/pending-chats) atau langsung menambahkan data ini ke antrian di UI.