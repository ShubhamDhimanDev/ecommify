<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\NotificationLog;
use App\Models\Tenant;
use App\Models\WebhookEndpoint;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'channel' => ['required', 'string', 'in:webhook,email'],
            'event_type' => ['required', 'string', 'max:120'],
            'subject' => ['nullable', 'string', 'max:255'],
            'recipient' => ['nullable', 'string', 'max:255'],
            'payload' => ['nullable', 'array'],
            'webhook_endpoint_id' => ['nullable', 'uuid'],
            'webhook_url' => ['nullable', 'url'],
        ]);

        $log = NotificationLog::query()->create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'channel' => $validated['channel'],
            'event_type' => $validated['event_type'],
            'subject' => $validated['subject'] ?? null,
            'recipient' => $validated['recipient'] ?? null,
            'payload' => $validated['payload'] ?? [],
            'status' => 'queued',
            'created_at' => now(),
        ]);

        if ($validated['channel'] === 'webhook') {
            $endpoint = null;

            if (! empty($validated['webhook_endpoint_id'])) {
                $endpoint = WebhookEndpoint::query()->findOrFail($validated['webhook_endpoint_id']);
            }

            $url = $validated['webhook_url'] ?? $endpoint?->url;
            if (! $url) {
                return response()->json(['message' => 'Webhook URL is required for webhook notifications.'], 422);
            }

            try {
                $response = Http::timeout(15)->withHeaders([
                    'X-Ecommify-Event' => $validated['event_type'],
                    'X-Ecommify-Tenant' => $tenant->id,
                    'X-Ecommify-Signature' => hash_hmac('sha256', json_encode($validated['payload'] ?? []), (string) ($endpoint?->secret ?? '')),
                ])->post($url, $validated['payload'] ?? []);

                $log->update([
                    'status' => $response->successful() ? 'sent' : 'failed',
                    'provider_response' => [
                        'status' => $response->status(),
                        'body' => $response->json() ?? $response->body(),
                    ],
                    'error_message' => $response->successful() ? null : 'Webhook delivery failed.',
                ]);

                if ($endpoint && $response->successful()) {
                    $endpoint->update(['last_triggered_at' => now()]);
                }
            } catch (\Throwable $e) {
                Log::warning('Webhook dispatch failed', ['error' => $e->getMessage(), 'tenant_id' => $tenant->id]);
                $log->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
            }
        } else {
            // Email provider integration can be attached later; we still persist intent and mark as queued.
            $log->update(['status' => 'queued']);
        }

        return response()->json(['notification' => $log->fresh()], 201);
    }

    public function logs(Request $request): JsonResponse
    {
        $logs = NotificationLog::query()
            ->when($request->filled('channel'), fn ($q) => $q->where('channel', $request->string('channel')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('event_type'), fn ($q) => $q->where('event_type', $request->string('event_type')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($logs);
    }

    public function registerWebhook(Request $request): JsonResponse
    {
        /** @var Tenant $tenant */
        $tenant = app(Tenant::class);

        $validated = $request->validate([
            'url' => ['required', 'url', 'max:2048'],
            'secret' => ['nullable', 'string', 'max:255'],
            'events' => ['nullable', 'array'],
            'events.*' => ['string', 'max:120'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $endpoint = WebhookEndpoint::query()->create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'url' => $validated['url'],
            'secret' => $validated['secret'] ?? null,
            'events' => $validated['events'] ?? [],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return response()->json(['webhook' => $endpoint], 201);
    }

    public function webhooks(Request $request): JsonResponse
    {
        $webhooks = WebhookEndpoint::query()
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($webhooks);
    }
}
