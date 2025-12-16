<?php

namespace App\Events;

use App\Models\FaqCandidate;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // PENTING: Pakai Now
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FaqCandidateCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $candidate;

    /**
     * Create a new event instance.
     */
    public function __construct(FaqCandidate $candidate)
    {
        $this->candidate = $candidate;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        // Kirim ke channel dashboard admin
        return [
            new PrivateChannel('operator-dashboard'),
        ];
    }

    public function broadcastAs()
    {
        // Nama event yang akan didengar frontend
        return 'FaqCandidateCreated';
    }
}