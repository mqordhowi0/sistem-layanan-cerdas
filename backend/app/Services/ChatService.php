<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ChatService
{
    protected $apiKey;
    protected $chatbotId;
    protected $apiUrl = 'https://www.chatbase.co/api/v1/chat';

    public function __construct()
    {
        $this->apiKey = config('services.chatbase.api_key');
        $this->chatbotId = config('services.chatbase.chatbot_id');
    }

    /**
     * Mengirim pesan ke Chatbase dan mendapatkan balasan.
     *
     * @param string $message Teks pesan dari pengguna
     * @param string $sessionId ID sesi chat kita
     * @return string Balasan dari AI
     */
    public function getAiReply(string $message, int $sessionId): string
    {
        if (empty($this->apiKey) || empty($this->chatbotId)) {
            return "AI (Chatbase) belum dikonfigurasi. API Key/Chatbot ID kosong.";
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])
            ->withoutVerifying() // Untuk jaga-jaga jika ada error SSL
            ->post($this->apiUrl, [
                'messages' => [
                    ['content' => $message, 'role' => 'user']
                ],
                'chatbotId' => $this->chatbotId,
                'stream' => false,
                'conversationId' => 'session_' . $sessionId,
            ]);
            
            \Log::info('Respons dari Chatbase: ' . $response->body());

            if ($response->successful()) {
                // --- INI PERBAIKAN UTAMANYA ---
                // Jika $response->json('content') ternyata null,
                // kita akan berikan fallback string 'Maaf, AI...'
                // Ini DIJAMIN akan selalu mengembalikan string.
                return $response->json('text') ?? 'Maaf, AI tidak memberikan jawaban yang valid.';
            }

            // Jika API call gagal (misal: API key salah)
            return "Error dari Chatbase: " . $response->json('message', $response->body());

        } catch (\Exception $e) {
            // Jika server tidak bisa konek (misal: tidak ada internet)
            return "Error koneksi ke Chatbase: " . $e->getMessage();
        }
    }
}