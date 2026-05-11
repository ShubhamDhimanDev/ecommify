<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Media Storage Disk
    |--------------------------------------------------------------------------
    |
    | Set this to any configured filesystem disk. Use "media_local" for local
    | root-level storage (../storage), or "s3" for cloud object storage.
    |
    */
    'disk' => env('MEDIA_DISK', 'media_local'),
];
