<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware; // WAJIB DI-USE

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        channels: __DIR__.'/../routes/channels.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // --- AKTIVASI CORS BAWAAN LARAVEL ---
        // PENTING: Jangan gunakan ValidateCsrfTokens di API, tapi untuk Sanctum kita aktifkan pengecualian
        $middleware->validateCsrfTokens(except: [
            'api/*', 
            'sanctum/csrf-cookie',
        ]);
        
        // Tambahkan CORS Middleware ini agar React bisa akses API
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);
    })
    ->withExceptions(function (Exceptions $exceptions) {
    })->create();