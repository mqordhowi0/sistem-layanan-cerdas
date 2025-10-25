<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'chat_session_id',
        'sender_type',
        'message',
    ];

    /**
     * Relasi ke ChatSession.
     */
    public function session()
    {
        return $this->belongsTo(ChatSession::class, 'chat_session_id');
    }
}