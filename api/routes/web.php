<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

use App\Http\Controllers\TestController;

// Health check / root — API requests come through /api prefix.
// This file is kept minimal as the project is API-only.
Route::get('/', fn () => response()->json([
    'app'     => config('app.name'),
    'version' => 'v1',
    'status'  => 'ok',
]));

// Serve media files from the media disk (stored outside /api/public).
Route::get('/storage/{path}', function (string $path) {
    $disk = config('media.disk', 'media_local');

    if (! Storage::disk($disk)->exists($path)) {
        abort(404);
    }

    return Storage::disk($disk)->response($path);
})->where('path', '.*');

Route::get('/test/{id}', [TestController::class, 'index'])->whereUuid('id');;
