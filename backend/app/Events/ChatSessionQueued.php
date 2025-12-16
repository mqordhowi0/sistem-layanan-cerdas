<?php

namespace App\Events;

use App\Models\ChatSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // PENTING: Pakai NOW
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatSessionQueued implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $session;

    public function __construct(ChatSession $session)
    {
        $this->session = $session;
    }

    public function broadcastOn(): array
    {
        // Channel khusus admin
        return [
            new PrivateChannel('operator-dashboard'),
        ];
    }

    public function broadcastAs()
    {
        // Nama event yang didengar frontend (Tanpa Namespace)
        return 'ChatSessionQueued';
    }
}