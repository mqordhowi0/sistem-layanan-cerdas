<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('status')->default('ai_active'); 
            
            // Relasi ke User (Peserta)
            $table->unsignedBigInteger('user_id')->nullable(); 
            
            // Relasi ke Operator (yang juga ada di tabel users)
            $table->unsignedBigInteger('operator_id')->nullable();

            // Definisi Foreign Key (Opsional tapi bagus untuk integritas)
            // $table->foreign('user_id')->references('id')->on('users');
            // $table->foreign('operator_id')->references('id')->on('users');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_sessions');
    }
};
