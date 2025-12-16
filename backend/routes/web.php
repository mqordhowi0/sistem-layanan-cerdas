<?php

use Illuminate\Support\Facades\Http;

Route::get('/cari-id-botpress', function () {
    $token = env('BOTPRESS_TOKEN');
    $botId = env('BOTPRESS_BOT_ID');
    $url = env('BOTPRESS_API_URL', 'https://api.botpress.cloud/v1');

    // Minta daftar percakapan terakhir ke Botpress
    $response = Http::withHeaders([
        'Authorization' => "Bearer $token",
        'x-bot-id' => $botId,
    ])->get("$url/chat/conversations");

    return $response->json();
});
