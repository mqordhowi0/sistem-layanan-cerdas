<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_session_id',
        'sender_type', // user, ai, operator
        'operator_id',
        'message',
        'is_read'
    ];

    /**
     * Relasi ke Sesi Chat
     */
    public function session()
    {
        return $this->belongsTo(ChatSession::class, 'chat_session_id');
    }
}