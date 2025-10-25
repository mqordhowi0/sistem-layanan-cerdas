<?php

namespace App\Models;

// INI ADALAH BARIS YANG HILANG
use Illuminate\Database\Eloquent\Factories\HasFactory; 
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    use HasFactory; // <-- Baris ini sekarang akan berfungsi

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'question',
        'answer',
    ];
}
