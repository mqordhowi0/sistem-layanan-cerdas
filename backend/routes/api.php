<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\OperatorController;

/*
|--------------------------------------------------------------------------
| Broadcast Routes
|--------------------------------------------------------------------------
| KEMBALIKAN: Pasang 'auth:sanctum'.
| Efek: Tamu akan kena 401 Unauthorized saat mencoba connect WebSocket.
| Admin & User Login aman dan realtime jalan.
*/
Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);

// --- PUBLIC ---
Route::post('/chat/start', [ChatController::class, 'startSession']);
Route::get('/chat/session/{sessionId}', [ChatController::class, 'loadSession']);
Route::post('/chat/send', [ChatController::class, 'sendMessage']);
Route::post('/chat/request-operator', [ChatController::class, 'requestOperator']);
Route::get('/faqs', [ChatController::class, 'getPublicFaqs']);
Route::delete('/chat/session/{sessionId}', [ChatController::class, 'deleteSession']);
Route::post('/login', [OperatorController::class, 'login']);
Route::post('/register', [OperatorController::class, 'register']);

// --- PROTECTED (ADMIN) ---
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) { return $request->user(); });
    Route::post('/operator/logout', [OperatorController::class, 'logout']);
    Route::post('/operator/profile-update', [OperatorController::class, 'updateProfile']);
    
    // Chat Management
    Route::get('/operator/pending-chats', [OperatorController::class, 'getPendingChats']);
    Route::get('/operator/active-chats', [OperatorController::class, 'getMyActiveChats']);
    Route::post('/operator/takeover/{sessionId}', [OperatorController::class, 'takeOverChat']);
    Route::post('/operator/end-session/{sessionId}', [OperatorController::class, 'endChatSession']);
    Route::get('/operator/chat/history/{sessionId}', [ChatController::class, 'getChatHistory']); 
    Route::post('/operator/send-message', [ChatController::class, 'sendOperatorMessage']); 
    
    // FAQ Management
    Route::get('/operator/faq-candidates', [OperatorController::class, 'getFaqCandidates']);
    Route::post('/operator/faq-create', [OperatorController::class, 'storeFaq']);
    Route::put('/operator/faq/{id}', [OperatorController::class, 'updateFaq']);
    Route::delete('/operator/faq/{id}', [OperatorController::class, 'destroyFaq']);
    Route::post('/operator/faq-approve/{candidateId}', [OperatorController::class, 'approveFaqCandidate']);
    Route::post('/operator/faq-reject/{candidateId}', [OperatorController::class, 'rejectFaqCandidate']);
});