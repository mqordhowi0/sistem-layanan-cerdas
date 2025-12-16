<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

// --- Import Model ---
use App\Models\User;
use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Models\Faq;
use App\Models\FaqCandidate;

// --- Import Event ---
use App\Events\NewMessageSent;

class OperatorController extends Controller
{
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================

    /**
     * Login User/Admin & Return Token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 1. Cek Kredensial
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        // 2. Ambil User
        $user = User::where('email', $request->email)->firstOrFail();
        
        // 3. Hapus token lama (Opsional: Single Session)
        $user->tokens()->delete();

        // 4. Buat Token Baru
        $token = $user->createToken('auth_token')->plainTextToken;

        // 5. Return Response (Sertakan Role)
        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token, 
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role, 
                'bio' => $user->bio
            ]
        ]);
    }

    /**
     * Register User Baru (Default Role: User)
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
            'bio' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil!',
            'token' => $token,
            'user' => $user
        ], 201);
    }

    /**
     * Logout (Hapus Token)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil!']);
    }

    /**
     * Cek User Saat Ini
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
    
    /**
     * Update Profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user(); 
        $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email,' . $user->id,
            'bio' => 'nullable|string|max:1000', 
        ]);
        
        $user->update(array_filter($request->only(['name', 'email', 'bio'])));
        
        return response()->json([
            'message' => 'Profile updated!', 
            'operator' => $user 
        ]);
    }

    // =========================================================================
    // CHAT MANAGEMENT (ADMIN)
    // =========================================================================

    /**
     * Ambil daftar chat yang menunggu operator (Pending)
     */
    public function getPendingChats(Request $request)
    {
        $chats = ChatSession::where('status', 'pending_operator')
                            ->orderBy('updated_at', 'asc')
                            ->get();
        return response()->json($chats);
    }

    /**
     * Ambil daftar chat yang sedang dihandle oleh Admin ini (Active)
     * UPDATE: Menambahkan message_count (Hanya chat user)
     */
    public function getMyActiveChats(Request $request)
    {
        $operatorId = $request->user()->id;

        // Gunakan Eager Loading 'user' agar performa lebih cepat
        $chats = ChatSession::with('user')
            ->where('status', 'operator_active')
            ->where('operator_id', $operatorId)
            // Hitung jumlah pesan, TAPI hanya yang dikirim oleh 'user'
            ->withCount(['messages' => function ($query) {
                $query->where('sender_type', 'user');
            }])
            ->orderBy('updated_at', 'desc')
            ->get();

        // Format data agar sesuai kebutuhan Frontend
        $formattedChats = $chats->map(function ($chat) {
            return [
                'id' => $chat->id,
                // Logika Guest: Jika relasi user null, maka dia Guest
                'user_name' => $chat->user ? $chat->user->name : 'Guest', 
                'status' => $chat->status,
                'updated_at' => $chat->updated_at,
                // Field ini akan dibaca oleh AdminDashboard.jsx
                'message_count' => $chat->messages_count 
            ];
        });

        return response()->json($formattedChats);
    }

    /**
     * Ambil Alih Chat (Pending -> Active)
     */
    public function takeOverChat(Request $request, $sessionId)
    {
        $session = ChatSession::findOrFail($sessionId);
        $operator = $request->user();
        
        $session->update([
            'status' => 'operator_active',
            'operator_id' => $operator->id
        ]);

        // Notifikasi Sistem: Operator Bergabung
        $msg = ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender_type' => 'ai', 
            'message' => "Operator {$operator->name} telah bergabung dalam percakapan."
        ]);
        try { broadcast(new NewMessageSent($msg)); } catch (\Exception $e) {}

        return response()->json(['status' => 'success']);
    }

    /**
     * Akhiri Sesi Chat (Active -> AI Active / Selesai)
     * Mengembalikan user ke AI
     */
    public function endChatSession(Request $request, $sessionId)
    {
        $session = ChatSession::findOrFail($sessionId);
        
        // Kembalikan ke AI
        $session->update([
            'status' => 'ai_active',
            'operator_id' => null 
        ]);

        // Notifikasi Sistem: Sesi Berakhir
        $msg = ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender_type' => 'ai', 
            'message' => "Sesi dengan operator telah berakhir. Anda kembali terhubung dengan AI Assistant."
        ]);
        try { broadcast(new NewMessageSent($msg)); } catch (\Exception $e) {}

        return response()->json(['status' => 'success', 'message' => 'Sesi diakhiri.']);
    }

    // =========================================================================
    // FAQ MANAGEMENT
    // =========================================================================

    /**
     * Ambil Kandidat FAQ (Pertanyaan user yang belum dijawab AI)
     */
    public function getFaqCandidates(Request $request)
    {
        $candidates = FaqCandidate::where('status', 'pending')
                                  ->orderBy('ask_count', 'desc')
                                  ->get();
        return response()->json($candidates);
    }

    /**
     * Tambah FAQ Manual (Tanpa Kandidat)
     */
    public function storeFaq(Request $request)
    {
        $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
        ]);

        $faq = Faq::create([
            'question' => $request->input('question'),
            'answer' => $request->input('answer'),
        ]);

        return response()->json([
            'status' => 'success',
            'faq' => $faq,
            'message' => 'FAQ berhasil ditambahkan.'
        ]);
    }

    /**
     * Update FAQ yang sudah ada
     */
    public function updateFaq(Request $request, $id)
    {
        $request->validate([
            'question' => 'required|string',
            'answer' => 'required|string',
        ]);

        $faq = Faq::findOrFail($id);
        $faq->update([
            'question' => $request->input('question'),
            'answer' => $request->input('answer'),
        ]);

        return response()->json(['status' => 'success', 'message' => 'FAQ berhasil diperbarui.']);
    }

    /**
     * Hapus FAQ
     */
    public function destroyFaq($id)
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();
        return response()->json(['status' => 'success', 'message' => 'FAQ berhasil dihapus.']);
    }

    /**
     * Approve Kandidat -> Jadi FAQ Publik
     */
    public function approveFaqCandidate(Request $request, $candidateId)
    {
        $request->validate(['answer' => 'required|string']);
        $candidate = FaqCandidate::findOrFail($candidateId);
        
        $faq = Faq::create([
            'question' => $candidate->question_text,
            'answer' => $request->input('answer'),
        ]);

        $candidate->update(['status' => 'approved']);

        return response()->json(['status' => 'success', 'faq' => $faq]);
    }

    /**
     * Tolak Kandidat
     */
    public function rejectFaqCandidate(Request $request, $candidateId)
    {
        $candidate = FaqCandidate::findOrFail($candidateId);
        $candidate->update(['status' => 'rejected']);
        
        return response()->json(['status' => 'success']);
    }
}