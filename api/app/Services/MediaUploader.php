<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaUploader
{
    public function uploadProductMedia(UploadedFile $file, Tenant $tenant): array
    {
        $diskName = (string) config('media.disk', 'media_local');
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $filename = Str::uuid()->toString().'.'.$extension;
        $storagePath = $disk->putFileAs($tenant->slug.'/products', $file, $filename);

        $mimeType = (string) ($file->getMimeType() ?: $file->getClientMimeType());
        $mediaType = str_starts_with($mimeType, 'video/') ? 'video' : 'image';

        return [
            'image_url' => $disk->url($storagePath),
            'media_type' => $mediaType,
            'storage_path' => $storagePath,
            'alt_text' => null,
            'sort_order' => 0,
            'file_size' => $file->getSize(),
            'mime_type' => $mimeType ?: null,
            'disk' => $diskName,
        ];
    }

    public function deleteByPath(?string $storagePath, ?string $diskName = null): void
    {
        if (! $storagePath) {
            return;
        }

        $targetDisk = $diskName ?: (string) config('media.disk', 'media_local');
        Storage::disk($targetDisk)->delete($storagePath);
    }
}
