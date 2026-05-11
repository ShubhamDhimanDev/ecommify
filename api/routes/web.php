<?php

use Illuminate\Support\Facades\Route;

// Health check / root — API requests come through /api prefix.
// This file is kept minimal as the project is API-only.
Route::get('/', fn () => response()->json([
    'app'     => config('app.name'),
    'version' => 'v1',
    'status'  => 'ok',
]));
