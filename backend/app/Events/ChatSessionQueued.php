<?php

namespace App\Events;

use App\Models\ChatSession;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast; // Pastikan ini ada
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// Ubah agar "implements ShouldBroadcast"
class ChatSessionQueued implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // Data sesi yang akan kita kirim ke dashboard operator
    public ChatSession $session;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatSession $session)
    {
        $this->session = $session;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Ini adalah channel privat untuk semua operator
        // Semua operator yang login akan mendengarkan channel ini
        return [
            new PrivateChannel('operator-dashboard'),
        ];
    }
}