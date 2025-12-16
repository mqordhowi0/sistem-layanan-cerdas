<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatSessionEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $sessionId;

    /**
     * Create a new event instance.
     */
    public function __construct($sessionId)
    {
        $this->sessionId = $sessionId;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Broadcast ke channel room spesifik agar Admin yang sedang memantau room ini tahu
        return [
            new PrivateChannel('chat-session.' . $this->sessionId),
        ];
    }

    public function broadcastAs()
    {
        return 'ChatSessionEnded';
    }
}