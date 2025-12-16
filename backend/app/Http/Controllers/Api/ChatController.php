<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;

// --- Import Model ---
use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\Faq;
use App\Models\FaqCandidate;

// --- Import Service & Events ---
use App\Services\ChatService;
use App\Events\NewMessageSent;
use App\Events\ChatSessionQueued;
use App\Events\FaqCandidateCreated; // Untuk update realtime tabel kandidat FAQ
use App\Events\ChatSessionEnded;    // Untuk memberitahu admin sesi dihapus

class ChatController extends Controller
{
    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    // =========================================================================
    // PUBLIC / USER FUNCTIONS
    // =========================================================================

    /**
     * 1. START SESSION
     * Memulai sesi baru (untuk User Login atau Guest)
     */
    public function startSession(Request $request)
    {
        $userId = null;
        
        // Cek Token manual jika ada (untuk Guest yang mungkin punya token expired/valid)
        $token = $request->bearerToken();
        if ($token) {
            $accessToken = PersonalAccessToken::findToken($token);
            if ($accessToken && $accessToken->tokenable) {
                 $userId = $accessToken->tokenable->id;
            }
        }

        $session = ChatSession::create([
            'status' => 'ai_active',
            'user_id' => $userId, 
        ]);

        return response()->json([
            'status' => 'success',
            'session_id' => $session->id,
            'is_guest' => is_null($userId)
        ]);
    }

    /**
     * 2. LOAD SESSION
     * Memuat riwayat chat untuk User
     */
    public function loadSession($sessionId)
    {
        $session = ChatSession::find($sessionId);
        if (!$session) return response()->json(['message' => 'Not found'], 404);
        
        $messages = ChatMessage::where('chat_session_id', $sessionId)
                             ->orderBy('created_at', 'asc')
                             ->get();
                             
        return response()->json(['session' => $session, 'messages' => $messages]);
    }

    /**
     * 3. SEND MESSAGE
     * Menangani pesan dari user -> AI -> atau Operator
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'required|integer|exists:chat_sessions,id'
        ]);

        $sessionId = $request->input('session_id');
        $messageText = $request->input('message');
        $session = ChatSession::find($sessionId);

        // A. Simpan Pesan User
        $userMessage = ChatMessage::create([
            'chat_session_id' => $sessionId,
            'sender_type' => 'user',
            'message' => $messageText
        ]);

        // Broadcast ke Admin/User lain
        try { broadcast(new NewMessageSent($userMessage))->toOthers(); } catch (\Exception $e) {}

        // B. Logika Respon (Hanya jika status AI Active)
        if ($session->status === 'ai_active') {
            
            // --- LOGIKA FAQ CANDIDATE (REALTIME UPDATE) ---
            if (str_contains($messageText, '?')) {
                // Cari apakah pertanyaan ini sudah ada di kandidat
                $existingCandidate = FaqCandidate::where('question_text', $messageText)->first();

                if ($existingCandidate) {
                    // Jika SUDAH ADA: Tambah counter
                    $existingCandidate->increment('ask_count');
                    
                    // Broadcast update ke dashboard admin
                    try { broadcast(new FaqCandidateCreated($existingCandidate)); } catch (\Exception $e) {}
                } else {
                    // Jika BELUM ADA: Buat baru
                    $newCandidate = FaqCandidate::create([
                        'question_text' => $messageText,
                        'ask_count' => 1,
                        'status' => 'pending'
                    ]);
                    
                    // Broadcast new candidate ke dashboard admin
                    try { broadcast(new FaqCandidateCreated($newCandidate)); } catch (\Exception $e) {}
                }
            }
            // -------------------------------------

            // C. Cek Jawaban Resmi FAQ Database (Prioritas Utama)
            $faq = Faq::where('question', 'like', "%{$messageText}%")->first();
            
            if ($faq) {
                $aiReplyText = $faq->answer;
            } else {
                // D. Tanya AI Service (Botpress/OpenAI/DocsBot)
                $aiReplyText = $this->chatService->getAiReply($messageText, $sessionId);
            }

            $aiMessage = ChatMessage::create([
                'chat_session_id' => $sessionId,
                'sender_type' => 'ai',
                'message' => $aiReplyText
            ]);

            try { broadcast(new NewMessageSent($aiMessage)); } catch (\Exception $e) {}
            
            return response()->json($aiMessage);
        }

        // Jika status sedang bersama operator, cukup return pesan user saja (operator balas manual nanti)
        return response()->json($userMessage);
    }

    /**
     * 4. REQUEST OPERATOR
     * User meminta terhubung ke manusia
     */
    public function requestOperator(Request $request)
    {
        $request->validate(['session_id' => 'required']);
        $session = ChatSession::find($request->session_id);
        
        $session->update(['status' => 'pending_operator']);

        $msg = ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender_type' => 'ai',
            'message' => 'Menghubungkan ke operator...'
        ]);
        
        try {
            broadcast(new NewMessageSent($msg));
            broadcast(new ChatSessionQueued($session)); // Masuk antrian admin
        } catch (\Exception $e) {}

        return response()->json(['status' => 'success']);
    }

    /**
     * 5. DELETE SESSION (NEW CHAT)
     * Menghapus sesi lama dan memberitahu admin
     */
    public function deleteSession($sessionId)
    {
        $session = ChatSession::find($sessionId);
        
        if ($session) {
            // 1. Beritahu semua orang (Admin) di room ini bahwa sesi berakhir
            try {
                broadcast(new ChatSessionEnded($sessionId));
            } catch (\Exception $e) {}

            // 2. Hapus Pesan & Sesi
            ChatMessage::where('chat_session_id', $sessionId)->delete();
            $session->delete();
        }
        
        return response()->json(['status' => 'deleted']);
    }

    /**
     * 6. PUBLIC FAQS
     * Mengambil daftar FAQ untuk halaman depan
     */
    public function getPublicFaqs()
    {
        return response()->json(Faq::latest()->take(10)->get());
    }

    // =========================================================================
    // ADMIN FUNCTIONS (Dipanggil oleh Admin Panel)
    // =========================================================================

    public function getChatHistory(Request $request, $sessionId)
    {
        $messages = ChatMessage::where('chat_session_id', $sessionId)->orderBy('created_at', 'asc')->get();
        $session = ChatSession::find($sessionId);
        
        if (!$session) return response()->json(['message' => 'Session not found'], 404);

        return response()->json(['session' => $session, 'messages' => $messages]);
    }

    public function sendOperatorMessage(Request $request)
    {
        $request->validate(['message' => 'required', 'session_id' => 'required']);
        
        $msg = ChatMessage::create([
            'chat_session_id' => $request->session_id,
            'sender_type' => 'operator',
            'operator_id' => $request->user()->id,
            'message' => $request->message
        ]);
        
        try { broadcast(new NewMessageSent($msg)); } catch (\Exception $e) {}
        
        return response()->json($msg);
    }
}