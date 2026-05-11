<?php

declare(strict_types=1);

namespace App\Traits;

trait UUIDPrimary
{
    public function initializeUUIDPrimary(): void
    {
        $this->incrementing = false;
        $this->keyType = 'string';
    }
}
