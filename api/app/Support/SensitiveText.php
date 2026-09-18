<?php

namespace App\Support;

final class SensitiveText
{
    public static function redact(string $text): string
    {
        $patterns = [
            '/\b\d{13}\b/' => '[SA ID REDACTED]',
            '/\b(?:\+27|0)\s?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/' => '[PHONE REDACTED]',
            '/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i' => '[EMAIL REDACTED]',
            '/\b(?:unit|flat|house)\s+\d+[A-Za-z]?\b/i' => '[PRIVATE ADDRESS REDACTED]',
        ];

        return trim((string) preg_replace(array_keys($patterns), array_values($patterns), $text));
    }

    public static function publicLocation(string $address, ?string $landmark = null): string
    {
        $looksResidential = preg_match('/^(?:\d{1,5}\s+|unit\b|flat\b|house\b)/i', trim($address)) === 1;

        return $looksResidential ? (trim((string) $landmark) ?: 'Approximate location') : self::redact($address);
    }
}
