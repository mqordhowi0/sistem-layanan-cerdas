<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Operator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// Impor untuk Dashboard
use App\Models\ChatSession;
use App\Models\ChatMessage;
use App\Events\NewMessageSent;

// Impor untuk Manajemen FAQ
use App\Models\Faq;
use App\Models\FaqCandidate;

class OperatorController extends Controller
{
    /**
     * Registrasi operator baru (HANYA UNTUK TESTING)
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:operators',
            'password' => 'required|string|min:8',
        ]);

        $operator = Operator::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password, // Model kita otomatis HASH password-nya
        ]);

        return response()->json([
            'message' => 'Registrasi operator berhasil!',
            'operator' => $operator
        ], 201);
    }

    /**
     * Login untuk operator
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 1. Cari operator berdasarkan email
        $operator = Operator::where('email', $request->email)->first();

        // 2. Cek operator ada DAN password-nya benar
        if (! $operator || ! Hash::check($request->password, $operator->password)) {
            // Jika gagal, lempar error
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan salah.'],
            ]);
        }

        // 3. Jika berhasil, buatkan token baru
        $token = $operator->createToken('operator-token')->plainTextToken;

        // 4. Kirim balasan token
        return response()->json([
            'message' => 'Login berhasil!',
            'operator' => $operator,
            'token' => $token,
        ]);
    }

    /**
     * Logout untuk operator (yang sedang login)
     */
    public function logout(Request $request)
    {
        // Hapus token yang sedang dipakai
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil!'
        ]);
    }

    /**
     * Mendapatkan data operator (yang sedang login)
     */
    public function me(Request $request)
    {
        // $request->user() otomatis berisi data Operator yang sedang login
        return response()->json($request->user());
    }

    /**
     * [DASHBOARD] Mengambil semua sesi chat yang antri (pending_operator).
     */
    public function getPendingChats(Request $request)
    {
        $pendingChats = ChatSession::where('status', 'pending_operator')->get();
        
        return response()->json($pendingChats);
    }

    /**
     * [DASHBOARD] Operator mengambil alih sesi chat.
     */
    public function takeOverChat(Request $request, $sessionId)
    {
        $session = ChatSession::findOrFail($sessionId);
        $operator = $request->user(); // Mendapatkan operator yang sedang login

        // 1. Ubah status sesi dan catat siapa operatornya
        $session->update([
            'status' => 'operator_active',
            'operator_id' => $operator->id
        ]);

        // 2. Buat pesan sistem baru
        $systemMessage = ChatMessage::create([
            'chat_session_id' => $session->id,
            'sender_type' => 'ai', // 'ai' = 'sistem'
            'message' => "Operator {$operator->name} telah bergabung dalam percakapan."
        ]);

        // 3. Kirim notifikasi real-time ke frontend peserta
        NewMessageSent::dispatch($systemMessage);

        return response()->json([
            'status' => 'success',
            'message' => 'Chat taken over.',
            'session' => $session
        ]);
    }

    /**
     * [DASHBOARD] Operator mengirim pesan ke sesi.
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'session_id' => 'required|integer|exists:chat_sessions,id'
        ]);

        $operator = $request->user(); // Operator yang sedang login

        // 1. Buat pesan baru DENGAN SENDER_TYPE 'operator'
        $message = ChatMessage::create([
            'chat_session_id' => $request->session_id,
            'sender_type' => 'operator',
            'message' => $request->message
        ]);

        // 2. Kirim notifikasi real-time ke frontend peserta
        NewMessageSent::dispatch($message);

        return response()->json($message);
    }

    /**
     * [DASHBOARD] Mengambil semua kandidat FAQ yang masih pending.
     */
    public function getFaqCandidates(Request $request)
    {
        // Ambil yang pending, urutkan dari yang paling sering ditanya
        $candidates = FaqCandidate::where('status', 'pending')
                                  ->orderBy('ask_count', 'desc')
                                  ->get();
        
        return response()->json($candidates);
    }

    /**
     * [DASHBOARD] Operator menyetujui kandidat FAQ.
     */
    public function approveFaqCandidate(Request $request, $candidateId)
    {
        // Operator HARUS memberikan jawaban
        $request->validate([
            'answer' => 'required|string|min:3',
        ]);

        $candidate = FaqCandidate::findOrFail($candidateId);

        // 1. Buat FAQ baru di tabel 'faqs'
        $faq = Faq::create([
            'question' => $candidate->question_text,
            'answer' => $request->input('answer'),
        ]);

        // 2. Update status kandidat
        $candidate->update([
            'status' => 'approved'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'FAQ approved and published.',
            'faq' => $faq
        ]);
    }

    /**
     * [DASHBOARD] Operator menolak kandidat FAQ.
     */
    public function rejectFaqCandidate(Request $request, $candidateId)
    {
        $candidate = FaqCandidate::findOrFail($candidateId);

        // Cukup ubah statusnya
        $candidate->update([
            'status' => 'rejected'
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'FAQ candidate rejected.'
        ]);
    }
}