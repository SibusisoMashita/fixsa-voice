<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VoiceTokenTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_voice_token_is_minted_server_side_without_exposing_the_api_key(): void
    {
        config(['services.assemblyai.key' => 'secret-server-key']);
        Http::preventStrayRequests();
        Http::fake(['agents.assemblyai.com/*' => Http::response(['token' => 'temporary-token', 'expires_in_seconds' => 120])]);

        $this->getJson('/api/v1/voice/token')
            ->assertOk()->assertJson(['token' => 'temporary-token', 'expiresInSeconds' => 120])->assertJsonMissing(['secret-server-key']);

        Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer secret-server-key'));
    }

    public function test_returns_503_when_assemblyai_is_unreachable(): void
    {
        config(['services.assemblyai.key' => 'secret-server-key']);
        Http::preventStrayRequests();
        Http::fake(['agents.assemblyai.com/*' => Http::failedConnection()]);

        $this->getJson('/api/v1/voice/token')
            ->assertServiceUnavailable()
            ->assertJsonPath('error', 'AssemblyAI token service is temporarily unavailable.');
    }
}
