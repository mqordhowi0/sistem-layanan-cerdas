<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FaqCandidate extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_text',
        'ask_count',
        'status' // pending, approved, rejected
    ];
}