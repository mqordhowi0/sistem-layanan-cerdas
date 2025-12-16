<?php

namespace App\Events;

use App\Models\ChatMessage;
use App\Models\ChatSession; // Import Model Sesi
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; 
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(ChatMessage $message)
    {
        $this->message = $message;
    }

    public function broadcastOn(): array
    {
        // 1. Kirim ke Channel Chat Room (Wajib)
        $channels = [
            new PrivateChannel('chat-session.' . $this->message->chat_session_id),
        ];

        // 2. LOGIKA TAMBAHAN: Update Counter Dashboard Admin
        // Jika pengirim adalah USER dan Sesi sedang dipegang OPERATOR
        if ($this->message->sender_type === 'user') {
            // Ambil sesi untuk cek status
            $session = ChatSession::find($this->message->chat_session_id);
            
            if ($session && $session->status === 'operator_active') {
                // Kirim juga ke dashboard admin agar counter bertambah realtime
                $channels[] = new PrivateChannel('operator-dashboard');
            }
        }

        return $channels;
    }

    public function broadcastAs()
    {
        return 'NewMessageSent';
    }
}