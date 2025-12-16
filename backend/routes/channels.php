<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
| Karena pakai auth:sanctum di api.php, kode di sini HANYA dieksekusi
| jika user SUDAH LOGIN. Tamu tidak akan pernah sampai sini.
*/

// 1. Channel User Pribadi
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// 2. Channel Chat Session
Broadcast::channel('chat-session.{sessionId}', function ($user, $sessionId) {
    // Kita return true saja, karena yang sampai sini pasti User/Admin yang login.
    // Tamu sudah ditolak di pintu depan (api.php).
    return true; 
});

// 3. Channel Dashboard Admin
Broadcast::channel('operator-dashboard', function ($user) {
    return $user->role === 'admin';
});