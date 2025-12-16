<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. ADMIN / OPERATOR (Role: 'admin')
        User::create([
            'name' => 'Super Admin',
            'email' => 'admin@stupen.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'bio' => 'Administrator Sistem.',
        ]);

        // 2. MAHASISWA (Role: 'user')
        User::create([
            'name' => 'Mahasiswa Test',
            'email' => 'mahasiswa@test.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'bio' => 'Mahasiswa aktif.',
        ]);
        
        $this->command->info('✅ Database Siap! Login Admin: admin@stupen.com | Pass: password');
    }
}