<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

// --- Impor Model ---
use App\Models\ChatSession;
use App\Models\ChatMessage;
// --- Impor Service ---
use App\Services\ChatService;
// --- Impor Event & Job (BARU) ---
use App\Events\NewMessageSent;
use App\Jobs\AnalyzeFaqJob;
use App\Events\ChatSessionQueued;
use App\Models\Faq;

class ChatController extends Controller
{
    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    public function startSession(Request $request)
    {
        $session = ChatSession::create([
            'status' => 'ai_active',
        ]);

        return response()->json([
            'status' => 'success',
            'session_id' => $session->id
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'required|integer|exists:chat_sessions,id'
        ]);

        $userMessageText = $request->input('message');
        $sessionId = $request->input('session_id');

        // 1. Simpan pesan PENGGUNA
        $userMessage = ChatMessage::create([
            'chat_session_id' => $sessionId,
            'sender_type' => 'user',
            'message' => $userMessageText
        ]);

        // --- KIRIM EVENT REAL-TIME (BARU) ---
        NewMessageSent::dispatch($userMessage);

        // --- KIRIM JOB ANALISIS FAQ (BARU) ---
        // Kita hanya menganalisis pertanyaan user, bukan jawaban AI
        AnalyzeFaqJob::dispatch($userMessageText);

        // 2. Panggil ChatService
        $aiReplyText = $this->chatService->getAiReply($userMessageText, $sessionId);

        // 3. Simpan pesan AI
        $aiMessage = ChatMessage::create([
            'chat_session_id' => $sessionId,
            'sender_type' => 'ai',
            'message' => $aiReplyText
        ]);

        // --- KIRIM EVENT REAL-TIME (BARU) ---
        NewMessageSent::dispatch($aiMessage);

        // 4. Kirim balasan AI (Hanya balasan AI saja)
        // Frontend akan dapat 2 pesan dari WebSocket (user & AI),
        // tapi kita tetap kirim balasan ini agar frontend tahu prosesnya selesai.
        return response()->json($aiMessage);
    }
    public function requestOperator(Request $request)
    {
    $request->validate([
        'session_id' => 'required|integer|exists:chat_sessions,id'
    ]);

    $sessionId = $request->input('session_id');
    $session = ChatSession::find($sessionId);

    // 1. Ubah status sesi
    $session->update([
        'status' => 'pending_operator'
    ]);

    // 2. Buat "Pesan Sistem" di chat
    $systemMessage = ChatMessage::create([
        'chat_session_id' => $sessionId,
        'sender_type' => 'ai', // Kita anggap 'ai' sebagai 'sistem'
        'message' => 'Permintaan operator telah diteruskan. Mohon tunggu...'
    ]);

    // 3. Kirim pesan sistem itu ke user (via Reverb)
    NewMessageSent::dispatch($systemMessage);

    // 4. KIRIM NOTIFIKASI KE DASHBOARD OPERATOR (PENTING)
    ChatSessionQueued::dispatch($session);

    return response()->json([
        'status' => 'success',
        'message' => 'Operator requested.',
        'chat_message' => $systemMessage
    ]);
    }
    public function getPublicFaqs(Request $request)
    {
        // Ambil semua dari tabel 'faqs', urutkan dari yang terbaru
        $faqs = Faq::orderBy('created_at', 'desc')->get();

        return response()->json($faqs);
    }
}