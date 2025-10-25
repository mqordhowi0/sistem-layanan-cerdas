<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\OperatorController; // <-- Pastikan ini ada

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// === RUTE CHAT PESERTA (ANONIM) ===
Route::post('/chat/start', [ChatController::class, 'startSession']);
Route::post('/chat/send', [ChatController::class, 'sendMessage']);
Route::post('/chat/request-operator', [ChatController::class, 'requestOperator']);

// Endpoint PUBLIK untuk mengambil semua FAQ yang sudah disetujui
Route::get('/faqs', [ChatController::class, 'getPublicFaqs']);
// === RUTE OTENTIKASI OPERATOR ===
Route::post('/operator/register', [OperatorController::class, 'register']);
Route::post('/operator/login', [OperatorController::class, 'login']);

// === GRUP RUTE OPERATOR (WAJIB LOGIN) ===
Route::middleware('auth:sanctum')->group(function () {

    // --- Rute Auth ---
    Route::post('/operator/logout', [OperatorController::class, 'logout']);
    Route::get('/operator/me', [OperatorController::class, 'me']);

    // --- Rute Dashboard Chat ---
    Route::get('/operator/pending-chats', [OperatorController::class, 'getPendingChats']);
    Route::post('/operator/takeover/{sessionId}', [OperatorController::class, 'takeOverChat']);
    Route::post('/operator/send-message', [OperatorController::class, 'sendMessage']);

    // --- RUTE MANAJEMEN FAQ (TAMBAHAN BARU) ---
    // 1. Ambil semua kandidat FAQ
    Route::get('/operator/faq-candidates', [OperatorController::class, 'getFaqCandidates']);
    
    // 2. Setujui kandidat (dan tambahkan jawaban)
    Route::post('/operator/faq-approve/{candidateId}', [OperatorController::class, 'approveFaqCandidate']);

    // 3. Tolak kandidat
    Route::post('/operator/faq-reject/{candidateId}', [OperatorController::class, 'rejectFaqCandidate']);
});