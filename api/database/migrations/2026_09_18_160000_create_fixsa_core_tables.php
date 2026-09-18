<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('slug', 100)->unique();
            $table->string('name', 120);
            $table->string('municipality', 160)->nullable();
            $table->string('province', 80)->default('Gauteng');
            $table->decimal('centroid_latitude', 10, 7)->nullable();
            $table->decimal('centroid_longitude', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('sla_rules', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('category', 48);
            $table->string('priority', 32);
            $table->unsignedInteger('target_minutes');
            $table->timestamp('active_from');
            $table->timestamp('active_to')->nullable();
            $table->timestamps();
            $table->unique(['category', 'priority', 'active_from']);
            $table->index(['priority', 'active_to']);
        });

        Schema::create('report_sequences', function (Blueprint $table) {
            $table->unsignedSmallInteger('year')->primary();
            $table->unsignedInteger('next_value')->default(1000);
            $table->timestamp('updated_at')->nullable();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('reference', 20)->unique();
            $table->foreignUlid('area_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('reported_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUlid('duplicate_of_id')->nullable()->constrained('reports')->nullOnDelete();
            $table->string('source', 24);
            $table->string('category', 48);
            $table->string('status', 32)->default('reported');
            $table->string('priority', 32);
            $table->string('severity', 24);
            $table->text('description');
            $table->string('address', 255);
            $table->string('public_address', 255);
            $table->string('landmark', 255)->nullable();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('location_precision', 24)->default('approximate');
            $table->string('reported_duration', 160)->nullable();
            $table->unsignedInteger('people_affected')->default(0);
            $table->json('hazard_flags')->nullable();
            $table->string('audio_retention', 32)->default('not_recorded');
            $table->boolean('safety_hold')->default(false);
            $table->boolean('synthetic')->default(false);
            $table->timestamp('sla_due_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->unsignedInteger('lock_version')->default(1);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority', 'sla_due_at'], 'reports_work_queue_idx');
            $table->index(['area_id', 'status', 'created_at'], 'reports_area_status_idx');
            $table->index(['category', 'status', 'created_at'], 'reports_category_status_idx');
            $table->index(['latitude', 'longitude'], 'reports_geo_bbox_idx');
        });

        Schema::create('transcript_segments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sequence');
            $table->string('speaker', 24);
            $table->text('text');
            $table->timestamp('spoken_at')->nullable();
            $table->boolean('is_final')->default(true);
            $table->timestamps();
            $table->unique(['report_id', 'sequence']);
        });

        Schema::create('evidence', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 32);
            $table->string('disk', 32)->nullable();
            $table->string('path', 500)->nullable();
            $table->string('original_name', 255);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('bytes')->nullable();
            $table->char('checksum_sha256', 64)->nullable();
            $table->boolean('is_public')->default(false);
            $table->timestamp('captured_at')->nullable();
            $table->timestamps();
            $table->index(['report_id', 'kind', 'created_at']);
            $table->index('checksum_sha256');
        });

        Schema::create('report_notes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('author_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('visibility', 16)->default('internal');
            $table->text('body');
            $table->timestamps();
            $table->index(['report_id', 'visibility', 'created_at']);
        });

        Schema::create('status_events', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type', 24);
            $table->string('from_status', 32)->nullable();
            $table->string('to_status', 32);
            $table->text('note');
            $table->boolean('is_public')->default(false);
            $table->uuid('request_id')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['report_id', 'occurred_at']);
            $table->index(['to_status', 'occurred_at']);
            $table->index('request_id');
        });

        Schema::create('report_assignments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assignee_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('team_name', 160)->nullable();
            $table->timestamp('assigned_at');
            $table->timestamp('unassigned_at')->nullable();
            $table->timestamps();
            $table->index(['report_id', 'unassigned_at']);
            $table->index(['assignee_user_id', 'unassigned_at']);
        });

        Schema::create('duplicate_matches', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('candidate_report_id')->constrained('reports')->cascadeOnDelete();
            $table->decimal('score', 5, 4);
            $table->unsignedInteger('distance_metres');
            $table->json('rationale');
            $table->string('resolution', 24)->default('pending');
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->unique(['report_id', 'candidate_report_id']);
            $table->index(['resolution', 'score']);
        });

        Schema::create('report_merges', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('primary_report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignUlid('merged_report_id')->unique()->constrained('reports')->cascadeOnDelete();
            $table->foreignId('merged_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 500);
            $table->timestamp('merged_at');
            $table->timestamps();
            $table->index(['primary_report_id', 'merged_at']);
        });

        Schema::create('resolution_verifications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submitted_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('outcome', 32)->nullable();
            $table->string('state', 24)->default('pending');
            $table->text('statement')->default('');
            $table->string('method', 24)->default('text');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('superseded_at')->nullable();
            $table->timestamps();
            $table->index(['report_id', 'superseded_at']);
            $table->index(['state', 'verified_at']);
        });

        Schema::create('audit_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type', 24);
            $table->string('auditable_type', 120);
            $table->string('auditable_id', 36);
            $table->string('event', 80);
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->json('context')->nullable();
            $table->uuid('request_id')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['auditable_type', 'auditable_id', 'created_at'], 'audit_subject_idx');
            $table->index(['event', 'created_at']);
            $table->index('request_id');
        });

        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('scope', 80);
            $table->string('key', 120);
            $table->char('request_hash', 64);
            $table->unsignedSmallInteger('response_code')->nullable();
            $table->json('response_body')->nullable();
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
            $table->unique(['scope', 'key']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
        Schema::dropIfExists('audit_events');
        Schema::dropIfExists('resolution_verifications');
        Schema::dropIfExists('report_merges');
        Schema::dropIfExists('duplicate_matches');
        Schema::dropIfExists('report_assignments');
        Schema::dropIfExists('status_events');
        Schema::dropIfExists('report_notes');
        Schema::dropIfExists('evidence');
        Schema::dropIfExists('transcript_segments');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('report_sequences');
        Schema::dropIfExists('sla_rules');
        Schema::dropIfExists('areas');
    }
};
