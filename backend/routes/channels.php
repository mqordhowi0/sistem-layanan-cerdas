<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// --- TAMBAHKAN INI ---
// Otorisasi channel privat kita
// Karena user kita anonim (berbasis session_id), kita return true saja.
// Artinya, "Siapapun yang tahu nama channel-nya, boleh mendengarkan."
// Nanti ini bisa dibuat lebih aman jika perlu.
Broadcast::channel('chat-session.{sessionId}', function ($user, $sessionId) {
    // $user akan null karena kita tidak login
    // Untuk sekarang, izinkan semua koneksi
    return true; 
});

Broadcast::channel('operator-dashboard', function ($user) {
    // $user adalah operator yang sedang login (via token Sanctum)
    // Kita cek apakah dia benar-benar instance dari model Operator
    return $user instanceof \App\Models\Operator;
});