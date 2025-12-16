<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatSession extends Model
{
    use HasFactory;

    // PERBAIKAN UTAMA: Pastikan 'operator_id' ada disini!
    protected $fillable = [
        'user_id',
        'operator_id', // <--- PENTING: Agar admin bisa mengambil alih chat
        'status'
    ];

    /**
     * Relasi ke User (Tamu/Member)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relasi ke Operator (Admin)
     */
    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    /**
     * Relasi ke Pesan
     */
    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }
}