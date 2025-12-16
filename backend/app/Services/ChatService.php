<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatService
{
    protected $apiKey;
    protected $teamId;
    protected $botId;

    public function __construct()
    {
        $this->apiKey = env('DOCSBOT_API_KEY');
        $this->teamId = env('DOCSBOT_TEAM_ID');
        $this->botId = env('DOCSBOT_BOT_ID');
    }

    public function getAiReply(string $message, int $sessionId): string
    {
        if (empty($this->apiKey)) {
            return "Error: API Key DocsBot kosong.";
        }

        try {
            // URL Endpoint DocsBot
            $url = "https://api.docsbot.ai/teams/{$this->teamId}/bots/{$this->botId}/ask";

            // Kirim Request
            // DocsBot tidak menggunakan Bearer Token di header Authorization untuk endpoint ini biasanya,
            // tapi kita coba standard approach dulu.
            $response = Http::post($url, [
                'question' => $message,
                'full_source' => false,
                // Kirim API Key di body atau header? DocsBot API v1 biasanya via URL atau Body untuk public,
                // tapi untuk private API pakai Header.
                // Kita gunakan cara paling aman: Kirim semua.
            ]);

            // Jika gagal pertama (401/403), coba pakai Header Authorization
            if ($response->status() >= 400) {
                 $response = Http::withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}"
                 ])->post($url, [
                    'question' => $message,
                    'history' => [] // Kirim history kosong atau ambil dari DB jika mau fitur 'ingat'
                 ]);
            }

            if ($response->successful()) {
                $data = $response->json();
                return $data['answer'] ?? "Maaf, saya tidak menemukan jawaban di database.";
            }

            Log::error("DocsBot Error: " . $response->body());
            return "Gagal: " . $response->body();

        } catch (\Exception $e) {
            Log::error('ChatService Exception: ' . $e->getMessage());
            return "Kesalahan server internal.";
        }
    }
}