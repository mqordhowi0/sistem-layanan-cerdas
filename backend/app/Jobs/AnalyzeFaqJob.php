<?php

namespace App\Jobs;

use App\Models\FaqCandidate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log; // <-- TAMBAHKAN INI

class AnalyzeFaqJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $message;

    /**
     * Create a new job instance.
     */
    public function __construct(string $message)
    {
        $this->message = $message;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Kita akan "mengintip" proses di dalam job ini
        Log::info('AnalyzeFaqJob: Memulai handle() untuk pesan: ' . $this->message);

        try {
            // Cari kandidat yang pertanyaannya mirip
            $candidate = FaqCandidate::where('question_text', $this->message)
                                     ->where('status', 'pending')
                                     ->first();

            if ($candidate) {
                Log::info('AnalyzeFaqJob: Kandidat DITEMUKAN. Menambah count...');
                $candidate->increment('ask_count');
            } else {
                Log::info('AnalyzeFaqJob: Kandidat TIDAK DITEMUKAN. Membuat baru...');
                FaqCandidate::create([
                    'question_text' => $this->message,
                    'ask_count' => 1,
                    'status' => 'pending',
                ]);
            }

            Log::info('AnalyzeFaqJob: Selesai handle() TANPA ERROR.');

        } catch (\Exception $e) {
            // INI JARING PENGAMAN KITA
            // Jika error (misal: MassAssignment), kita akan catat manual
            Log::error('AnalyzeFaqJob: GAGAL DI DALAM JOB! Error: ' . $e->getMessage());
        }
    }
}